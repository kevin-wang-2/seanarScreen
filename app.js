const {app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut} = require('electron');
const {Sonar} = require("./local/sonarControl");
const ini = require("ini");
const fs = require("fs");

let conf;
try {
    conf = ini.parse(fs.readFileSync("StPipe.ini").toString());
} catch(err) {
    conf = {};
    conf["DISPLAY"] = {};
    conf["DISPLAY"]["WIDTH"] = 1920;
    conf["DISPLAY"]["HEIGHT"] = 1080;
    conf["SONAR PARAM"] = {};
    conf["SONAR PARAM"]["RANGE"] = 2;
    conf["SONAR PARAM"]["DISPLAY_MODE"] = 0;
    conf["SONAR PARAM"]["GAIN"] = 20;
    conf["SONAR PARAM"]["COLOR_TABLE"] = 2;
    conf["SONAR PARAM"]["HEAD_DOWN"] = 1;
    conf["SONAR PARAM"]["GRID"] = 1;
    conf["SONAR PARAM"]["IP ADDRESS"] = "192.168.0.7";
    fs.writeFileSync("StPipe.ini", ini.encode(conf));

}

let mainWindow, menu,
    sonar = new Sonar(conf["SONAR PARAM"]["IP ADDRESS"], 0, false,
        parseInt(conf["SONAR PARAM"]["RANGE"]),
        parseInt(conf["SONAR PARAM"]["DISPLAY_MODE"]),
        parseInt(conf["SONAR PARAM"]["GAIN"]) * 0.4);

