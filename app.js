const {app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut} = require('electron');
const path = require('path');
const {setRange, setFreq, setGain, freeze} = require("./local/sonarControl");

let mainWindow, menu;

function createWindow() {
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    mainWindow = new BrowserWindow({
        title: '弋洋声呐显示系统',
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadFile("view/index.html");
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
                    mainWindow.webContents.send("message");
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
                            setRange(1);
                        }
                    }, {
                        label: "2m",
                        type: "radio",
                        click: () => {
                            setRange(2);
                        }
                    }, {
                        label: "3m",
                        type: "radio",
                        click: () => {
                            setRange(3);
                        }
                    }, {
                        label: "4m",
                        type: "radio",
                        click: () => {
                            setRange(4);
                        }
                    }, {
                        label: "5m",
                        type: "radio",
                        click: () => {
                            setRange(5);
                        }
                    }, {
                        label: "6m",
                        type: "radio",
                        click: () => {
                            setRange(6);
                        }
                    }, {
                        label: "7m",
                        type: "radio",
                        click: () => {
                            setRange(7);
                        }
                    }, {
                        label: "8m",
                        type: "radio",
                        click: () => {
                            setRange(8);
                        }
                    }, {
                        label: "9m",
                        type: "radio",
                        click: () => {
                            setRange(9);
                        }
                    }, {
                        label: "10m",
                        type: "radio",
                        click: () => {
                            setRange(10);
                        }
                    }, {
                        label: "15m",
                        type: "radio",
                        click: () => {
                            setRange(15);
                        }
                    }, {
                        label: "20m",
                        type: "radio",
                        click: () => {
                            setRange(20);
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
                            setFreq(0);
                        }
                    }, {
                        label: "低频",
                        type: "radio",
                        click: () => {
                            setFreq(1);
                        }
                    }, {
                        label: "高频",
                        type: "radio",
                        click: () => {
                            setFreq(2);
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
                            setGain(10);
                        }
                    }, {
                        label: "20%",
                        type: "radio",
                        click: () => {
                            setGain(20);
                        }
                    }, {
                        label: "30%",
                        type: "radio",
                        click: () => {
                            setGain(30);
                        }
                    }, {
                        label: "40%",
                        type: "radio",
                        click: () => {
                            setGain(40);
                        }
                    }, {
                        label: "50%",
                        type: "radio",
                        click: () => {
                            setGain(50);
                        }
                    }, {
                        label: "60%",
                        type: "radio",
                        click: () => {
                            setGain(60);
                        }
                    }, {
                        label: "70%",
                        type: "radio",
                        click: () => {
                            setGain(70);
                        }
                    }, {
                        label: "80%",
                        type: "radio",
                        click: () => {
                            setGain(80);
                        }
                    }, {
                        label: "90%",
                        type: "radio",
                        click: () => {
                            setGain(90);
                        }
                    }, {
                        label: "100%",
                        type: "radio",
                        click: () => {
                            setGain(100);
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
                click: freeze
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
                        checked: true,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", null);
                        }
                    },
                    {
                        label: "(&2) 火山红-亮",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+2",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/hot.bin");
                        }
                    }, {
                        label: "(&3) 火山红-暗",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+3",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "rc/hot.png");
                        }
                    }, {
                        label: "(&4) 古铜色",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+4",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/copper.bin");
                        }
                    }, {
                        label: "(&5) 高对比度",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+5",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/jet.bin");
                        }
                    }, {
                        label: "(&6) 冷色调",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+6",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/cool.bin");
                        }
                    }, {
                        label: "(&7) 蓝色",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+7",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "rc/cool.png");
                        }
                    }, {
                        label: "(&8) 绿色",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+8",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/green.bin");
                        }
                    }, {
                        label: "(&9) 雷达灰",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+9",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/bone.bin");
                        }
                    }, {
                        label: "(&0) HSV",
                        type: "radio",
                        accelerator: "CmdOrCtrl+Alt+0",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "rc/hsv.png");
                        }
                    }
                ]
            }, {
                label: "声呐头朝向",
                submenu: [
                    {
                        label: "上",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("setSonarHeading", false);
                        }
                    },
                    {
                        label: "下",
                        type: "radio",
                        checked: true,
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
                        checked: true,
                        id: "gridOn",
                        click: () => {
                            mainWindow.webContents.send("grid", true);
                        }
                    }, {
                        label: "关",
                        type: "radio",
                        checked: false,
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
];

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
    })
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});


