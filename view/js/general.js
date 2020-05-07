window.$ = require("./jquery-2.1.4.min");
const PPI = require("./PPI");
const {ipcRenderer} = require("electron");


module.exports = (document) => {
    $(document).ready(() => {
        let curSonar = new PPI($("canvas")[0]),
            originalSpeed = curSonar.scanSpeed;

        ipcRenderer.on("setTickRate", function(ev, arg) {
            curSonar.setTickRate(arg);
        });
        ipcRenderer.on("speed", function(ev, arg) {
            if(arg === 1) {
                curSonar.scanSpeed *= 2;
            } else if(arg === 0) {
                curSonar.scanSpeed = originalSpeed;
            } else if(arg === -1) {
                curSonar.scanSpeed /= 2;
            }
        })
    });
};