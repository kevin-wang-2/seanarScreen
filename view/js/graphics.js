let {scaleData} = require("./sonarScan");
let fs = require("fs");

function assert(statement) {
    if (!statement) throw Error("Assert Error");
}

/*
 * RGBA颜色
 */
function Color(r, g, b, a = 100) {
    return {
        r: r,
        g: g,
        b: b,
        a: a,
        /*
         * ImageData格式的颜色矩阵
         */
        toArray: function () {
            return [this.r, this.g, this.b, this.a]
        },
        /*
         * 十六进制颜色, 无alpha
         */
        toHex: function () {
            return this.r * 256 * 256 + this.g * 256 + this.b;
        }
    }
}


/*******
 为位图与ImageData兼容准备的一些辅助函数
 ******/

Array.prototype.toUint8ClampedArray = function () {
    let ret = new Uint8ClampedArray(this.length);
    this.forEach((item, cnt) => {
        ret[cnt] = item;
    });
    return ret;
};


/**
 * 255级灰度
 */
class ColorMap {
    constructor(map) {
        if (map) { // 现成色表, 以ImageData的数组格式加载
            this.colorMap = [];
            if(map.length === 256) { // Matlab导出的灰度图, 需要插值
                for (let i = 0; i < map.length - 3; i += 4) {
                    this.colorMap[i] = [
                        map[i],
                        map[i + 1],
                        map[i + 2],
                        255
                    ];
                    this.colorMap[i + 1] = [
                        Math.floor((3 * map[i] + map[i + 4]) / 4),
                        Math.floor((3 * map[i + 1] + map[i + 5]) / 4),
                        Math.floor((3 * map[i + 2] + map[i + 6]) / 4),
                        255
                    ];
                    this.colorMap[i + 2] = [
                        Math.floor((2 * map[i] + 2 * map[i + 4]) / 4),
                        Math.floor((2 * map[i + 1] + 2 * map[i + 5]) / 4),
                        Math.floor((2 * map[i + 2] + 2 * map[i + 6]) / 4),
                        255
                    ];
                    this.colorMap[i + 3] = [
                        Math.floor((map[i] + 3 * map[i + 4]) / 4),
                        Math.floor((map[i + 1] + 3 * map[i + 5]) / 4),
                        Math.floor((map[i + 2] + 3 * map[i + 6]) / 4),
                        255
                    ];
                }
                this.colorMap[255] = [
                    map[252],
                    map[253],
                    map[254],
                    map[255]
                ]
            } else {
                for(let i = 0; i < 256; i++) {
                    this.colorMap[i] = [
                        map[i * 3],
                        map[i * 3 + 1],
                        map[i * 3 + 2],
                        255
                    ];
                }
            }
        } else { // 生成标准灰度色表
            this.colorMap = [];
            for (let i = 0; i < 256; i++) {
                this.colorMap[i] = [i, i, i, 255];
            }
        }
    }

    /**
     * 从文件加载色表, 注意JS的图片加载是异步操作
     * @param file: 文件名
     */
    static async fromFile(file) {
        return new Promise((resolve) => {
            if(!file) {
                resolve(new ColorMap());
            } else if(file.substr(file.lastIndexOf(".")) === ".bin") {
                resolve(new ColorMap(fs.readFileSync(file).toJSON().data));
            } else {
                let CMFile = new Image();
                CMFile.src = file;
                CMFile.onload = () => {
                    let tempCanvas = document.createElement("canvas");
                    tempCanvas.width = CMFile.width;
                    tempCanvas.height = CMFile.height;
                    let ctx = tempCanvas.getContext("2d");
                    ctx.drawImage(CMFile, 0, 0);
                    let imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                    resolve(new ColorMap(imgData.data));
                }
            }
        })
    }

    /**
     * 将灰度颜色转换为伪彩色
     * @param grayScale: 一个灰度值或者是值数组
     */
    toPseudoColor(grayScale) {
        if (grayScale[0]) { // 处理一个数组的伪彩色, 返回的是imageData格式数组
            let ret = [];
            grayScale.forEach((item) => {
                ret.concat(this.colorMap[item]);
            });
            return ret;
        } else { // 处理一个像素的颜色
            return this.colorMap[grayScale];
        }
    }

    /**
     * 将一个灰度图画到canvas的context中
     * @param grayScale: 灰度图数组, 以ImageData的格式输入
     * @param context: 目标Context, 兼容原生JS的Context对象以及这里的Context对象
     * @param x
     * @param y: 这两个值是目标左上的位置也是到时imageData被画到的地方
     * @param w
     * @param h: 这两个值是目标灰度图的宽高, 如果不指定那么就假定灰度图是正方形
     */
    blit(grayScale, context, x = 0, y = 0, w = 0, h = 0) {
        assert(typeof grayScale[0] === "number");

        if (context.isContext) context = context.ctx; // 确保一下兼容性, 反正不用Context类的重绘
        assert(context.getImageData && context.putImageData);

        if (w === 0 || h === 0) { // 不指定宽高
            w = h = Math.floor(Math.sqrt(grayScale.length));
        }

        let imageData = new ImageData(Array.toUint8ClampedArray(this.toPseudoColor(grayScale)), w, h);
        context.putImageData(imageData);
    }

