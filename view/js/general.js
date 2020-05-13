window.$ = require("./jquery-2.1.4.min");
const PPI = require("./PPI");
const BScan = require("./BScan");
const EventEmitter = require("events");
const {ipcRenderer} = require("electron");
let Knob = require("./knob"), ListOption = require("./listOption");

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
        let maxRadius = Math.min(window.innerWidth, window.innerHeight) - 80; // ?????????????????
        let curSonar, paused = false;
        let sonarEvents = new EventEmitter();

        ipcRenderer.send("ready");
        ipcRenderer.on("loadConfig", function(ev, cfg) {
            range.val(parseInt(cfg["SONAR PARAM"]["RANGE"]));
            gain.val(parseInt(cfg["SONAR PARAM"]["GAIN"]));
            if(parseInt(cfg["SONAR PARAM"]["DISPLAY_MODE"] === 1)) curSonar = new BScan($("canvas")[0], maxRadius);
            else curSonar = new PPI($("canvas")[0], maxRadius);
            sonarEvents.emit("load");
            curSonar.loadColorMap(internalColorTable[parseInt(cfg["SONAR PARAM"]["COLOR_TABLE"])]);
            curSonar.grid = cfg["SONAR PARAM"]["GRID"] === "1";
        });

        function changeSonarMode(m) {
            if(m === curSonar.dispmode) return;
            curSonar.stop();
            let newSonar, baseCanvas = $("canvas")[0];
            switch(m) {
                case 1:
                    newSonar = new BScan(baseCanvas, maxRadius);
                    break;
                default:
                    newSonar = new PPI(baseCanvas, maxRadius)
            }
            // 手动继承
            newSonar.curFile = curSonar.curFile;
            newSonar.gain = curSonar.gain;
            newSonar.range = curSonar.range;
            newSonar.frequency = curSonar.frequency;
            newSonar.scanAngle = curSonar.scanAngle;
            newSonar.smode = curSonar.smode;
            newSonar.colorMap = curSonar.colorMap;
            newSonar.grid = curSonar.grid;
            newSonar.flag = curSonar.flag;
            newSonar.headDown = curSonar.headDown;
            newSonar.profile = curSonar.profile;
            newSonar.clearMinRange = curSonar.clearMinRange;
            curSonar = newSonar;
        }

        /**
         * 回放操纵
         */
        ipcRenderer.on("replay", function(ev, arg) {
            curSonar.mode(1, arg);
            range.disable();
            gain.disable();
            freq.disable();
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
        ipcRenderer.on("pause", function() {
            if(!paused) {
                curSonar.scanThread.pause();
            } else {
                curSonar.scanThread.restart();
            }
            paused = !paused;
        });

        /**
         * 用户显示指令
         */
        ipcRenderer.on("mode", function(ev, arg) {
            mode.val(arg);
            changeSonarMode(arg);
        });
        ipcRenderer.on("loadColorMap", function(ev, arg) {
            if(curSonar)
                curSonar.loadColorMap(arg);
            sonarEvents.on("load", () => {
                curSonar.loadColorMap(arg);
            })
        });
        ipcRenderer.on("setSonarHeading", function(ev, arg) {
            if(curSonar)
                curSonar.headDown = arg;
            sonarEvents.on("load", () => {
                curSonar.headDown = arg;
            })
        });
        ipcRenderer.on("grid", function(ev, arg) {
            if(curSonar)
                curSonar.grid = arg;
            sonarEvents.on("load", () => {
                curSonar.grid = arg;
            })
        });
        ipcRenderer.on("toggleGrid", function() {
            curSonar.grid = !curSonar.grid;
        });
        ipcRenderer.on("flag", function(ev, arg) {
            if(curSonar)
                curSonar.flag = arg;
            sonarEvents.on("load", () => {
                curSonar.flag = arg;
            })
        });
        ipcRenderer.on("toggleFlag", function() {
            curSonar.flag = !curSonar.flag;
        });
        ipcRenderer.on("setProfileMode", function(ev, arg) {
            if(curSonar)
                curSonar.profile = arg;
            sonarEvents.on("load", () => {
                curSonar.profile = arg;
            });
            profile.val(arg);
        });
        ipcRenderer.on("toggleMinrange", function() {
            curSonar.clearMinRange = !curSonar.clearMinRange;
        });

        /**
         * 下位机事件
         */
        ipcRenderer.on("receiveSonarData", function(ev, arg) {
            if(curSonar)
                curSonar.receiveSonarData(arg);
        });

        /**
         * 旋钮控制器
         */
        let range = new Knob($("[name='range']"), 25, 1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20], "m");
        range.events.on("change", () => {
            if(range.val() <= 10) {
                range.val(Math.round(range.val()));
            } else {
                let rounded = 5 * Math.round(range.val() / 5);
                if(rounded === 25) rounded = 1;
                range.val(rounded);
            }
            ipcRenderer.send("setRange", range.val());
        });

        ipcRenderer.on("setRange", (ev, r) => {
            range.val(r);
        });

        let gain = new Knob($("[name='gain']"), 110, 10, [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], "%");
        gain.events.on("change", () => {
            let rounded = Math.round(gain.val() / 10) * 10;
            if(rounded === 110) rounded = 10;
            gain.val(rounded);
            ipcRenderer.send("setGain", rounded);
        });

        ipcRenderer.on("setGain", (ev, g) => {
            gain.val(g);
        });

        /**
         * 控制选项列表
         */
        let freq = new ListOption($("[name='freq']"));
        freq.events.on("change", () => {
            ipcRenderer.send("setFreq", freq.value);
        });

        ipcRenderer.on("setFreq", (ev, f) => {
            freq.val(f);
        });

        let profile = new ListOption($("[name='profile']"));
        profile.events.on("change", () => {
            ipcRenderer.send("setProfile", profile.value);
            curSonar.profile = profile.value;
        });

        let mode = new ListOption($("[name='mode']"));
        mode.events.on("change", () => {
            changeSonarMode(mode.value);
            ipcRenderer.send("setMode", mode.value);
        });
    });
};