const {Context, CircleMask, ColorMap, Clock} = require("./graphics");
const {generateDelta, scaleData} = require("./sonarScan");
const SonarFile = require("./sonarReplay");
const {EventEmitter} = require("events");

const {deltaX, deltaY} = generateDelta();

const scanLineCnt = 7200,
    scanPerAngle = 18;

class PPI {
    constructor(canvas, graphSize = 800) {
        this.context = new Context(canvas, graphSize);
        this.center = [this.context.windowSize / 2 - 10, this.context.windowSize / 2];

        this.headDown = true;
        this.grid = true;
        this.flag = true;

        this.frequency = 0;
        this.gain = 0;

        this.scanAngle = 0;
        this.scanRadius = graphSize / 2;
        this.scanRange = 5;

        this.replaySpeed = 1;

        window.onresize = () => {
            if(!this.updated) {
                this.updated = true;
                setTimeout(() => {
                    this.updated = false;
                    this.context = new Context(canvas, graphSize);
                    this.center = [this.context.windowSize / 2, this.context.windowSize / 2];
                    this.scanRadius = graphSize / 2;
                    this.measureLine = false;
                });
            }
        };

        this.baseMask = new CircleMask(graphSize, graphSize, this.scanRadius, this.scanRadius, this.scanRadius);
        this.baseMask.consolidate();
        this.grayScale = [];
        for (let i = 0; i < this.scanRadius * this.scanRadius * 4; i++) {
            this.grayScale[i] = 0;
        }

        this.colorMap = new ColorMap();
        this.connection = false;
        this.smode = 0;
        this.dispmode = 0; // 识别符

        //设置最小量程(对于不同的
        this.minRange = 180;
        this.clearMinRange = true;

        this.measureLine = false;
        this.measuring = false;
        this.measureStart = [];
        this.measureEnd = [];
        this.stick = true;

        this.AScanLine = false;
        this.AScanAngle = 0;
        this.AScanBuf = 0;
        this.AScanProfile = 0;

        this.soundSpeed = 1485;

        this.profile = 0; // 0: 图像叠加, 1: 仅剖面， 2: 仅图像

        this.events = new EventEmitter(); // 接收其他线程中的事件

        // 开启重绘线程
        this.drawFrame();
        this.redrawThread = new Clock(50);
        this.redrawThread.run((timePassed) => {
            this.update(timePassed);
        });

        this.curFile = new SonarFile();
        this.scanThread = new Clock(50);
        this.scanThread.run(() => {
            if(this.smode === 1) {
                if(this.curFile.fd) {
                    if(this.replaySpeed > 1)
                        for(let i = 0; i < this.replaySpeed; i++) this.replaySonarFile();
                    else this.replaySonarFile();
                }
            }
        });

        // 测量
        $(canvas).on("mousedown", (ev) => {
            if(this.measureLine) this.measureLine = false;
            else if (((ev.offsetX - this.center[0]) * (ev.offsetX - this.center[0]) + (ev.offsetY - this.center[1]) * (ev.offsetY - this.center[1])) < this.scanRadius * this.scanRadius) {
                this.measureLine = true;
                this.measuring = true;
                if(this.stick && ((ev.offsetX - this.center[0]) * (ev.offsetX - this.center[0]) + (ev.offsetY - this.center[1]) * (ev.offsetY - this.center[1])) < 10 * 10) {
                    this.measureStart = this.center;
                } else {
                    this.measureStart = [ev.offsetX, ev.offsetY];
                }
                this.measureEnd = this.measureStart;
            }
        });

        $(canvas).on("click", () => {
            this.measuring = false;
            if(this.AScanLine === true) {
                this.center[0] += 20;
                this.AScanBuf = [];
                this.AScanProfile = 0;
            }
            this.AScanLine = false;
        });

        $(canvas).on("mouseup", () => {
            this.measuring = false;
        });

        $(canvas).on("mousemove", (ev) => {
            if(this.measuring)
                if (((ev.offsetX - this.center[0]) * (ev.offsetX - this.center[0]) + (ev.offsetY - this.center[1]) * (ev.offsetY - this.center[1])) < this.scanRadius * this.scanRadius) {
                    if(this.stick && ((ev.offsetX - this.center[0]) * (ev.offsetX - this.center[0]) + (ev.offsetY - this.center[1]) * (ev.offsetY - this.center[1])) < 10 * 10)
                        this.measureEnd = this.center;
                    else
                        this.measureEnd = [ev.offsetX, ev.offsetY];
                } else {
                    // 后面是一堆解析几何运算
                    let k = (ev.offsetY - this.measureStart[1]) / (ev.offsetX - this.measureStart[0]), // 直线斜率
                        A = k * this.center[0] - this.center[1],
                        B = this.measureStart[1] - k * this.measureStart[0],
                        C = A + B,
                        k1 = this.scanRadius * k,
                        k2 = -this.scanRadius,
                        a = k1 * k1 + k2 * k2,
                        b = 2 * C * k2,
                        c = C * C - k1 * k1;

                    // 解方程求出cos\theta, 注意需要验根
                    let delta = b * b - 4 * a * c,
                        q1 = (-b + Math.sqrt(delta)) / 2 / a,
                        q2 = (-b - Math.sqrt(delta)) / 2 / a,
                        p1 = -(k2 * q1 + C) / k1,
                        p2 = -(k2 * q2 + C) / k1;

                    // 验根, 利用向量点乘
                    let x1 = p1 * this.scanRadius + this.center[0],
                        x2 = p2 * this.scanRadius + this.center[0],
                        y1 = q1 * this.scanRadius + this.center[1],
                        y2 = q2 * this.scanRadius + this.center[1];
                    if(((x1 - this.measureStart[0]) * (x1 - ev.offsetX) + (y1 - this.measureStart[1]) * (y1 - ev.offsetY)) < 0) {
                        this.measureEnd = [Math.floor(x1), Math.floor(y1)];
                    } else {
                        this.measureEnd = [Math.floor(x2), Math.floor(y2)];
                    }
                }
        });

        $(canvas).on("dblclick", (ev) => {
            this.measureLine = false;
            if(this.AScanLine === false) this.center[0] -= 20;
            this.AScanLine = true;
            if(ev.offsetX > this.center[0] || (ev.offsetX === this.center[0] && ev.offsetY > this.center[1]))
                this.AScanAngle = Math.atan((ev.offsetY - this.center[1]) / (ev.offsetX - this.center[0]));
            else
                this.AScanAngle = Math.atan((ev.offsetY - this.center[1]) / (ev.offsetX - this.center[0])) + Math.PI;
        });
    }

