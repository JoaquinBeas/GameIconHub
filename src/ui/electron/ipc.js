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
    ipcMain.handle('delete-shortcut', async (event, appName) => {
        try {
            const cleanAppName = sanitizeFileName(appName.replace(/_/g, ' '));
            const shortcutPath = path.join(app.getPath('desktop'), `${cleanAppName}.lnk`);
            // const shortcutPath = path.join(app.getPath('desktop'), `${appName}.lnk`);
            if (fs.existsSync(shortcutPath)) {
                fs.unlinkSync(shortcutPath);
                console.log(`🗑️ Deleted shortcut: ${shortcutPath}`);
                return { success: true };
            } else {
                console.warn(`⚠️ Shortcut not found: ${shortcutPath}`);
                return { success: false, message: 'Shortcut not found' };
            }
        } catch (err) {
            console.error('❌ Error deleting shortcut:', err);
            return { success: false, message: err.message };
        }
    });
}
function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '');
}

module.exports = { setupIPC };
