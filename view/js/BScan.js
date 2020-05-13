const {Context, ColorMap, Clock} = require("./graphics");
const {scaleData} = require("./sonarScan");
const SonarFile = require("./sonarReplay");
const {EventEmitter} = require("events");

class BScan {
    constructor(canvas, graphSize = 800) {
        this.context = new Context(canvas, graphSize);
        this.center = [this.context.windowSize / 2 - 10, this.context.windowSize / 2];

        this.headDown = true;
        this.grid = true;
        this.flag = true;

        this.frequency = 0;
        this.gain = 0;

        this.scanAngle = 0;
        this.scanRadius = Math.floor(graphSize / 2); // ScanRadius???????, ???????????
        this.scanWidth = this.context.windowSize - 10; // ??????????
        this.scanRange = 5;

        this.replaySpeed = 1;

        this.grayScale = [];
        for (let i = 0; i < this.scanRadius * this.scanWidth; i++) {
            this.grayScale[i] = 0;
        }

        window.onresize = () => {
            if(!this.updated) {
                this.updated = true;
                setTimeout(() => {
                    this.updated = false;
                    this.context = new Context(canvas, graphSize);
                    this.center = [this.context.windowSize / 2, this.context.windowSize / 2];
                    this.scanRadius = Math.floor(graphSize / 2);
                    this.scanWidth = this.context.windowSize - 10; // ??????????
                    this.measureLine = false;

                    this.grayScale = [];
                    for (let i = 0; i < this.scanRadius * this.scanWidth; i++) {
                        this.grayScale[i] = 0;
                    }
                });
            }
        };

        this.colorMap = new ColorMap();
        this.connection = false;
        this.smode = 0;
        this.dispmode = 1;

        //??????С????(????????
        this.minRange = 180;
        this.clearMinRange = true;

        this.soundSpeed = 1485;

        this.profile = 0; // 0: ??????, 1: ?????棬 2: ?????

        this.events = new EventEmitter(); // ????????????е????

        // ??????????
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

        /**
         * B???в??????AScan
         */
    }

    drawFrame() {
        let angle = this.scanAngle;
        if(!this.headDown) angle = -angle;
        angle = angle < 180 ? (angle + 180) : (angle - 180)
        let ctx = this.context.ctx;
        /**
         * 绘制线类元素, 包括外圈, 扫描线, 栅格
         */
        ctx.beginPath();
        ctx.moveTo(0, this.center[1] - this.scanRadius / 2);
        ctx.lineTo(this.scanWidth, this.center[1] - this.scanRadius / 2);
        ctx.lineTo(this.scanWidth, this.center[1] + this.scanRadius / 2);
        ctx.lineTo(0, this.center[1] + this.scanRadius / 2);
        ctx.closePath();
        ctx.moveTo(angle / 360 * this.scanWidth, this.center[1] - this.scanRadius / 2);
        ctx.lineTo(angle / 360 * this.scanWidth, this.center[1] + this.scanRadius / 2);
        ctx.strokeStyle = "white";
        ctx.stroke();
        /**
         * 绘制块元素, 包括扫描标志
         */
        if(this.flag) {
            ctx.beginPath();
            let startX = this.scanAngle / 360 * this.scanWidth,
                startY = this.center[1] + this.scanWidth * 2;
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX - 5, startY + 10 * Math.sin(Math.PI / 3));
            ctx.lineTo(startX + 5, startY + 10 * Math.sin(Math.PI / 3));
            ctx.closePath();
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.beginPath();
            startY = this.center[1] - this.scanWidth * 2;
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX - 5, startY - 10 * Math.sin(Math.PI / 3));
            ctx.lineTo(startX + 5, startY - 10 * Math.sin(Math.PI / 3));
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
        if(CMRaw.length < this.context.windowSize) { // ???в??
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
    }

    update(timePassed) {
        this.context.redraw();
        this.colorMap.blit(this.grayScale, this.context, 0, this.center[1] - this.scanRadius / 2, this.scanWidth, this.scanRadius);
        this.drawFrame();
    }

    setTickRate(tickRate) {
        this.redrawThread.updateTickRate(tickRate);
    }

    /**
     * ?????λ?????????????
     * @param data
     */
    receiveSonarData(data) {
        if(this.smode === 1) return; // ???????????, ?????????
        this.connection = true;

        if(this.clearMinRange)
            data.data = this.processMinRange(data.data, data.length);
        data.data = this.processProfile(data.data, data.length);

        let dA = data.header.m_nAngle*0.45;
        this.scanAngle = data.header.m_nAngle*0.45;
        this.scanRange = data.header.ucRange;
        this.frequency = data.header.ucFreq;
        this.gain = data.header.ucGain;

        this.scan(dA, data.data, data.length);

        // TODO: ??????д???????
    }

    /**
     * ???????????н????????
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
        if(this.profile === 1) { // ??Profile, ???data
            for(let i = 0; i < len; i++) data[i] = 0;
        }

        if(this.profile !== 2) { // ?????
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
     * ??????????????
     * @param angle: ???????????(??????????), ??λ???
     * @param buffer: ????????
     * @param len: buffer????Ч????
     * @param step: ??貽??????????λ
     */
    scan(angle, buffer, len, step = 1) {
        // ?????Χ??????0??360???
        while(angle >= 360) angle -= 360;
        if(!this.headDown) {
            angle = -angle;
            while(angle < 0) angle += 360;
        }

        let scans = Math.floor(this.scanWidth / 360 * step) + 1; // ?????????????????
        let x = Math.floor((angle < 180 ? (angle + 180) : (angle - 180)) / 360 * this.scanWidth);

        let displayBuffer = scaleData(buffer, len,  this.scanRadius);

        for(let i = 0; i < scans; i++) {
            let y, dy;

            if(this.headDown) {
                y = 0;
                dy = 1
            } else {
                y = this.scanRadius - 1;
                dy = -1;
            }

            for(let j = 0; j < this.scanRadius; j++) {
                // ?????????
                if(x >= this.scanWidth || y >= this.scanRadius) continue;
                if(x < 0 || y < 0) continue;

                let index = j * this.scanWidth + x;
                this.grayScale[index] = Math.floor(displayBuffer[j]);
            }

            x++;
            if(x >= this.scanWidth) x = 0;
        }
    }

    /**
     * ?????(Sonar, Replay)
     * @param mode: 0??????????????, 1????
     * @param fn: ????????????????????
     */
    mode(mode, fn) {
        this.scanThread.pause();
        this.smode = mode;
        if (mode === 0) {
            this.curFile.close();
            for (let i = 0; i < this.scanWidth * this.scanRadius; i++) {
                this.grayScale[i] = 0;
            }
        } else {
            this.curFile.open(fn);
            for (let i = 0; i < this.scanWidth * this.scanRadius; i++) {
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

module.exports = BScan;