const { spawn } = require('child_process');
const { app, BrowserWindow } = require('electron');
const { setupIPC } = require('./ipc');
const path = require('path');
const fs = require('fs');

let backendProcess = null; // 🔹 Declarar global

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

    // ❌ Desactivar DevTools
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
    });

    // ❌ Bloquear atajos como Ctrl+Shift+I, F12
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (
            (input.key.toLowerCase() === 'i' && input.control && input.shift) ||
            input.key.toLowerCase() === 'f12'
        ) {
            event.preventDefault();
        }
    });

    // if (process.argv.includes('--dev')) {
    //     mainWindow.webContents.openDevTools();
    // }

    return mainWindow;
}
function launchBackend() {
    let backendBinary;

    if (app.isPackaged) {
        // Producción: exe en resources
        backendBinary = path.join(process.resourcesPath, 'backend', 'backend.exe');
    } else {
        // Desarrollo: exe generado por PyInstaller en dist_backend
        backendBinary = path.join(__dirname, '..','..','..', 'dist_backend', 'utils.exe');
    }

    backendProcess = spawn(backendBinary, [], {
        detached: true,
        windowsHide: true, // 🔹 Oculta ventana negra
        stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', data => console.log(`[backend] ${data}`));
    backendProcess.stderr.on('data', data => console.error(`[backend error] ${data}`));
}


function waitForBackendReady(configPath, timeoutMs = 10000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (fs.existsSync(configPath) || Date.now() - start > timeoutMs) {
                clearInterval(interval);
                resolve();
            }
        }, 200);
    });
}

app.whenReady().then(async () => {
    launchBackend();
    const configPath = path.join(app.getPath('userData'), 'config', 'backend-config.json');
    await waitForBackendReady(configPath); // 🔹 Espera antes de abrir ventana
    createWindow();
    setupIPC();
});

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }

    // 🔹 Limpieza del archivo de config
    const configPath = path.join(app.getPath('userData'), 'config', 'backend-config.json');
    if (fs.existsSync(configPath)) {
        try {
            fs.unlinkSync(configPath);
        } catch (err) {
            console.error('Error deleting backend-config.json:', err);
        }
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
