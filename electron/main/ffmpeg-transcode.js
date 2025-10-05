
const { ipcMain, dialog, BrowserWindow } = require("electron");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const { getFfmpegPath } = require("./getBinaries");

const PRESETS = {
  "4k": { v: ["-vf","scale=3840:-2","-c:v","libx264","-preset","fast","-crf","18"], a: ["-c:a","aac","-b:a","192k"], ext: ".mp4" },
  "1080p": { v: ["-vf","scale=1920:-2","-c:v","libx264","-preset","fast","-crf","20"], a: ["-c:a","aac","-b:a","160k"], ext: ".mp4" },
  "sd": { v: ["-vf","scale=854:-2","-c:v","libx264","-preset","fast","-crf","22"], a: ["-c:a","aac","-b:a","128k"], ext: ".mp4" },
  "unwatermarked": { v: ["-c:v","copy"], a: ["-c:a","copy"], ext: null } // rewrap copy
};

function buildArgs(input, out, presetKey) {
  const p = PRESETS[presetKey];
  if (!p) throw new Error("Unknown preset "+presetKey);
  return ["-y","-i", input, ...p.v, ...p.a, out];
}

ipcMain.handle("ffmpeg:transcode", async (evt, { input, preset }) => {
  const ffmpeg = getFfmpegPath();
  const p = PRESETS[preset] || PRESETS["1080p"];
  const ext = p.ext || path.extname(input) || ".mp4";
  const win = BrowserWindow.fromWebContents(evt.sender);
  const res = await dialog.showSaveDialog(win, {
    title: `Save ${preset} video`,
    defaultPath: path.join(path.dirname(input), `${path.parse(input).name}.${ext.replace(/^\./,"")}`),
    filters: [{ name: "Video", extensions: [ext.replace(".","")] }, { name:"All Files", extensions:["*"] }]
  });
  if (res.canceled) return { ok: false, canceled: true };
  const out = res.filePath;
  const args = buildArgs(input, out, preset);

  const code = await new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", resolve);
  });
  if (code !== 0) throw new Error("ffmpeg transcode failed");
  return { ok: true, output: out };
});

module.exports = {};
