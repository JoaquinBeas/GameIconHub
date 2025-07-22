// electron/ipc.js
const { ipcMain, BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');

function setupIPC() {
    ipcMain.handle('win-action', (event, action) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        switch (action) {
            case 'minimize':
                win.minimize();
                break;
            case 'toggle-max':
                if (win.isMaximized()) {
                    win.unmaximize();
                    return false;
                } else {
                    win.maximize();
                    return true;
                }
            case 'close':
                win.close();
                break;
        }
    });

    // --- Añade estos handlers dentro del setupIPC ---
    const dataFile = path.join(app.getPath('userData'), 'local_data', 'data.json');
    function ensureDir() {
        const dir = path.dirname(dataFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    ipcMain.handle('save-data', async (event, data) => {
        ensureDir();
        console.log('SAVE DATA to', dataFile);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
        console.log('DATA SAVED:', data);
        return true;
    });

    ipcMain.handle('load-data', async () => {
        ensureDir();
        console.log('LOAD DATA from', dataFile);
        if (!fs.existsSync(dataFile)) return {};
        const content = fs.readFileSync(dataFile, 'utf8');
        console.log('DATA LOADED:', content);
        return JSON.parse(content || '{}');
    });
}

module.exports = { setupIPC };
