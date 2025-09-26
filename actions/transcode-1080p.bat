@echo off
:: Transcode 1080p using ffmpeg (requires ffmpeg in PATH or FFMPEG_PATH env)
setlocal
set FILE=%1
if "%FILE%"=="" echo Usage: %~n0 "C:\path\file.mp4" & exit /b 2
set OUT=%~dpn1.1080p.mp4

echo [Transcode 1080p] Input: %FILE%
if not defined FFMPEG_PATH set FFMPEG_PATH=ffmpeg
"%FFMPEG_PATH%" -y -i "%FILE%" -vf scale=-2:1080 -c:v libx264 -crf 19 -preset medium -c:a aac -b:a 160k "%OUT%"
echo Done -> %OUT%
