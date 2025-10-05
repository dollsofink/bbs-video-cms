
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('./fs-api'); // registers IPC
const isDev = process.env.NODE_ENV !== 'production';

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile(path.join(__dirname, '../../renderer/index.html'));
  if (isDev) win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});


// Register settings + AI IPC
require('./settings').registerSettingsIPC();
require('./ai-description').registerAIDescriptionIPC();


// Register concat IPC
require('./ffmpeg-concat').registerConcatIPC();


// Register auto-updater (GitHub Releases)
require('./auto-update').registerAutoUpdater();


// Register transcode IPC
require('./ffmpeg-transcode.js');


// Register upload IPC
require('./upload.js').registerUploadIPC();
