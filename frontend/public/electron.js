const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
}

app.whenReady().then(createWindow);

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

ipcMain.handle('scan-system', async () => {
  // Simulating WMI/PowerShell scan
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        os: { name: "Windows 11", version: "10.0.22621" },
        components: [
          { type: "BIOS", vendor: "Dell", version: "1.14.3" },
          { type: "SecurityAgent", vendor: "CrowdStrike", version: "7.17" }
        ]
      });
    }, 1500);
  });
});
