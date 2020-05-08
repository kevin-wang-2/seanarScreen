const dgram = require("dgram");

const F_LOW = 68,
    F_HIGH = 221,
    F_TEST = 225;

const WS_XMIT = 0x01,
    WS_DATAECHO = 0x02,
    WS_REVERSE = 0x04,
    WS_HOLD = 0x08,
    WS_CALIBRATION = 0x10,
    WS_SECTORMODE = 0x20,
    WS_SLAVE = 0x40,
    WS_CMD = 0x80;

module.exports = {
    WS_XMIT: WS_XMIT,
    WS_DATAECHO: WS_DATAECHO,
    WS_REVERSE: WS_REVERSE,
    WS_HOLD: WS_HOLD,
    WS_CALIBRATION: WS_CALIBRATION,
    WS_SECTORMODE: WS_SECTORMODE,
    WS_SLAVE: WS_SLAVE,
    WS_CMD: WS_CMD
};

class Sonar {
    constructor(ip, ws = 0, hold = false, range = 2, displaymode = 0, gain = 20, soundSpeed = 1485) {
        this.ucHeader = 0xfe;
        this.ucID = 0;
        this.ucWorkStatus = 0x03;
        if(hold) this.ucWorkStatus |= WS_HOLD;
        this.ucWorkStatus |= WS_SECTORMODE;
        this.ucWorkStatus |= ws;

        this.ucRange = range;

        this.ucLOGF = 40;
        this.nTrainAngle = 0; // 注意这个是16位的, 需要小端写入

        this.ucStepSize = 1;

        // 16位的, 需要小端写入
        if(displaymode === 0) {
            this.nSectorWidth = 3600;
        } else {
            this.nSectorWidth = 900;
        }

        this.ucPulseType = 0;
        this.nDataLen = 1000; // 16位的, 需要大端写入
        this.nMinRange = 200; // 16位的, 需要大端写入
        this.nGate = 500;  // 16位的, 需要大端写入

        this.ucFreq = 0;
        this.ucStartGain = gain;
        this.ucAbsorption = 10;

        this.nDelay = 0; // 16位的, 需要大端写入

        this.nSoundSpeed = soundSpeed; // 16位的, 需要大端写入
        this.ucEnd = 0xfd;

        this.ip = ip;

        this.sampleNum = Math.floor(1 / soundSpeed / 2.5e-6);

        // 创建UDP实例
        this.udp_client = dgram.createSocket("udp4");
        this.ready = true;

        // 收到声呐信息的回调
        this.onReceive = () => {};
        this.dataBuffer = Buffer.alloc(0);
        this.receiveStatus = 0; // 0代表未接受, 1代表正常接收了header
        this.udp_client.on("message", (msg) => {
            this.onReceive(msg);
        });

        // 发送控制心跳包
        setInterval(() => {
            this.sendData();
        }, 100);
    }

