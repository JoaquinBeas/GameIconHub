// electron/preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    winAction: (action) => ipcRenderer.invoke('win-action', action)
});