    /**
     * 将一个带蒙版灰度图画到canvas的context中
     * @param grayScale: 灰度图数组, 以ImageData的格式输入
     * @param context: 目标Context, 兼容原生JS的Context对象以及这里的Context对象
     * @param mask: 图像的蒙版
     * @param x
     * @param y: 这两个值是目标左上的位置也是到时imageData被画到的地方
     * @param w
     * @param h: 这两个值是目标灰度图的宽高, 如果不指定那么就假定灰度图是正方形
     */
    blitWithMask(grayScale, context, mask, x = 0, y = 0, w = 0, h = 0) {
        assert(typeof grayScale[0] === "number");

        if (context.isContext) context = context.ctx; // 确保一下兼容性, 反正不用Context类的重绘
        assert(context.getImageData && context.putImageData);

        if (mask.isMask) mask = mask.toArray();

        if (w === 0 || h === 0) { // 不指定宽高
            w = h = Math.floor(Math.sqrt(grayScale.length));
        }

        // 由于要使用蒙版, 重写转换过程, 为了性能直接写入Uint8ClampedArray
        let pixelArray = new Uint8ClampedArray(w * w * 4);
        grayScale.forEach((item, cnt) => {
            if(cnt <= w * w) {
                let newColor = this.colorMap[item];
                pixelArray[cnt * 4] = newColor[0];
                pixelArray[cnt * 4 + 1] = newColor[1];
                pixelArray[cnt * 4 + 2] = newColor[2];
                pixelArray[cnt * 4 + 3] = Math.floor(mask[cnt] * 255);
            }
        });

        let imageData = new ImageData(pixelArray, w, h);
        context.putImageData(imageData, x, y);
    }
}


/*****
 * 一些必要的蒙版
 *****/

/**
 * 位图蒙版, Alpha遮罩蒙版
 */
class Mask {
    constructor(bits) {
        this.isMask = true;
        this.mask = [];
        for (let i = 0; i < bits.length; i += 4) {
            this.mask[i] = bits[i + 3] / 255;
        }
    }

    toArray() {
        return this.mask;
    }
}

/**
 * 圆形蒙版
 */
class CircleMask { // 圆形蒙版
    constructor(w, h, radius, x, y) {
        this.isMask = true;
        this.width = w;
        this.height = h;
        this.radius = radius;
        this.x = x;
        this.y = y;
    }

    consolidate() {
        this.mask = [];
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                this.mask[i * this.width + j] = (((j - this.x) * (j - this.x) + (i - this.y) * (i - this.y)) < this.radius * this.radius) ? 1 : 0;
            }
        }

    }

    toArray() {
        if (this.mask)
            return this.mask;
        else {
            let ret = [];
            for (let i = 0; i < this.height; i++) {
                for (let j = 0; j < this.width; j++) {
                    ret[i * this.width + j] = (((j - this.x) * (j - this.x) + (i - this.y) * (i - this.y)) < this.radius * this.radius) ? 1 : 0;
                }
            }
            return ret;
        }
    }
}


/**
 * 简单地封装了一下原生JS的API
 */
class Context {
    constructor(canvas, graphSize = 500) {
        this.canvas = canvas;
        this.graphSize = graphSize;
        this.windowSize = Math.min(window.innerHeight, window.innerWidth) > graphSize ? Math.min(window.innerHeight, window.innerWidth): graphSize;
        this.canvas.width = this.canvas.height = this.windowSize;
        this.isContext = true;
        this.ctx = this.canvas.getContext("2d");
    }

    /**
     * 画折线
     * @param points: 点数组
     */
    line(points) {
        assert(points[0] && points[1]);
        this.ctx.beginPath();
        this.ctx.moveTo.apply(this.ctx, points[0]);
        for (let cnt = 1; cnt < points.length; cnt++) {
            this.ctx.lineTo.apply(this.ctx, points[cnt]);
        }
        this.ctx.stroke();
    }

    /**
     * 画弧, 和原生Context的API兼容
     * @param center
     * @param radius
     * @param start
     * @param end
     * @param anticlockwise
     */
    arc(center, radius, start, end, anticlockwise = false) {
        this.ctx.arc(center[0], center[1], radius, start, end, anticlockwise);
        this.ctx.stroke();
    }

    /**
     * 画圆, 扩展了一下画弧
     * @param center
     * @param radius
     */
    circle(center, radius) {
        this.arc(center, radius, 0, 2 * Math.PI);
    }

    getImageData() {
        return this.ctx.getImageData((this.windowSize - this.graphSize) / 2, (this.windowSize - this.graphSize) / 2,
            this.graphSize, this.graphSize);
    }

    putImageData(imgData) {
        this.ctx.putImageData(imgData, (this.windowSize - this.graphSize) / 2, (this.windowSize - this.graphSize) / 2)
    }

    /**
     * 重绘, 原理是重置宽高
     */
    redraw() {
        this.canvas.height = this.canvas.height;
    }
}

/**
 * 用于动画的时钟，通过unicode获取准确时间差
 */
class Clock {
    constructor(targetTickRate) {
        this.tickRate = targetTickRate;
        this.prevTS = new Date().getTime();
        this.tpause = false;
    }

    run(cb) {
        this.interval = setInterval(() => {
            if(!this.tpause) {
                let curTS = new Date().getTime(),
                    prevTS = this.prevTS;
                this.prevTS = curTS;
                cb(curTS - prevTS);
            }
        }, 1000 / this.tickRate);
        this.cb = cb;
    }

    stop() {
        if(this.interval) {
            clearInterval(this.interval);
            let curTS = new Date().getTime(),
                prevTS = this.prevTS;
            this.cb(curTS - prevTS);
        }
    }

    pause() {
        if(this.interval) {
            this.tpause = true;
        }
    }

    restart() {
        if(this.interval) {
            this.tpause = false;
        }
    }

    updateTickRate(targetTickRate) {
        this.tickRate = targetTickRate;
        this.stop();
        this.run(this.cb);
    }
}

module.exports = {
    Color: Color,
    ColorMap: ColorMap,
    Mask: Mask,
    CircleMask: CircleMask,
    Context: Context,
    Clock: Clock
};