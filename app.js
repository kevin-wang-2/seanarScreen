const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const electron = require('electron');
const path = require('path');

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
        label: '文件',
        submenu: [{
            label: '打开',
            accelerator: 'CmdOrCtrl+O',
            role: 'open',
            click: () => {
                dialog.showOpenDialog({
                    title: "打开声呐回放文件",
                    filters: [
                        {name: "标准声呐回放文件", extensions: ["123"]}
                        ]
                }).then((fn) => {
                    console.log(fn);
                });
            }
        }, {
            label: '保存',
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
            label: "首选项",
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => {
                mainWindow.webContents.send("message");
            }
        }, {
            label: "打开开发者工具",
            click: () => { mainWindow.webContents.openDevTools() }
        }]
    }, {
        "label": "模式",
        submenu: [
            {
                label: "高帧率",
                click: () => {
                    mainWindow.webContents.send("setTickRate", 1000);
                }
            },
            {
                label: "低帧率",
                click: () => {
                    mainWindow.webContents.send("setTickRate", 25);
                }
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
                click: () => {
                    mainWindow.webContents.send("speed", 1);
                }
            }, {
                label: "减速",
                click: () => {
                    mainWindow.webContents.send("speed", -1);
                }
            }
        ]
    }
];

