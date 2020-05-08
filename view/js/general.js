window.$ = require("./jquery-2.1.4.min");
const PPI = require("./PPI");
const {ipcRenderer} = require("electron");


module.exports = (document) => {
    $(document).ready(() => {
        let maxRadius = Math.min(window.innerWidth, window.innerHeight) - 40; // Ϊդ����ɨ���־���¿ռ�
        let curSonar = new PPI($("canvas")[0], maxRadius),
            paused = false;

        /**
         * ���Żط�����¼�
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
                curSonar.redrawThread.pause();
            } else {
                curSonar.scanThread.restart();
                curSonar.redrawThread.restart();
            }
            paused = !paused;
        });

        /**
         * �û���������¼�
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

        /**
         * ��λ���¼�
         */
        ipcRenderer.on("receiveSonarData", function(ev, arg) {
            curSonar.recieveSonarData(data);
        })
    });
};