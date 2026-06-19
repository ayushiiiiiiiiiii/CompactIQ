const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  scanSystem: () => ipcRenderer.invoke('scan-system')
});
