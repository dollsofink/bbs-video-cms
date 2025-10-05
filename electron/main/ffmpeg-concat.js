
const { dialog, ipcMain } = require("electron");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { getFfmpegPath } = require("./getBinaries");

async function concatCopy(inputs, outputPathHint) {
  if (!Array.isArray(inputs) || inputs.length < 2) throw new Error("Select at least two videos.");
  const ffmpeg = getFfmpegPath();

  // Determine output extension from first file
  const first = inputs[0];
  const ext = path.extname(first) || ".mp4";
  const outPath = outputPathHint || path.join(path.dirname(first), `concat-${Date.now()}${ext}`);

  // Build concat list file
  const listPath = path.join(os.tmpdir(), `bbs-concat-${Date.now()}.txt`);
  const quoted = inputs.map(p => `file '${p.replace(/'/g,"'\\''")}'`).join("\n");
  await fsp.writeFile(listPath, quoted, "utf8");

  const args = [
    "-f","concat",
    "-safe","0",
    "-i", listPath,
    "-c","copy",
    outPath
  ];

  const code = await new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, args, { stdio: "inherit" });
    p.on("error", reject);
    p.on("close", resolve);
  });

  if (code !== 0) throw new Error("ffmpeg failed to concatenate (streams may be incompatible for stream copy).");

  return outPath;
}

function registerConcatIPC() {
  ipcMain.handle("ffmpeg:concat", async (evt, { inputs }) => {
    // Let user choose output via native save dialog
    const first = inputs?.[0];
    const defaultPath = first ? (path.join(path.dirname(first), `concat-${Date.now()}${path.extname(first)}`)) : undefined;
    const win = require("electron").BrowserWindow.fromWebContents(evt.sender);
    const res = await dialog.showSaveDialog(win, {
      title: "Save concatenated video",
      defaultPath,
      filters: [
        { name: "Same container as first file", extensions: [ (path.extname(first)||".mp4").replace(/^\./,"") ] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (res.canceled) return { ok: false, canceled: true };
    const out = await concatCopy(inputs, res.filePath);
    return { ok: true, output: out };
  });
}

module.exports = { registerConcatIPC, concatCopy };
