window.$ = require("./jquery-2.1.4.min");
let {ipcRenderer} = require("electron");

module.exports = function(document) {
    $(document).ready(() => {
        ipcRenderer.send("paramsLoad");
        ipcRenderer.on("param", (ev, conf) => {
            $("[name='display.width']").val(conf["DISPLAY"]["WIDTH"]);
            $("[name='display.height']").val(conf["DISPLAY"]["HEIGHT"]);
            $("[name='display.grid']")[0].checked = conf["SONAR PARAM"]["GRID"] === '1';
            $("[name='display.colorTable']").find("[value=" + conf["SONAR PARAM"]["COLOR_TABLE"] + "]").attr("selected", true);
            let ips = conf["SONAR PARAM"]["IP ADDRESS"].split(".");
            $("[name='sonar.ip.1']").val(ips[0]);
            $("[name='sonar.ip.2']").val(ips[1]);
            $("[name='sonar.ip.3']").val(ips[2]);
            $("[name='sonar.ip.4']").val(ips[3]);
            $("[name='sonar.displayMode']").find("[value=" + conf["SONAR PARAM"]["DISPLAY_MODE"] + "]").attr("selected", true);
            $("[name='sonar.gain']").find("[value=" + conf["SONAR PARAM"]["GAIN"] + "]").attr("selected", true);
            $("[name='sonar.range']").find("[value=" + conf["SONAR PARAM"]["RANGE"] + "]").attr("selected", true);
            $("[name='sonar.headDown']").find("[value=" + conf["SONAR PARAM"]["HEAD_DOWN"] + "]").attr("selected", true);
            $("[name='hfMinrange.1m']").val(conf["HIGH FREQUENCY MINRANGE"]["1m"]);
            $("[name='hfMinrange.2m']").val(conf["HIGH FREQUENCY MINRANGE"]["2m"]);
            $("[name='hfMinrange.3-5m']").val(conf["HIGH FREQUENCY MINRANGE"]["3-5m"]);
            $("[name='hfMinrange.5-10m']").val(conf["HIGH FREQUENCY MINRANGE"]["5-10m"]);
            $("[name='hfMinrange.gt10m']").val(conf["HIGH FREQUENCY MINRANGE"][">m"]);
            $("[name='lfMinrange.1m']").val(conf["LOW FREQUENCY MINRANGE"]["1m"]);
            $("[name='lfMinrange.2m']").val(conf["LOW FREQUENCY MINRANGE"]["2m"]);
            $("[name='lfMinrange.3-5m']").val(conf["LOW FREQUENCY MINRANGE"]["3-5m"]);
            $("[name='lfMinrange.5-10m']").val(conf["LOW FREQUENCY MINRANGE"]["5-10m"]);
            $("[name='lfMinrange.gt10m']").val(conf["LOW FREQUENCY MINRANGE"][">10m"]);
            $("[name='hfGate.1m']").val(conf["HIGH FREQUENCY GATE"]["1m"]);
            $("[name='hfGatee.2m']").val(conf["HIGH FREQUENCY GATE"]["2m"]);
            $("[name='hfGate.3-5m']").val(conf["HIGH FREQUENCY GATE"]["3-5m"]);
            $("[name='hfGate.5-10m']").val(conf["HIGH FREQUENCY GATE"]["5-10m"]);
            $("[name='hfGate.gt10m']").val(conf["HIGH FREQUENCY GATE"][">10m"]);
            $("[name='lfGate.1m']").val(conf["LOW FREQUENCY GATE"]["1m"]);
            $("[name='lfGatee.2m']").val(conf["LOW FREQUENCY GATE"]["2m"]);
            $("[name='lfGate.3-5m']").val(conf["LOW FREQUENCY GATE"]["3-5m"]);
            $("[name='lfGate.5-10m']").val(conf["LOW FREQUENCY GATE"]["5-10m"]);
            $("[name='lfGate.gt10m']").val(conf["LOW FREQUENCY GATE"][">10m"]);
        });

        window.onbeforeunload = () => { // 向主进程传递修改的信息
            let newConf = {
                DISPLAY: {
                    WIDTH: $("[name='display.width']").val(),
                    HEIGHT: $("[name='display.height']").val()
                }, "SONAR PARAM": {
                    RANGE: $("[name='sonar.range']").val(),
                    DISPLAY_MODE: $("[name='sonar.displayMode']").val(),
                    GAIN: $("[name='sonar.gain']").val(),
                    COLOR_TABLE: $("[name='display.colorTable']").val(),
                    HEAD_DOWN: $("[name='sonar.headDown']").val(),
                    GRID: $("[name='display.grid']")[0].checked?1:0,
                    "IP ADDRESS": $("[name='sonar.ip.1']").val() + "." +
                        $("[name='sonar.ip.2']").val() + "." +
                        $("[name='sonar.ip.3']").val() + "." +
                        $("[name='sonar.ip.4']").val()
                }, "HIGH FREQUENCY MINRANGE": {
                    "1m": $("[name='hfMinrange.1m']").val(),
                    "2m": $("[name='hfMinrange.2m']").val(),
                    "3-5m": $("[name='hfMinrange.3-5m']").val(),
                    "5-10m": $("[name='hfMinrange.5-10m']").val(),
                    ">10m": $("[name='hfMinrange.gt10m']").val(),
                }
            };
            ipcRenderer.send("saveParam", newConf);
        }
    })
};