    drawFrame() {
        let angle = this.scanAngle;
        if(!this.headDown) angle = -angle;
        let ctx = this.context.ctx;
        /**
         * 绘制线类元素, 包括外圈, 扫描线, 栅格
         */
        ctx.beginPath();
        ctx.arc(this.center[0], this.center[1],
            this.scanRadius,
            0, 2 * Math.PI);
        if(this.flag) {
            ctx.moveTo(this.center[0], this.center[1]);
            ctx.lineTo(this.scanRadius * Math.cos(-Math.PI / 2 - angle * Math.PI / 180) + this.center[0],
                this.scanRadius * Math.sin(-Math.PI / 2 - angle * Math.PI / 180) + this.center[1]);
        }
        if(this.grid) {
            this.drawGrid(ctx);
        }
        ctx.strokeStyle = "white";
        ctx.stroke();
        /**
         * 绘制块元素, 包括扫描标志
         */
        if(this.flag) {
            ctx.beginPath();
            let radian = -Math.PI / 2 - angle * Math.PI / 180,
                startX = this.scanRadius * Math.cos(radian) + this.center[0],
                startY = this.scanRadius * Math.sin(radian) + this.center[1];
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + 10 * Math.cos(-Math.PI / 6 + radian), startY + 10 * Math.sin(-Math.PI / 6 + radian));
            ctx.lineTo(startX + 10 * Math.cos(Math.PI / 6 + radian), startY + 10 * Math.sin(Math.PI / 6 + radian));
            ctx.closePath();
            ctx.fillStyle = "black";
            ctx.fill();
        }
        /**
         * 绘制提示文字
         */
        ctx.font = "18px bold 黑体";
        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        if(this.smode === 0)
            ctx.fillText("实时模式", 0, this.context.windowSize - 100);
        else
            ctx.fillText("回放模式", 0, this.context.windowSize - 100);

