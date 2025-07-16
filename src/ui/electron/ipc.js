// electron/ipc.js

const { ipcMain, BrowserWindow } = require('electron');

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
}

module.exports = { setupIPC };
