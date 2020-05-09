window.$ = require("./jquery-2.1.4.min");
const PPI = require("./PPI");
const {ipcRenderer} = require("electron");

const internalColorTable = [
    null,
    "view/rc/hot.bin",
    "rc/hot.png",
    "view/rc/copper.bin",
    "view/rc/jet.bin",
    "view/rc/cool.bin",
    "rc/cool.png",
    "view/rc/green.bin",
    "view/rc/bone.bin",
    "rc/hsv.png"
];

module.exports = (document) => {
    $(document).ready(() => {
        let maxRadius = Math.min(window.innerWidth, window.innerHeight) - 80; // 为栅格与扫描标志留下空间
        let curSonar = new PPI($("canvas")[0], maxRadius),
            paused = false;

        ipcRenderer.send("ready");
        ipcRenderer.on("loadConfig", function(ev, cfg) {
            curSonar.loadColorMap(internalColorTable[parseInt(cfg["SONAR PARAM"]["COLOR_TABLE"])]);
            curSonar.grid = cfg["SONAR PARAM"]["GRID"] === "1";
        });

        /**
         * 声呐回放相关事件
         */
        ipcRenderer.on("replay", function(ev, arg) {
            curSonar.mode(1, arg);
        });
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
        ipcRenderer.on("pause", function(ev) {
            if(!paused) {
                curSonar.scanThread.pause();
                //curSonar.redrawThread.pause();
            } else {
                curSonar.scanThread.restart();
                //curSonar.redrawThread.restart();
            }
            paused = !paused;
        });

        /**
         * 用户设置相关事件
         */
        ipcRenderer.on("loadColorMap", function(ev, arg) {
            curSonar.loadColorMap(arg);
        });
        ipcRenderer.on("setSonarHeading", function(ev, arg) {
            curSonar.headDown = arg;
        });
        ipcRenderer.on("grid", function(ev, arg) {
            curSonar.grid = arg;
        });
        ipcRenderer.on("toggleGrid", function() {
            curSonar.grid = !curSonar.grid;
        });
        ipcRenderer.on("flag", function(ev, arg) {
            curSonar.flag = arg;
        });
        ipcRenderer.on("toggleFlag", function() {
            curSonar.flag = !curSonar.flag;
        });
        ipcRenderer.on("setProfileMode", function(ev, arg) {
            curSonar.profile = arg;
        });

        /**
         * 下位机事件
         */
        ipcRenderer.on("receiveSonarData", function(ev, arg) {
            curSonar.receiveSonarData(arg);
        })
    });
};