        if(this.connection || this.smode === 1) {
            ctx.fillText("频率: " + ((this.frequency === 0)?"自动":((this.frequency === 40)?"低频":"高频")), 0, this.context.windowSize - 80);
            ctx.fillText("增益: " + this.gain + "%", 0, this.context.windowSize - 60);
            ctx.fillText("量程: " + this.scanRange + "m", 0, this.context.windowSize - 40);
        } else {
            ctx.fillText("正在连接声呐...", 0, this.context.windowSize - 80);
        }
        /**
         * 绘制色表
         */
        let CTRange = ctx.getImageData(this.context.windowSize - 10, 0, 10, this.context.windowSize);

        let CMRaw = this.colorMap.colorMap;
        let CMProcessed = [];
        if(CMRaw.length < this.context.windowSize) { // 进行插值
            let step = CMRaw.length / this.context.windowSize;
            for(let i = 0; i < this.context.windowSize; i++) {
                let floor = Math.floor(i * step);
                let disToFloor = i * step - floor;
                if(floor === 255) {
                    CMProcessed[i] = [CMRaw[floor][0], CMRaw[floor][1], CMRaw[floor][2]];
                } else {
                    CMProcessed[i] = [disToFloor * CMRaw[floor][0] + (1 - disToFloor) * CMRaw[floor + 1][0],
                        disToFloor * CMRaw[floor][1] + (1 - disToFloor) * CMRaw[floor + 1][1],
                        disToFloor * CMRaw[floor][2] + (1 - disToFloor) * CMRaw[floor + 1][2]
                    ];
                }
            }
        }

