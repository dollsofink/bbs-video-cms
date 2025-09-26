@echo off
:: Transcode SD (480p) using ffmpeg
setlocal
set FILE=%1
if "%FILE%"=="" echo Usage: %~n0 "C:\path\file.mp4" & exit /b 2
set OUT=%~dpn1.SD.mp4

echo [Transcode SD] Input: %FILE%
if not defined FFMPEG_PATH set FFMPEG_PATH=ffmpeg
"%FFMPEG_PATH%" -y -i "%FILE%" -vf scale=-2:480 -c:v libx264 -crf 21 -preset fast -c:a aac -b:a 128k "%OUT%"
echo Done -> %OUT%
