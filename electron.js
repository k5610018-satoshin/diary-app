const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false,
    });

    // カスタムメニュー
    const menu = Menu.buildFromTemplate([
        {
            label: 'ファイル',
            submenu: [
                { label: '終了', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
            ]
        },
        {
            label: '表示',
            submenu: [
                { label: '再読み込み', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
                { label: '開発者ツール', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
                { type: 'separator' },
                { label: 'ズームイン', accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
                { label: 'ズームアウト', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
                { label: 'ズームリセット', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
            ]
        },
        {
            label: 'ヘルプ',
            submenu: [
                {
                    label: 'バージョン情報', click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'My Diary',
                            message: 'My Diary アプリ',
                            detail: 'バージョン 1.0.0\n小学生向け日記アプリ\nAIフィードバック機能付き'
                        });
                    }
                }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);

    // ウィンドウの準備ができたら表示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 開発環境では localhost:3000 に接続
    // 本番環境では内蔵サーバーを使用
    const serverUrl = isDev ? 'http://localhost:3000' : 'http://localhost:3000';

    // サーバーの準備を待ってからロード
    const waitForServer = () => {
        const http = require('http');
        const check = () => {
            http.get(serverUrl, (res) => {
                mainWindow.loadURL(serverUrl);
            }).on('error', () => {
                setTimeout(check, 1000);
            });
        };
        check();
    };

    waitForServer();
}

function startServer() {
    if (!isDev) {
        // 本番環境ではNext.jsサーバーを起動
        const serverPath = path.join(__dirname, 'node_modules', '.bin', 'next');
        serverProcess = spawn(process.platform === 'win32' ? 'cmd' : 'sh',
            process.platform === 'win32' ? ['/c', 'npm', 'run', 'start'] : ['-c', 'npm run start'],
            {
                cwd: __dirname,
                env: { ...process.env, PORT: '3000' }
            }
        );

        serverProcess.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });
    }
}

app.whenReady().then(() => {
    startServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
