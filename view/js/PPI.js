const {Context, CircleMask, ColorMap, Clock} = require("./graphics");
const {generateDelta, scaleData} = require("./sonarScan");
const SonarFile = require("./sonarReplay");
const {EventEmitter} = require("events");

const {deltaX, deltaY} = generateDelta();

const scanLineCnt = 7200,
    scanPerAngle = 18;

class PPI {
    constructor(canvas, graphSize = 500) {
        this.context = new Context(canvas, graphSize);
        this.center = [this.context.windowSize / 2, this.context.windowSize / 2];

        this.headDown = true;

        this.scanAngle = 0;
        this.scanSpeed = 90;
        this.scanRadius = graphSize / 2;

        this.replaySpeed = 1;

        window.onresize = () => {
            if(!this.updated) {
                this.updated = true;
                setTimeout(() => {
                    this.updated = false;
                    this.context = new Context(canvas, graphSize);
                    this.center = [this.context.windowSize / 2, this.context.windowSize / 2];
                    this.scanRadius = graphSize / 2;
                });
            }
        };

        this.baseMask = new CircleMask(graphSize, graphSize, this.scanRadius, this.scanRadius, this.scanRadius);
        this.baseMask.consolidate();
        this.grayScale = [];
        for(let i = 0; i < graphSize * graphSize; i++) {
            this.grayScale[i] = i % 255;
        }

        this.colorMap = new ColorMap();

        this.events = new EventEmitter(); // 接收其他线程中的事件

        // 开启重绘线程
        this.drawFrame();
        this.redrawThread = new Clock(1000);
        this.redrawThread.run((timePassed) => {
            this.update(timePassed);
        });

        this.curFile = new SonarFile();
        this.scanThread = new Clock(100);
        this.scanThread.run(() => {
            if(this.mode === 1) {
                if(this.curFile.fd) {
                    if(this.replaySpeed > 1)
                        for(let i = 0; i < this.replaySpeed; i++) this.replaySonarFile();
                    else this.replaySonarFile();
                }
            } else {
                // TODO: 声呐PPI
            }
        });
    }

    drawFrame() {
        let ctx = this.context.ctx;
        ctx.arc(this.center[0], this.center[1],
            this.scanRadius,
            0, 2 * Math.PI);
        //ctx.moveTo(this.center[0], this.center[1]);
        //ctx.lineTo(this.scanRadius * Math.cos(-this.scanAngle * Math.PI / 180) + this.center[0],
        //    this.scanRadius * Math.sin(-this.scanAngle * Math.PI / 180) + this.center[1]);
        ctx.stroke();
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
        this.scanAngle = res.header.m_nAngle;

        setTimeout(() => {
            let dA = res.header.m_nAngle*0.45;
            this.scan(dA, res.data);
        }, 2.5)
    }

    /**
     * 生成声呐扫描图像
     * @param angle: 扫描线所在角度(扫描扇中心角), 单位为度
     * @param buffer: 声呐数据
     * @param step: 扫描步距角，以度为单位
     */
    scan(angle, buffer, step = 1) {

        // 使角度范围保持在0到360之间
        while(angle >= 360) angle -= 360;
        if(this.headDown) {
            angle = -angle;
            while(angle < 0) angle += 360;
        }

        let scans = Math.floor(scanPerAngle * step) + 1; // 扇区跨过扫描线的数量
        let idx = Math.floor(angle * scanLineCnt / 360 - scans / 2); // 起始扫描线位置

        if(idx < 0) idx += scanLineCnt; // 使位置始终为正值

        let displayBuffer = scaleData(buffer, this.scanRadius);

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
        if(mode !== this.mode) {
            this.scanThread.pause();
            this.mode = mode;
            if(mode === 0) {
                this.curFile.close();
                for(let i = 0; i < this.scanRadius * this.scanRadius * 4; i++) {
                    this.grayScale[i] = i % 255;
                }
            } else {
                this.curFile.open(fn);
                for(let i = 0; i < this.scanRadius * this.scanRadius * 4; i++) {
                    this.grayScale[i] = 0;
                }
            }
            this.scanThread.restart();
        }
    }
}

module.exports = PPI;