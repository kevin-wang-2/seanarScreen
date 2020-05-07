const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const electron = require('electron');
const path = require('path');
const {setRange, setFreq, setGain} = require("./local/sonarControl");

let mainWindow;
let controlWindow;

function createWindow() {
    const menu = Menu.buildFromTemplate(template);
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

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});

let template = [
    {
        label: '文件[&F]',
        submenu: [{
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
                        click: () => {
                            setRange(1);
                        }
                    }, {
                        label: "2m",
                        click: () => {
                            setRange(2);
                        }
                    }, {
                        label: "3m",
                        click: () => {
                            setRange(3);
                        }
                    }, {
                        label: "4m",
                        click: () => {
                            setRange(4);
                        }
                    }, {
                        label: "5m",
                        click: () => {
                            setRange(5);
                        }
                    }, {
                        label: "6m",
                        click: () => {
                            setRange(6);
                        }
                    }, {
                        label: "7m",
                        click: () => {
                            setRange(7);
                        }
                    }, {
                        label: "8m",
                        click: () => {
                            setRange(8);
                        }
                    }, {
                        label: "9m",
                        click: () => {
                            setRange(9);
                        }
                    }, {
                        label: "10m",
                        click: () => {
                            setRange(10);
                        }
                    }, {
                        label: "15m",
                        click: () => {
                            setRange(15);
                        }
                    }, {
                        label: "20m",
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
                        click: () => {
                            setFreq(0);
                        }
                    }, {
                        label: "低频",
                        click: () => {
                            setFreq(1);
                        }
                    }, {
                        label: "高频",
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
                        click: () => {
                            setGain(10);
                        }
                    }, {
                        label: "20%",
                        click: () => {
                            setGain(20);
                        }
                    }, {
                        label: "30%",
                        click: () => {
                            setGain(30);
                        }
                    }, {
                        label: "40%",
                        click: () => {
                            setGain(40);
                        }
                    }, {
                        label: "50%",
                        click: () => {
                            setGain(50);
                        }
                    }, {
                        label: "60%",
                        click: () => {
                            setGain(60);
                        }
                    }, {
                        label: "70%",
                        click: () => {
                            setGain(70);
                        }
                    }, {
                        label: "80%",
                        click: () => {
                            setGain(80);
                        }
                    }, {
                        label: "90%",
                        click: () => {
                            setGain(90);
                        }
                    }, {
                        label: "100%",
                        click: () => {
                            setGain(100);
                        }
                    }
                ]
            }, {
                label: "剖面显示模式",
                submenu: [

                ]
            }, {
                type: "separator"
            }, {
                label: "冻结"
            }
        ]
    }, {
        label: "选项[&O]",
        submenu: [
            {
                label: "内置色表",
                submenu: [
                    {
                        label: "(&1) 灰度",
                        type: "radio",
                        checked: true,
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", null);
                        }
                    },
                    {
                        label: "(&2) 火山红-亮",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/hot.bin");
                        }
                    }, {
                        label: "(&3) 火山红-暗",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "rc/hot.png");
                        }
                    }, {
                        label: "(&4) 古铜色",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/copper.bin");
                        }
                    }, {
                        label: "(&5) 高对比度",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/jet.bin");
                        }
                    }, {
                        label: "(&6) 冷色调",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/cool.bin");
                        }
                    }, {
                        label: "(&7) 蓝色",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "rc/cool.png");
                        }
                    }, {
                        label: "(&8) 绿色",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/green.bin");
                        }
                    }, {
                        label: "(&9) 雷达灰",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "view/rc/bone.bin");
                        }
                    }, {
                        label: "(&0) HSV",
                        type: "radio",
                        click: () => {
                            mainWindow.webContents.send("loadColorMap", "rc/hsv.png");
                        }
                    }
                ]
            }
        ]
    }, {
        label: "回放",
        submenu: [
            {
                label: "回到真实速度",
                click: () => {
                    mainWindow.webContents.send("speed", 0)
                }
            },
            {
                label: "加速",
                accelerator: "CmdOrCtrl+Left",
                click: () => {
                    mainWindow.webContents.send("speed", 1);
                }
            }, {
                label: "减速",
                accelerator: "CmdOrCtrl+Right",
                click: () => {
                    mainWindow.webContents.send("speed", -1);
                }
            }, {
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

