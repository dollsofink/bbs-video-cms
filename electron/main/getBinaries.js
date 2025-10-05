
const which = require("which");
const path = require("path");
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");

function resolveSystemOrBundled(cmd, bundled) {
  try { return which.sync(cmd); } catch (_) {}
  return bundled;
}

function getFfmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  return resolveSystemOrBundled("ffmpeg", ffmpegStatic);
}

function getFfprobePath() {
  if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;
  const bundled =
    process.platform === "win32"
      ? path.join(process.resourcesPath, "bin", "ffprobe-static", "windows", "x64", "ffprobe.exe")
      : ffprobeStatic.path;
  return resolveSystemOrBundled("ffprobe", bundled);
}

module.exports = { getFfmpegPath, getFfprobePath };
