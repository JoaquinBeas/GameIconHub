const { ipcMain, BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');

// Path to local storage file (inside user data directory)
const dataFile = path.join(app.getPath('userData'), 'local_data', 'data.json');

// Ensures the directory exists before writing/reading
function ensureDir() {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Main IPC handler setup
function setupIPC() {
    // Handle window actions from renderer (minimize, maximize, close)
    ipcMain.handle('win-action', (event, action) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) {
            console.error('Could not retrieve the window');
            return false;
        }

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
            default:
                console.warn('Unknown win action:', action);
                return false;
        }
    });

    // Load local data (owned items and encrypted GUID)
    ipcMain.handle('load-data', async () => {
        ensureDir();
        if (!fs.existsSync(dataFile)) {
            return { ownedItems: [], language: 'es_ES' }; // default language
        }

        const content = fs.readFileSync(dataFile, 'utf8');
        const json = JSON.parse(content || '{}');

        if (!json.language) {
            json.language = 'es_ES';
            fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');
        }

        return json;
    });

    // Save local data to disk
    ipcMain.handle('save-data', async (event, data) => {
        ensureDir();
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    });

    // Delete a Windows shortcut by app name
    ipcMain.handle('delete-shortcut', async (event, appName) => {
        try {
            const cleanAppName = sanitizeFileName(appName.replace(/_/g, ' '));
            const shortcutPath = path.join(app.getPath('desktop'), `${cleanAppName}.lnk`);

            if (fs.existsSync(shortcutPath)) {
                fs.unlinkSync(shortcutPath);
                return { success: true };
            } else {
                console.warn(`Shortcut not found: ${shortcutPath}`);
                return { success: false, message: 'Shortcut not found' };
            }
        } catch (err) {
            console.error('Error deleting shortcut:', err);
            return { success: false, message: err.message };
        }
    });

    // Read a file from disk (used by renderer via preload)
    ipcMain.handle('read-file', async (event, filePath, options) => {
        const absolutePath = path.join(__dirname, '..', '..', '..', filePath); // Adjust if saving in a different location
        return fs.promises.readFile(absolutePath, options || 'utf8');
    });
}

// Removes invalid characters from filenames
function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '');
}

module.exports = { setupIPC };
