// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { setupIPC } = require('./ipc');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, '..', 'assets', 'app_icon_big.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 👈 nuevo
            contextIsolation: true,                     // 👈 activado
            nodeIntegration: false                      // 👈 desactivado
        },
        frame: false,
        backgroundColor: '#2d2d2d',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    mainWindow.once('ready-to-show', () => mainWindow.show());

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();
    setupIPC();
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