function createWindow() {
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    mainWindow = new BrowserWindow({
        title: '弋洋声呐显示系统',
        width: parseInt(conf["DISPLAY"]["WIDTH"]),
        height: parseInt(conf["DISPLAY"]["HEIGHT"]),
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadFile("view/index.html");
    if(parseInt(conf["DISPLAY"]["WIDTH"]) === 1920 && parseInt(conf["DISPLAY"]["HEIGHT"]) === 1080)
        mainWindow.maximize();
}


let template = [
    {
        label: '文件[&F]',
        submenu: [
            {
                label: '打开声呐数据',
                accelerator: 'CmdOrCtrl+O',
                role: 'open',
                id: "openReplay",
                click: () => {
                    dialog.showOpenDialog({
                        title: "打开声呐回放文件",
                        filters: [
                            {name: "标准声呐回放文件", extensions: ["P62"]}
                        ]
                    }).then((fn) => {
                        if (!fn.canceled)
                            mainWindow.webContents.send("replay", fn.filePaths[0]);
                    });
                }
            }, {
                label: '保存声呐数据',
                accelerator: 'CmdOrCtrl+S',
                role: 'save',
                id: "saveReplay",
                click: () => {
                    dialog.showSaveDialog({
                        title: "保存声呐回放文件",
                        filters: [
                            {name: "标准声呐回放文件", extensions: ["123"]}
                        ]
                    }).then((fn) => {
                        console.log(fn);
                    });
                }
            }, {
                label: '重新加载',
                accelerator: 'CmdOrCtrl+R',
                id: "reload",
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        // on reload, start fresh and close any old
                        // open secondary windows
                        if (focusedWindow.id === 1) {
                            BrowserWindow.getAllWindows().forEach(function (win) {
                                if (win.id > 1) {
                                    win.close()
                                }
                            })
                        }
                        focusedWindow.reload()
                    }
                }
            }, {
                type: "separator"
            }, {
                label: "加载色表",
                click: () => {
                    dialog.showOpenDialog({
                        title: "选择色表",
                        filters: [
                            {name: "图片", extensions: ["png", "jpg", "bmp"]},
                            {name: "二进制色表", extensions: ["bin"]}
                        ]
                    }).then((fn) => {
                        if (!fn.canceled)
                            mainWindow.webContents.send("loadColorMap", fn.filePaths[0]);
                    });
                }
            }, {
                label: "首选项",
                accelerator: 'CmdOrCtrl+Alt+S',
                click: () => {
                    let paramWindow = new BrowserWindow({
                        parent: mainWindow,
                        modal: true,
                        title: "首选项",
                        width: 800,
                        height: 400,
                        useContentSize: true,
                        resizable: false,
                        minimizable: false,
                        maximizable: false,
                        autoHideMenuBar: true,
                        webPreferences: {
                            nodeIntegration: true
                        }
                    });

                    let listener = () => {
                        paramWindow.webContents.send("param", conf)
                    };

                    let saveParam = (ev, newConf) => {
                        fs.writeFileSync("StPipe.ini", ini.encode(newConf));
                        if(newConf["SONAR PARAM"]["IP ADDRESS"] !== conf["SONAR PARAM"]["IP ADDRESS"]) {
                            sonar.ip = newConf["SONAR PARAM"]["IP ADDRESS"];
                        }
                        conf = newConf;
                    };

                    ipcMain.on("paramsLoad", listener);
                    ipcMain.on("saveParam", saveParam);

                    paramWindow.loadFile("view/params.html");

                    paramWindow.on("close", () => {
                        ipcMain.off("paramsLoad", listener);
                    })
                }
            }, {
                label: "打开开发者工具",
                id: "debug",
                click: () => {
                    mainWindow.webContents.openDevTools()
                }
            }]
    }, {
        label: "声呐操作[&M]",
        submenu: [
            {
                label: "量程",
                submenu: [
                    {
                        label: "1m",
                        type: "radio",
                        id: "range.1",
                        click: () => {
                            sonar.setRange(1);
                            mainWindow.webContents.send("setRange", 1);
                        }
                    }, {
                        label: "2m",
                        type: "radio",
                        id: "range.2",
                        click: () => {
                            sonar.setRange(2);
                            mainWindow.webContents.send("setRange", 2);
                        }
                    }, {
                        label: "3m",
                        type: "radio",
                        id: "range.3",
                        click: () => {
                            sonar.setRange(3);
                            mainWindow.webContents.send("setRange", 3);
                        }
                    }, {
                        label: "4m",
                        type: "radio",
                        id: "range.4",
                        click: () => {
                            sonar.setRange(4);
                            mainWindow.webContents.send("setRange", 4);
                        }
                    }, {
                        label: "5m",
                        type: "radio",
                        id: "range.5",
                        click: () => {
                            sonar.setRange(5);
                            mainWindow.webContents.send("setRange", 5);
                        }
                    }, {
                        label: "6m",
                        type: "radio",
                        id: "range.6",
                        click: () => {
                            sonar.setRange(6);
                            mainWindow.webContents.send("setRange", 6);
                        }
                    }, {
                        label: "7m",
                        type: "radio",
                        id: "range.7",
                        click: () => {
                            sonar.setRange(7);
                            mainWindow.webContents.send("setRange", 7);
                        }
                    }, {
                        label: "8m",
                        type: "radio",
                        id: "range.8",
                        click: () => {
                            sonar.setRange(8);
                            mainWindow.webContents.send("setRange", 8);
                        }
                    }, {
                        label: "9m",
                        type: "radio",
                        id: "range.9",
                        click: () => {
                            sonar.setRange(9);
                            mainWindow.webContents.send("setRange", 9);
                        }
                    }, {
                        label: "10m",
                        type: "radio",
                        id: "range.10",
                        click: () => {
                            sonar.setRange(10);
                            mainWindow.webContents.send("setRange", 10);
                        }
                    }, {
                        label: "15m",
                        type: "radio",
                        id: "range.15",
                        click: () => {
                            sonar.setRange(15);
                            mainWindow.webContents.send("setRange", 15);
                        }
                    }, {
                        label: "20m",
                        type: "radio",
                        id: "range.20",
                        click: () => {
                            sonar.setRange(20);
                            mainWindow.webContents.send("setRange", 20);
                        }
                    }
                ]
            }, {
                label: "频率选择",
                submenu: [
                    {
                        label: "自动",
                        type: "radio",
                        id: "freq.0",
                        click: () => {
                            sonar.setFreq(0);
                            mainWindow.webContents.send("setFreq", 0);
                        }
                    }, {
                        label: "低频",
                        type: "radio",
                        id: "freq.1",
                        click: () => {
                            sonar.setFreq(1);
                            mainWindow.webContents.send("setFreq", 1);
                        }
                    }, {
                        label: "高频",
                        type: "radio",
                        id: "freq.2",
                        click: () => {
                            sonar.setFreq(2);
                            mainWindow.webContents.send("setFreq", 2);
                        }
                    }
                ]
            }, {
                label: "增益",
                submenu: [
                    {
                        label: "10%",
                        type: "radio",
                        id: "gain.10",
                        click: () => {
                            sonar.setGain(4);
                            mainWindow.webContents.send("setGain", 10);
                        }
                    }, {
                        label: "20%",
                        type: "radio",
                        id: "gain.20",
                        click: () => {
                            sonar.setGain(8);
                            mainWindow.webContents.send("setGain", 20);
                        }
                    }, {
                        label: "30%",
                        type: "radio",
                        id: "gain.30",
                        click: () => {
                            sonar.setGain(12);
                            mainWindow.webContents.send("setGain", 30);
                        }
                    }, {
                        label: "40%",
                        type: "radio",
                        id: "gain.40",
                        click: () => {
                            sonar.setGain(16);
                            mainWindow.webContents.send("setGain", 40);
                        }
                    }, {
                        label: "50%",
                        type: "radio",
                        id: "gain.50",
                        click: () => {
                            sonar.setGain(20);
                            mainWindow.webContents.send("setGain", 50);
                        }
                    }, {
                        label: "60%",
                        type: "radio",
                        id: "gain.60",
                        click: () => {
                            sonar.setGain(24);
                            mainWindow.webContents.send("setGain", 60);
                        }
                    }, {
                        label: "70%",
                        type: "radio",
                        id: "gain.70",
                        click: () => {
                            sonar.setGain(28);
                            mainWindow.webContents.send("setGain", 70);
                        }
                    }, {
                        label: "80%",
                        type: "radio",
                        id: "gain.80",
                        click: () => {
                            sonar.setGain(32);
                            mainWindow.webContents.send("setGain", 80);
                        }
                    }, {
                        label: "90%",
                        type: "radio",
                        id: "gain.90",
                        click: () => {
                            sonar.setGain(36);
                            mainWindow.webContents.send("setGain", 90);
                        }
                    }, {
                        label: "100%",
                        type: "radio",
                        id: "gain.100",
                        click: () => {
                            sonar.setGain(40);
                            mainWindow.webContents.send("setGain", 100);
                        }
                    }
                ]
            }, {
                label: "剖面显示模式",
                submenu: [
                    {
                        label: "图像叠加",
                        type: "radio"
                    }, {
                        label: "仅剖面",
                        type: "radio"
                    }, {
                        label: "仅图像",
                        type: "radio"
                    }
                ]
            }, {
                type: "separator"
            }, {
                label: "冻结",
                type: "checkbox",
                click: () => {
                    sonar.freeze();
                }
            }
        ]
    }, {
        label: "选项[&O]",
        submenu: [
            {
                label: "模式",
                submenu: [
                    {
                        label: "PPI (极坐标)",
                        type: "radio",
                        checked: true,
                        accelerator: "CmdOrCtrl+Alt+P",
                        id: "mode.0",
                        click: () => {
                            mainWindow.webContents.send("mode", 0);
                        }
                    }, {
                        label: "BSCAN (B扫)",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+B",
                        id: "mode.1",
                        click: () => {
                            mainWindow.webContents.send("mode", 1);
                        }
                    }, {
                        label: "Sector (扇扫)",
                        accelerator: "CmdOrCtrl+Alt+S",
                        type: "radio",
                        id: "mode.2",
                        click: () => {
                            mainWindow.webContents.send("mode", 2);
                        }
                    }
                ]
            }, {
                label: "内置色表",
                submenu: [
                    {
                        label: "(&1) 灰度",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+1",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 0,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", null);
                        }
                    },
                    {
                        label: "(&2) 火山红-亮",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+2",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 1,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/hot.bin");
                        }
                    }, {
                        label: "(&3) 火山红-暗",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+3",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 2,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/hot.png");
                        }
                    }, {
                        label: "(&4) 古铜色",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+4",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 3,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/copper.bin");
                        }
                    }, {
                        label: "(&5) 高对比度",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+5",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 4,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/jet.bin");
                        }
                    }, {
                        label: "(&6) 冷色调",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+6",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 5,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/cool.bin");
                        }
                    }, {
                        label: "(&7) 蓝色",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+7",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 6,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/cool.png");
                        }
                    }, {
                        label: "(&8) 绿色",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+8",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 7,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/green.bin");
                        }
                    }, {
                        label: "(&9) 雷达灰",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+9",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 8,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/bone.bin");
                        }
                    }, {
                        label: "(&0) HSV",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+0",
                        checked: parseInt(conf["SONAR PARAM"]["COLOR_TABLE"]) === 9,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", __dirname + "/view/rc/hsv.png");
                        }
                    }
                ]
            }, {
                label: "声呐头朝向",
                submenu: [
                    {
                        label: "上",
                        type: "radio",
                        checked: conf["SONAR PARAM"]["HEAD_DOWN"] === "0",
                        click: () => {
                            mainWindow.webContents.send("setSonarHeading", false);
                        }
                    },
                    {
                        label: "下",
                        type: "radio",
                        checked: conf["SONAR PARAM"]["HEAD_DOWN"] === "1",
                        click: () => {
                            mainWindow.webContents.send("setSonarHeading", true);
                        }
                    }
                ]
            }, {
                label: "栅格",
                submenu: [
                    {
                        label: "开",
                        type: "radio",
                        checked: conf["SONAR PARAM"]["GRID"] === "1",
                        id: "gridOn",
                        click: () => {
                            mainWindow.webContents.send("grid", true);
                        }
                    }, {
                        label: "关",
                        type: "radio",
                        checked: conf["SONAR PARAM"]["GRID"] === "0",
                        id: "gridOff",
                        click: () => {
                            mainWindow.webContents.send("grid", false);
                        }
                    }
                ]
            }, {
                label: "扫描标志",
                submenu: [
                    {
                        label: "开",
                        type: "radio",
                        id: "flagOn",
                        click: () => {
                            mainWindow.webContents.send("flag", true);
                        }
                    }, {
                        label: "关",
                        type: "radio",
                        id: "flagOff",
                        click: () => {
                            mainWindow.webContents.send("flag", false);
                        }
                    }
                ]
            }, {
                label: "剖面参数设置"
            }, {
                label: "剖面显示模式",
                submenu: [
                    {
                        label: "图像叠加",
                        type: "radio",
                        id: "profile.0",
                        click: () => {
                            mainWindow.webContents.send("setProfileMode", 0);
                        }
                    }, {
                        label: "仅剖面",
                        type: "radio",
                        id: "profile.1",
                        click: () => {
                            mainWindow.webContents.send("setProfileMode", 1);
                        }
                    }, {
                        label: "仅图像",
                        type: "radio",
                        id: "profile.2",
                        click: () => {
                            mainWindow.webContents.send("setProfileMode", 2);
                        }
                    }
                ]
            }, {
                label: "发射延时"
            }, {
                label: "不显示盲区图像",
                type: "checkbox",
                checked: true,
                click: () => {
                    mainWindow.webContents.send("toggleMinrange");
                }
            }
        ]
    },
    {
        label: "回放[&R]",
        submenu: [
            {
                label: "回到真实速度",
                click: () => {
                    mainWindow.webContents.send("speed", 0)
                }
            },
            {
                label: "加速",
                accelerator: "CmdOrCtrl+Right",
                click: () => {
                    mainWindow.webContents.send("speed", 1);
                }
            },
            {
                label: "减速",
                accelerator: "CmdOrCtrl+Left",
                click: () => {
                    mainWindow.webContents.send("speed", -1);
                }
            },
            {
                label: "暂停",
                accelerator: "Space",
                type: "checkbox",
                checked: false,
                click: () => {
                    mainWindow.webContents.send("pause");
                    this.checked = !this.checked;
                }
            },
            {
                type: "separator"
            },
            {
                label: "高帧率",
                click: () => {
                    mainWindow.webContents.send("setTickRate", 50);
                }
            },
            {
                label: "低帧率",
                click: () => {
                    mainWindow.webContents.send("setTickRate", 25);
                }
            }
        ]
    }
]; // 菜单模板

