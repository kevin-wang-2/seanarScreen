const dgram = require("dgram");
const SonarFile = require("../view/js/sonarReplay");

let srv = dgram.createSocket("udp4");
srv.bind(23);

let file = new SonarFile();
let interval;
file.open(__dirname + "/test.P62", "r");

srv.on("message", (data, rinfo) => {
    //console.log(data);
    let port = rinfo.port;
    let address = rinfo.address;
    if(!interval) {
        interval = setInterval(() => {
            let data = file.read();
            let sendBuf = Buffer.alloc(8), cnt = 0;

            sendBuf.push = function(fn, x, y = []) {
                fn.apply(this, [x, cnt].concat(y));
                if(!y.length) cnt++;
                else cnt += y[0];
            };

            sendBuf.push(sendBuf.writeUInt8, 0xfe);
            sendBuf.push(sendBuf.writeUInt8, 1);
            sendBuf.push(sendBuf.writeUInt8, 0);
            sendBuf.push(sendBuf.writeUInt8, data.header.ucDataLenLo);
            sendBuf.push(sendBuf.writeUInt8, data.header.ucDataLenHi);
            sendBuf.push(sendBuf.writeUInt8, data.header.ucAngleLo);
            sendBuf.push(sendBuf.writeUInt8, data.header.ucAngleHi);
            sendBuf.push(sendBuf.writeUInt8, 0xfd);

            srv.send(sendBuf, 0, 8, port, address);
            srv.send(new Buffer(data.data), 0, data.length + 2, port, address);
            console.log(data.length);
        }, 20);
    }
});