    toBuffer() {
        let buf = Buffer.alloc(72), cnt = 0;

        /**
         * 由于JS二进制操作不是流操作, 把它修改成流操作
         * @param fn
         * @param x
         * @param y
         */
        buf.push = function(fn, x, y = []) {
            fn.apply(this, [x, cnt].concat(y));
            if(!y.length) cnt++;
            else cnt += y[0];
        };

        /**
         * 写入一堆Buffer
         */
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, this.ucHeader);
        buf.push(buf.writeUInt8, this.ucID);
        buf.push(buf.writeUInt8, this.ucWorkStatus);
        buf.push(buf.writeUInt8, this.ucRange);
        buf.push(buf.writeUInt8, this.ucStartGain);
        buf.push(buf.writeUInt8, this.ucLOGF);
        buf.push(buf.writeUInt8, this.ucAbsorption);
        buf.push(buf.writeUInt8, this.ucStepSize);
        buf.push(buf.writeUIntBE, this.nSoundSpeed, 2);
        buf.push(buf.writeUIntBE, this.nTrainAngle, 2);
        buf.push(buf.writeUIntBE, this.nSectorWidth, 2);
        buf.push(buf.writeUIntBE, this.nDataLen, 2);
        buf.push(buf.writeUInt8, this.ucPulseType);
        buf.push(buf.writeUInt8, 0);
        buf.push(buf.writeUIntBE, this.nGate, 2);
        buf.push(buf.writeUIntBE, this.nMinRange, 2);
        buf.push(buf.writeUIntBE, this.nDelay, 2);
        buf.push(buf.writeUInt8, 0);
        buf.push(buf.writeUInt8, 0);
        buf.push(buf.writeUInt8, this.ucFreq);
        buf.push(buf.writeUInt8, this.ucEnd);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, this.ucHeader);
        buf.push(buf.writeUInt8, this.ucID);
        buf.push(buf.writeUInt8, this.ucWorkStatus);
        buf.push(buf.writeUInt8, this.ucRange);
        buf.push(buf.writeUInt8, this.ucStartGain);
        buf.push(buf.writeUInt8, this.ucLOGF);
        buf.push(buf.writeUInt8, this.ucAbsorption);
        buf.push(buf.writeUInt8, this.ucStepSize);
        buf.push(buf.writeUIntBE, this.nSoundSpeed, 2);
        buf.push(buf.writeUIntBE, this.nTrainAngle, 2);
        buf.push(buf.writeUIntBE, this.nSectorWidth, 2);
        buf.push(buf.writeUIntBE, this.nDataLen, 2);
        buf.push(buf.writeUInt8, this.ucPulseType);
        buf.push(buf.writeUInt8, 0);
        buf.push(buf.writeUIntBE, this.nGate, 2);
        buf.push(buf.writeUIntBE, this.nMinRange, 2);
        buf.push(buf.writeUIntBE, this.nDelay, 2);
        buf.push(buf.writeUInt8, 0);
        buf.push(buf.writeUInt8, 0);
        buf.push(buf.writeUInt8, this.ucFreq);
        buf.push(buf.writeUInt8, this.ucEnd);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        buf.push(buf.writeUInt8, 0xff);
        return {
            data: buf,
            length: 72
        }
    }

    /**
     * 设置量程
     * @param r
     */
    setRange(r) {
        this.ucRange = r;
        const t = 2.5e-6,
            T = r * 2 / this.nSoundSpeed;
        switch(r) {
            case 1:
                this.sampleNum = Math.floor(t / T / 3);
                break;
            default:
                this.sampleNum = Math.floor(t / T / 4);
        }
        this.sendData();
    }

    /**
     * 设置频率
     * @param r: 0为默认, 1为低频, 2为高频
     */
    setFreq(r) {
        if(r === 0 || r === 2) {
            this.ucFreq = F_HIGH;
        } else if (r === 1) {
            this.ucFreq = F_LOW;
        }
        this.sendData();
    }

    /**
     * 设置增益, 注意g为指数关系
     * @param g
     */
    setGain(g) {
        this.ucStartGain = g;
        this.sendData();
    }

    /**
     * 注册回调, 用于和上位机通信
     * @param fn
     */
    registerRecieveFn(fn) {
        this.onReceive = (data) => {
            this.dataBuffer = data.concat(this.dataBuffer, this.dataBuffer.length + data.length); // enqueue
            if(this.dataBuffer.length >= 8 && this.receiveStatus === 0) {
                let headerData = this.dataBuffer.slice(this.dataBuffer.length - 8, this.dataBuffer.length).toJSON().data;
                this.headerTemp = {
                        ucFlag: headerData[0],
                        ucID: headerData[1],
                        ucStatus: headerData[2],
                        ucDataLo: headerData[3],
                        ucDataHi: headerData[4],
                        ucAngleLo: headerData[5],
                        ucAngleHi: headerData[6],
                        ucEnd: headerData[7]
                    };
                this.dataBuffer = this.dataBuffer.slice(0, this.dataBuffer.length - 8); // dequeue
                if(this.headerTemp.ucFlag === 0xfe && this.headerTemp.ucEnd === 0xfd) {
                    if(this.headerTemp.ucStatus&0x20) {
                        // TODO: 处理命令接收错误
                    }

                    this.dataLength = ((this.headerTemp.ucDataHi & 0x7f) << 7) | (this.headerTemp.ucAngleLo & 0x7f);
                    if(this.dataLength !== this.sampleNum) {
                        // TODO: 处理数据长度错误
                    }

                    this.headerTemp.m_nAngle = ((this.headerTemp.ucAngleHi & 0x7f) << 7) | (this.headerTemp.ucAngleHi & 0x7f);
                    this.receiveStatus = 1;
                } else {
                    this.receiveStatus = 0;
                }
            }
            if(this.dataBuffer.length >= this.dataLength + 2) {
                let data = this.dataBuffer.slice(this.dataBuffer.length - this.dataLength, this.dataBuffer.length).toJSON().data;
                this.dataBuffer = this.dataBuffer.slice(0, this.dataBuffer.length - this.dataLength); // dequeue
                this.receiveStatus = 0;
                cb({
                    data: data,
                    header: this.headerTemp,
                    length: this.dataLength
                })
            }
        };
    }

    freeze() {
        this.hold = !this.hold;
        if(this.hold) this.ucWorkStatus |= WS_HOLD;
        else this.ucWorkStatus &= ~WS_HOLD;
    }

    sendData() {
        if(this.ready) {
            this.ready = false;
            let buf = this.toBuffer();
            this.udp_client.send(buf.data, 0, buf.length, 23, this.ip, () => {
                this.ready = true;
            });
        }
    }
}

module.exports.Sonar = Sonar;