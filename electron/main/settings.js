
const fs = require("fs");
const path = require("path");
const { app, ipcMain } = require("electron");

const SETTINGS_FILE = path.join(app.getPath("userData"), "settings.json");

function loadSettings() {
  try {
    const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    return s;
  } catch (_) {
    return {
      openaiApiKey: "",
      model: "gpt-4o-mini",
      basePrompt: "",
    };
  }
}

function saveSettings(obj) {
  const data = JSON.stringify(obj || {}, null, 2);
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, data, "utf8");
}

function registerSettingsIPC() {
  ipcMain.handle("settings:get", async () => loadSettings());
  ipcMain.handle("settings:set", async (_evt, s) => {
    saveSettings(s);
    return { ok: true };
  });
}

module.exports = { loadSettings, saveSettings, registerSettingsIPC };
