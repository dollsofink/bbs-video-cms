
const { spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { getFfmpegPath } = require("./getBinaries");

function takeSnapshot(videoPath, seconds, outDir = os.tmpdir()) {
  return new Promise((resolve, reject) => {
    const ffmpeg = getFfmpegPath();
    const out = path.join(outDir, `bbs-frame-${Date.now()}.jpg`);
    const args = [
      "-ss", String(Math.max(0, seconds||0)),
      "-y",
      "-i", videoPath,
      "-frames:v", "1",
      "-q:v", "2",
      out
    ];
    const p = spawn(ffmpeg, args);
    let stderr = "";
    p.stderr.on("data", d => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0 && fs.existsSync(out)) resolve(out);
      else reject(new Error(`ffmpeg exit ${code}: ${stderr}`));
    });
  });
}

module.exports = { takeSnapshot };
