const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const isDev = !app.isPackaged;

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

  if (isDev) {
    win.webContents.openDevTools();
  }
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
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'scan.ps1');
    exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error("PowerShell scan failed:", error);
        resolve({
          os: { name: "Windows", version: "Unknown" },
          components: []
        });
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (e) {
        console.error("JSON parse failed, using fallback:", e);
        resolve({
          os: { name: "Windows", version: "Unknown" },
          components: []
        });
      }
    });
  });
});
