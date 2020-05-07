const {Context, CircleMask, ColorMap, Clock} = require("./graphics");

class PPI {
    constructor(canvas, graphSize = 500) {
        this.context = new Context(canvas, graphSize);
        this.center = [this.context.windowSize / 2, this.context.windowSize / 2];
        this.scanAngle = 0;
        this.scanSpeed = Math.PI / 2;
        this.scanRadius = graphSize / 2;

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

        this.drawFrame();
        this.redrawThread = new Clock(1000);
        this.redrawThread.run((timePassed) => {
            this.update(timePassed);
        })
    }

    drawFrame() {
        let ctx = this.context.ctx;
        ctx.arc(this.center[0], this.center[1],
            this.scanRadius,
            0, 2 * Math.PI);
        ctx.moveTo(this.center[0], this.center[1]);
        ctx.lineTo(this.scanRadius * Math.cos(this.scanAngle) + this.center[0],
            this.scanRadius * Math.sin(this.scanAngle) + this.center[1]);
        ctx.stroke();
    }

    update(timePassed) {
        this.scanAngle += this.scanSpeed * timePassed / 1000;
        this.context.redraw();



        this.colorMap.blitWithMask(this.grayScale, this.context, this.baseMask, this.center[0] - this.scanRadius, this.center[1] - this.scanRadius);
        this.drawFrame();
    }

    setTickRate(tickRate) {
        this.redrawThread.updateTickRate(tickRate);
    }
}

module.exports = PPI;