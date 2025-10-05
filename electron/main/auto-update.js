
const { app, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { loadSettings, saveSettings } = require("./settings");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isDue(last, intervalMs) {
  if (!last) return true;
  return (Date.now() - last) >= intervalMs;
}

function registerAutoUpdater() {
  const s = loadSettings();
  if (s.autoUpdate === undefined) {
    s.autoUpdate = true;
    saveSettings(s);
  }

  autoUpdater.autoDownload = true;          // download when found
  autoUpdater.autoInstallOnAppQuit = true;  // install on quit (safe default)

  autoUpdater.on("update-available", () => {
    // Optionally show a toast/notification in renderer via IPC
  });
  autoUpdater.on("update-downloaded", () => {
    // Optionally prompt; default behavior installs on quit
  });
  autoUpdater.on("error", (err) => {
    // swallow or log
    console.error("[autoUpdater] error:", err?.message || err);
  });

  // Manual trigger from renderer
  ipcMain.handle("updates:checkNow", async () => {
    try {
      await autoUpdater.checkForUpdatesAndNotify();
      const s2 = loadSettings();
      s2.lastUpdateCheck = Date.now();
      saveSettings(s2);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  });

  // On app ready, check if due (daily) or first launch
  app.whenReady().then(async () => {
    if (!s.autoUpdate) return;
    const s3 = loadSettings();
    if (isDue(s3.lastUpdateCheck, ONE_DAY_MS)) {
      try {
        await autoUpdater.checkForUpdatesAndNotify();
        s3.lastUpdateCheck = Date.now();
        saveSettings(s3);
      } catch (e) {
        // non-fatal
        console.warn("[autoUpdater] check failed:", e?.message || e);
      }
    }
  });
}

module.exports = { registerAutoUpdater };