app.on('ready', function() {
    createWindow();

    // 注册全局快捷键
    globalShortcut.register("g", () => {
        mainWindow.webContents.send("toggleGrid");
        if(menu.getMenuItemById("gridOn").checked) {
            menu.getMenuItemById("gridOff").checked = true;
        } else {
            menu.getMenuItemById("gridOn").checked = true;
        }
    });

    globalShortcut.register("f", () => {
        mainWindow.webContents.send("toggleFlag");
        if(menu.getMenuItemById("flagOn").checked) {
            menu.getMenuItemById("flagOff").checked = true;
        } else {
            menu.getMenuItemById("flagOn").checked = true;
        }
    });

    sonar.registerRecieveFn((res) => {
        mainWindow.webContents.send("receiveSonarData", res)
    });

    ipcMain.on("ready", function(ev) {
        ev.sender.send("loadConfig", conf);
    })
});

ipcMain.on("setRange", (ev, r) => {
    sonar.ucRange = r;
    menu.getMenuItemById("range." + Math.floor(r)).checked = true;
});

ipcMain.on("setGain", (ev, r) => {
    sonar.ucStartGain = r * 0.4;
    menu.getMenuItemById("gain." + Math.floor(r)).checked = true;
});

ipcMain.on("setFreq", (ev, f) => {
    sonar.ucFreq = f;
    menu.getMenuItemById("freq." + Math.floor(f)).checked = true;
});

ipcMain.on("setProfile", (ev, p) => {
    menu.getMenuItemById("profile." + Math.floor(p)).checked = true;

});

ipcMain.on("setMode", (ev, m) => {
    menu.getMenuItemById("mode." + Math.floor(m)).checked = true;
});

ipcMain.on("setGrid", (ev, g) => {
    if(g) {
        menu.getMenuItemById("gridOn").checked = true;
    } else {
        menu.getMenuItemById("gridOff").checked = true;
    }
});

ipcMain.on("setFlag", (ev, g) => {
    if(g) {
        menu.getMenuItemById("flagOn").checked = true;
    } else {
        menu.getMenuItemById("flagOff").checked = true;
    }
});

app.on('window-all-closed', function () {
    sonar.terminate();
    app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});

