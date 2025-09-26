
const { execSync } = require('child_process');

function tryCmd(cmd) {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore']}).toString().trim(); }
  catch { return ''; }
}

const ffmpegPath = process.env.FFMPEG_PATH || tryCmd('where ffmpeg') || tryCmd('which ffmpeg');
const ffprobePath = process.env.FFPROBE_PATH || tryCmd('where ffprobe') || tryCmd('which ffprobe');

console.log('[postinstall] If you plan to use Transcode actions, ensure ffmpeg/ffprobe are installed.');
if (ffmpegPath) console.log('[postinstall] ffmpeg detected at:', ffmpegPath);
if (ffprobePath) console.log('[postinstall] ffprobe detected at:', ffprobePath);
