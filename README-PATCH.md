
# BB's Video CMS – Patch

This patch adds:
- Electron packaging for **Windows (NSIS)** and **macOS (DMG + PKG)**.
- Bundled **ffmpeg/ffprobe** with installer-time installation to PATH if missing.
- Runtime resolver to prefer system binaries, fallback to bundled.
- **Left folder tree** showing subdirectories of the current root with live updates.

## Build
```bash
npm i
npm run dev        # dev
npm run dist:win   # Windows installer (NSIS)
npm run dist:mac   # macOS DMG + PKG (PKG runs postinstall)
```

## Notes
- On macOS, only the **PKG** runs the postinstall that copies ffmpeg/ffprobe to `/usr/local/bin` if missing.
- On Windows, the **NSIS** script installs to `%LOCALAPPDATA%\\BBsVideoCMS\\bin` and appends to User PATH.
- At runtime, the app uses `FFMPEG_PATH` / `FFPROBE_PATH` if set, else system PATH, else bundled.


## Auto-updates (GitHub Releases)
- Configured `electron-updater` with `publish` pointing to `dollsofink/bbs-video-cms`.
- App checks for updates **on launch** (no more than once per 24 hours) and downloads automatically.
- Manual trigger: Top toolbar → **Check for updates** (installs on app quit).
- To ship updates: create a **GitHub Release** with artifacts built by `electron-builder`.
