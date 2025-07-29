const { ipcMain, BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 🔐 Encryption key derived from a static secret string
const ENCRYPTION_KEY = crypto.createHash('sha256').update('ZKGuwSSMwcgB4NrkmnEhcmFcjlnHxhOK').digest(); //TODO: ESCONDER ESTO
const IV_LENGTH = 16;

let guid = null;

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
            console.error('❌ Could not retrieve the window');
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
            return { encryptedGuid: getEncryptedGUID(), ownedItems: [] };
        }

        const content = fs.readFileSync(dataFile, 'utf8');
        const json = JSON.parse(content || '{}');

        if (!json.encryptedGuid) {
            json.encryptedGuid = getEncryptedGUID();
            fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');
        }

        return json;
    });

    // Save local data to disk
    ipcMain.handle('save-data', async (event, data) => {
        ensureDir();

        if (!data.encryptedGuid) {
            data.encryptedGuid = getEncryptedGUID();
        }

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

// Generates and caches an encrypted GUID, or returns existing one
function getEncryptedGUID() {
    if (guid) return guid;

    if (fs.existsSync(dataFile)) {
        const content = fs.readFileSync(dataFile, 'utf8');
        const json = JSON.parse(content || '{}');
        if (json.encryptedGuid) return json.encryptedGuid;
    }

    const rawGuid = crypto.randomUUID();
    const encrypted = encrypt(rawGuid);
    guid = encrypted;
    return encrypted;
}

// 🔐 Encrypts a string using AES-256-CBC
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 🔓 Decrypts an encrypted string using AES-256-CBC
function decrypt(data) {
    const [ivHex, encryptedHex] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
}

module.exports = { setupIPC };