        for(let i = 0; i < this.context.windowSize; i++) {
            for(let j = 0; j < 10; j++) {
                let pos = i * 10 + j;
                CTRange.data[pos * 4] = CMProcessed[i][0];
                CTRange.data[pos * 4 + 1] = CMProcessed[i][1];
                CTRange.data[pos * 4 + 2] = CMProcessed[i][2];
                CTRange.data[pos * 4 + 3] = 255;
            }
        }
        ctx.putImageData(CTRange, this.context.windowSize - 10, 0);
        /**
         * 绘制测量线
         */
        if(this.measureLine) {
            ctx.beginPath();
            ctx.moveTo(this.measureStart[0], this.measureStart[1]);
            ctx.lineTo(this.measureEnd[0], this.measureEnd[1]);
            ctx.stroke();
            if(Math.floor(Math.sqrt((this.measureStart[0] - this.measureEnd[0]) * (this.measureStart[0] - this.measureEnd[0]) +
                (this.measureStart[1] - this.measureEnd[1]) * (this.measureStart[1] - this.measureEnd[1])) / this.scanRadius * this.scanRange * 10) / 10 !== 0)
                ctx.fillText(
                    Math.floor(Math.sqrt((this.measureStart[0] - this.measureEnd[0]) * (this.measureStart[0] - this.measureEnd[0]) +
                        (this.measureStart[1] - this.measureEnd[1]) * (this.measureStart[1] - this.measureEnd[1])) / this.scanRadius * this.scanRange * 10) / 10
                    + "m", this.measureEnd[0], this.measureEnd[1])
        }
        /**
         * 绘制AScan
         */
        if(this.AScanLine) {
            ctx.beginPath();
            ctx.moveTo(this.center[0], this.center[1]);
            ctx.lineTo(this.center[0] + this.scanRadius * Math.cos(this.AScanAngle), this.center[1] + this.scanRadius * Math.sin(this.AScanAngle));
            for(let i = 0 ; i < 101; i++) {
                ctx.moveTo(this.context.windowSize - 10, this.context.windowSize - 30 - Math.floor((this.context.windowSize - 50) / 100 * i));
                ctx.lineTo(this.context.windowSize - 19, this.context.windowSize - 30 - Math.floor((this.context.windowSize - 50) / 100 * i));
            }

            ctx.moveTo(this.context.windowSize - 20, this.context.windowSize - 30);
            let f = (this.context.windowSize - 50) / this.AScanBuf.length;
            for(let i = 0 ; i < this.AScanBuf.length; i++) {
                ctx.lineTo(this.context.windowSize - 20 - this.AScanBuf[i] / 255 * 40, this.context.windowSize - 30 - Math.floor(i * f))
            }
            ctx.stroke();
            if(this.AScanProfile) {
                ctx.textBaseline = "top";
                ctx.fillText(Math.floor(this.AScanProfile * 100) / 100, this.context.windowSize - 40, this.context.windowSize - 20)
            }
        }
    }

    /**
     * 由于网格较为复杂, 单独将它抽出
     */
    drawGrid(ctx) {
        // 首先画出极线
        ctx.moveTo(this.center[0] - this.scanRadius, this.center[1]);
        ctx.lineTo(this.center[0] + this.scanRadius, this.center[1]);
        ctx.moveTo(this.center[0], this.center[1] - this.scanRadius);
        ctx.lineTo(this.center[0], this.center[1] + this.scanRadius);
        ctx.font = "18px bold 黑体";
        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        for(let i = 0; i < 5; i++) {
            ctx.arc(this.center[0], this.center[1],
                this.scanRadius * i / 5,
                0, 2 * Math.PI);
            if(i !== 0)
                ctx.fillText((this.scanRange * i / 5).toString(), this.center[0] + this.scanRadius * i / 5, this.center[1]);
        }
    }

    update(timePassed) {
        // this.scanAngle += this.scanSpeed * this.replaySpeed * timePassed / 1000;
        this.context.redraw();
        this.colorMap.blitWithMask(this.grayScale, this.context, this.baseMask, this.center[0] - this.scanRadius, this.center[1] - this.scanRadius);
        this.drawFrame();
    }

    setTickRate(tickRate) {
        this.redrawThread.updateTickRate(tickRate);
    }

    /**
     * 获取下位机信息后进行扫描
     * @param data
     */
    receiveSonarData(data) {
        if(this.smode === 1) return; // 当前处于回放模式, 不进行显示
        this.connection = true;

        if(this.clearMinRange)
            data.data = this.processMinRange(data.data, data.length);
        data.data = this.processProfile(data.data, data.length);
        if(this.AScanLine)
            if(Math.abs(3 * Math.PI / 2 - data.header.m_nAngle * 0.45 * Math.PI / 180 - this.AScanAngle) <= Math.PI / 360) {
                this.AScanBuf = data.data.slice(0, data.length);
                let profile = data.data[data.length];
                profile += data.data[data.length + 1] << 7;
                this.AScanProfile = profile * 2.5e-6 * this.soundSpeed / 2.0;
            }

        let dA = data.header.m_nAngle*0.45;
        this.scanAngle = data.header.m_nAngle*0.45;
        this.scanRange = data.header.ucRange;
        this.frequency = data.header.ucFreq;
        this.gain = data.header.ucGain;

        this.scan(dA, data.data, data.length);

        // TODO: 将数据写入回放文件
    }

    /**
     * 从当前回放文件中进行一帧回放
     */
    replaySonarFile() {
        if(!this._last_buf) this._last_buf = [];
        if(typeof this._last_angle !== "number") this._last_angle = 1000;

        let res;
        try {
            res = this.curFile.read();
        } catch(err) {
            this.events.emit("error", err.message);
            throw err;
        }
        if(!res) return;

        if(this.clearMinRange)
            res.data = this.processMinRange(res.data, res.length);
        res.data = this.processProfile(res.data, res.length);
        if(this.AScanLine)
            if(Math.abs(3 * Math.PI / 2 - res.header.m_nAngle * 0.45 * Math.PI / 180 - this.AScanAngle) <= Math.PI / 360) {
                this.AScanBuf = res.data.slice(0, res.length);
                let profile = res.data[res.length];
                profile += res.data[res.length + 1] << 7;
                this.AScanProfile = profile * 2.5e-6 * this.soundSpeed / 2.0;
            }
/*
        // PPI要进行插值, 先扫描插值数据
        for(let i = 0; i < res.length; i++) {
            this._last_buf[i] = (this._last_buf[i] + res.data[2]) / 2;
        }

        let step = res.header.m_nAngle - this._last_angle;

        if(Math.abs(step) === 2) { // 0.9°，填充0.45°一步
            let dA = (this._last_angle - res.header.m_nAngle) * 0.225;
            this.scan(dA, res.data);
        } else if(Math.abs(step) === 798) { // 跨0，补799
            let dA = 341.55;
            this.scan(dA, res.data);
        }
*/
        this._last_buf = res.data;
        this._last_angle = res.header.m_nAngle;
        this.scanAngle = res.header.m_nAngle*0.45;
        this.scanRange = res.header.ucRange;
        this.frequency = res.header.ucFreq;
        this.gain = res.header.ucGain;

        setTimeout(() => {
            let dA = res.header.m_nAngle*0.45;
            this.scan(dA, res.data, res.length);
        }, 2.5)
    }

    processMinRange(data, len) {
        let minSample = Math.floor(this.minRange * len / this.scanRange / 1000);
        console.log(minSample);
        while(minSample >= 0) data[minSample--] = 0;
        return data;
    }

    processProfile(data, len) {
        if(this.profile === 1) { // 仅Profile, 清除data
            for(let i = 0; i < len; i++) data[i] = 0;
        }

        if(this.profile !== 2) { // 结合模式
            let profile = data[len];
            profile += data[len + 1] << 7;
            let profileRange = profile * 2.5e-6 * this.soundSpeed / 2.0 / this.scanRange;
            let pos = Math.floor(profileRange * len);
            if(profileRange > 1) pos = len - 1;
            data[pos] = 255;
            data[pos + 1] = 0;
        }
        return data;
    }

    /**
     * 生成声呐扫描图像
     * @param angle: 扫描线所在角度(扫描扇中心角), 单位为度
     * @param buffer: 声呐数据
     * @param len: buffer的有效长度
     * @param step: 扫描步距角，以度为单位
     */
    scan(angle, buffer, len, step = 1) {
        // 使角度范围保持在0到360之间
        while(angle >= 360) angle -= 360;
        if(this.headDown) {
            angle = -angle;
            while(angle < 0) angle += 360;
        }

        let scans = Math.floor(scanPerAngle * step) + 1; // 扇区跨过扫描线的数量
        let idx = Math.floor(angle * scanLineCnt / 360 - scans / 2); // 起始扫描线位置

        if(idx < 0) idx += scanLineCnt; // 使位置始终为正值

        let displayBuffer = scaleData(buffer, len,  this.scanRadius);

        for(let i = 0; i < scans; i++) {
            let x1 = this.scanRadius,
                y1 = this.scanRadius;

            for(let j = 0; j < this.scanRadius; j++) {
                x1 += deltaX[idx];
                y1 += deltaY[idx];

                let x = Math.floor(x1),
                    y = Math.floor(y1);

                // 奇异值处理
                if(x > this.scanRadius * 2 || y > this.scanRadius * 2) continue;
                if(x < 0 || y < 0) continue;

                let index = y * this.scanRadius * 2 + x;
                this.grayScale[index] = Math.floor(displayBuffer[j]);
            }

            idx++;
            if(idx >= scanLineCnt) idx = 0;
        }
    }

    /**
     * 改变模式(Sonar, Replay)
     * @param mode: 0为从声呐接收数据, 1为回放
     * @param fn: 当设置为回放时要打开的回放文件
     */
    mode(mode, fn) {
        this.scanThread.pause();
        this.smode = mode;
        if (mode === 0) {
            this.curFile.close();
            for (let i = 0; i < this.scanRadius * this.scanRadius * 4; i++) {
                this.grayScale[i] = 0;
            }
        } else {
            this.curFile.open(fn);
            for (let i = 0; i < this.scanRadius * this.scanRadius * 4; i++) {
                this.grayScale[i] = 0;
            }
        }
        this.scanThread.restart();
    }

    loadColorMap(fn) {
        ColorMap.fromFile(fn).then((cm) => {
            this.colorMap = cm;
        });
    }

    stop() {
        this.redrawThread.stop();
        if(this.scanThread)
            this.scanThread.stop();
    }
}

module.exports = PPI;