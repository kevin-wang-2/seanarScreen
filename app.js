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
                        click: () => {
                            sonar.setRange(1);
                        }
                    }, {
                        label: "2m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(2);
                        }
                    }, {
                        label: "3m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(3);
                        }
                    }, {
                        label: "4m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(4);
                        }
                    }, {
                        label: "5m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(5);
                        }
                    }, {
                        label: "6m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(6);
                        }
                    }, {
                        label: "7m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(7);
                        }
                    }, {
                        label: "8m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(8);
                        }
                    }, {
                        label: "9m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(9);
                        }
                    }, {
                        label: "10m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(10);
                        }
                    }, {
                        label: "15m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(15);
                        }
                    }, {
                        label: "20m",
                        type: "radio",
                        click: () => {
                            sonar.setRange(20);
                        }
                    }
                ]
            }, {
                label: "频率选择",
                submenu: [
                    {
                        label: "自动",
                        type: "radio",
                        click: () => {
                            sonar.setFreq(0);
                        }
                    }, {
                        label: "低频",
                        type: "radio",
                        click: () => {
                            sonar.setFreq(1);
                        }
                    }, {
                        label: "高频",
                        type: "radio",
                        click: () => {
                            sonar.setFreq(2);
                        }
                    }
                ]
            }, {
                label: "增益",
                submenu: [
                    {
                        label: "10%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(4);
                        }
                    }, {
                        label: "20%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(8);
                        }
                    }, {
                        label: "30%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(12);
                        }
                    }, {
                        label: "40%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(16);
                        }
                    }, {
                        label: "50%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(20);
                        }
                    }, {
                        label: "60%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(24);
                        }
                    }, {
                        label: "70%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(28);
                        }
                    }, {
                        label: "80%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(32);
                        }
                    }, {
                        label: "90%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(36);
                        }
                    }, {
                        label: "100%",
                        type: "radio",
                        click: () => {
                            sonar.setGain(40);
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
                        click: () => {
                            mainWindow.webContents.send("mode", 0);
                        }
                    }, {
                        label: "BSCAN (B扫)",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+B",
                        click: () => {
                            mainWindow.webContents.send("mode", 1);
                        }
                    }, {
                        label: "Sector (扇扫)",
                        accelerator: "CmdOrCtrl+Alt+S",
                        type: "radio",
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
                        click: () => {
                            mainWindow.webContents.send("setProfileMode", 0);
                        }
                    }, {
                        label: "仅剖面",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("setProfileMode", 1);
                        }
                    }, {
                        label: "仅图像",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("setProfileMode", 2);
                        }
                    }
                ]
            }, {
                label: "发射延时"
            }, {
                label: "不显示盲区图像"
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

app.on('window-all-closed', function () {
    sonar.terminate();
    app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});

