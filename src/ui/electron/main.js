// electron/main.js
const { app, BrowserWindow } = require('electron');
const { setupIPC } = require('./ipc');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, '..', 'assets', 'app_icon_big.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        frame: false,
        backgroundColor: '#2d2d2d',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    mainWindow.once('ready-to-show', () => mainWindow.show());
    // if (process.argv.includes('--dev')) {
    //     mainWindow.webContents.openDevTools();
    // }
    mainWindow.webContents.on('before-input-event', (event, input) => { //NO MORE DEVTOOLS
        const ctrlOrCmd = input.control || input.meta;
        if (input.type === 'keyDown' && ( input.key.toLowerCase() === 'f12' || (ctrlOrCmd && input.shift && input.key.toLowerCase() === 'i'))) {
            event.preventDefault();
        }
    });
}

// Called when Electron is ready to start
app.whenReady().then(() => {
    createWindow();
    setupIPC();
});

// Called when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Absolute path to the backend-config.json file
        const configPath = path.join(__dirname, '..', '..', '..', 'backend-config.json');

        // Check if the file exists and delete it
        if (fs.existsSync(configPath)) {
            try {
                fs.unlinkSync(configPath);
            } catch (err) {
                console.error('Error deleting backend-config.json:', err);
            }
        }

        app.quit();
    }
});

// macOS-specific behavior: recreate window when clicking the dock icon
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
