
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
const isWin = process.platform === 'win32';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Video CMS Explorer"
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Helpers
function readConfig() {
  try {
    const p = path.join(__dirname, 'config.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return { roots: [], videoExtensions: [".mp4",".mkv",".mov",".webm",".m4v"], defaultActions: [] };
  }
}

function isVideo(filePath, videoExts) {
  const ext = path.extname(filePath).toLowerCase();
  return videoExts.includes(ext);
}

function listDir(dir, videoExts) {
  const entries = [];
  try {
    const names = fs.readdirSync(dir);
    for (const name of names) {
      const fp = path.join(dir, name);
      const stat = fs.statSync(fp);
      let type = stat.isDirectory() ? 'dir' : 'file';
      entries.push({
        name,
        path: fp,
        type,
        size: stat.size,
        mtime: stat.mtimeMs,
        isVideo: type === 'file' && isVideo(fp, videoExts)
      });
    }
  } catch (e) {
    return { error: e.message, entries: [] };
  }
  return { entries };
}

// IPC
ipcMain.handle('config:read', async () => {
  return readConfig();
});

ipcMain.handle('config:write', async (evt, cfg) => {
  try {
    const p = path.join(__dirname, 'config.json');
    require('fs').writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
    return true;
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('dialog:chooseFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || !filePaths.length) return null;
  return filePaths[0];
});

ipcMain.handle('fs:listDir', async (evt, dir) => {
  const cfg = readConfig();
  return listDir(dir, cfg.videoExtensions);
});

ipcMain.handle('fs:stat', async (evt, filePath) => {
  try {
    const s = fs.statSync(filePath);
    return { size: s.size, mtime: s.mtimeMs, birthtime: s.birthtimeMs, isFile: s.isFile(), isDir: s.isDirectory() };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('fs:readText', async (evt, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
});

ipcMain.handle('fs:writeText', async (evt, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (e) {
    return { error: e.message };
  }
});

// Open file externally
ipcMain.handle('shell:showItemInFolder', async (evt, p) => {
  shell.showItemInFolder(p);
});

ipcMain.handle('shell:openExternal', async (evt, p) => {
  shell.openPath(p);
});

// Actions: runs .bat / .sh with file path
ipcMain.handle('actions:run', async (evt, actionName, filePath) => {
  const actionsDir = path.join(__dirname, 'actions');
  const base = actionName.toLowerCase().replace(/\s+/g, '-');
  const bat = path.join(actionsDir, `${base}.bat`);
  const sh = path.join(actionsDir, `${base}.sh`);

  let cmd, args;
  if (isWin && fs.existsSync(bat)) {
    cmd = 'cmd.exe';
    args = ['/c', bat, filePath];
  } else if (fs.existsSync(sh)) {
    cmd = 'bash';
    args = [sh, filePath];
  } else {
    return { error: `No script found for action "${actionName}". Expected: ${bat} or ${sh}` };
  }

  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'pipe' });
    let out = '', err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => {
      resolve({ code, out, err });
    });
  });
});

// Save XMP/TXT sidecars
ipcMain.handle('meta:writeSidecars', async (evt, filePath, xmpXml, txtContent) => {
  try {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const xmpPath = path.join(dir, base + '.xmp');
    const txtPath = path.join(dir, base + '.meta.txt');
    fs.writeFileSync(xmpPath, xmpXml, 'utf8');
    fs.writeFileSync(txtPath, txtContent, 'utf8');
    return { xmpPath, txtPath };
  } catch (e) {
    return { error: e.message };
  }
});

// Read XMP (best-effort)
ipcMain.handle('meta:readXmp', async (evt, filePath) => {
  try {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const xmpPath = path.join(dir, base + '.xmp');
    if (!fs.existsSync(xmpPath)) return null;
    const xml = fs.readFileSync(xmpPath, 'utf8');
    return xml;
  } catch (e) {
    return null;
  }
});
