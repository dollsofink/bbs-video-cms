
const { ipcMain, BrowserWindow } = require("electron");
const fs = require("fs/promises");
const fssync = require("fs");
const path = require("path");
const chokidar = require("chokidar");

async function readDirNodes(root, depth = 2) {
  const stats = await fs.stat(root).catch(() => null);
  if (!stats || !stats.isDirectory()) return [];

  async function walk(dir, level) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    const dirs = entries.filter(e => e.isDirectory());
    const nodes = await Promise.all(dirs.map(async d => {
      const full = path.join(dir, d.name);
      const node = { name: d.name, path: full, children: [] };
      if (level < depth) node.children = await walk(full, level + 1);
      return node;
    }));
    return nodes.sort((a,b) => a.name.localeCompare(b.name));
  }

  return [{ name: path.basename(root) || root, path: root, children: await walk(root, 0) }];
}

ipcMain.handle("fs:listTree", async (_evt, root, depth = 4) => {
  return await readDirNodes(root, depth);
});

// Optional: live update when filesystem changes
let watcher;
ipcMain.on("fs:watch", (evt, root) => {
  if (watcher) watcher.close();
  watcher = chokidar.watch(root, { ignoreInitial: true, depth: 4, awaitWriteFinish: true });
  const win = BrowserWindow.fromWebContents(evt.sender);
  watcher.on("all", async () => {
    const tree = await readDirNodes(root, 4);
    if (!win.isDestroyed()) win.webContents.send("fs:treeUpdate", tree);
  });
});
