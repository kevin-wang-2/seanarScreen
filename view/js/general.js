window.$ = require("./jquery-2.1.4.min");
const PPI = require("./PPI");
const {ipcRenderer} = require("electron");


module.exports = (document) => {
    $(document).ready(() => {
        let maxRadius = Math.min(window.innerWidth, window.innerHeight) - 20;
        let curSonar = new PPI($("canvas")[0], maxRadius),
            originalSpeed = curSonar.scanSpeed;

        ipcRenderer.on("setTickRate", function(ev, arg) {
            curSonar.setTickRate(arg);
        });
        ipcRenderer.on("speed", function(ev, arg) {
            if(arg === 1) {
                curSonar.replaySpeed *= 2;
            } else if(arg === 0) {
                curSonar.replaySpeed = 1;
            } else if(arg === -1) {
                curSonar.replaySpeed /= 2;
            }
        });
        ipcRenderer.on("replay", function(ev, arg) {
            curSonar.mode(1, arg);
        });
        ipcRenderer.on("loadColorMap", function(ev, arg) {
            curSonar.loadColorMap(arg);
        })
    });
};