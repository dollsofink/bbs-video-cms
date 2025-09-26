@echo off
:: Transcode 4K using ffmpeg
setlocal
set FILE=%1
if "%FILE%"=="" echo Usage: %~n0 "C:\path\file.mp4" & exit /b 2
set OUT=%~dpn1.4k.mp4

echo [Transcode 4K] Input: %FILE%
if not defined FFMPEG_PATH set FFMPEG_PATH=ffmpeg
"%FFMPEG_PATH%" -y -i "%FILE%" -vf scale=-2:2160 -c:v libx264 -crf 20 -preset medium -c:a aac -b:a 192k "%OUT%"
echo Done -> %OUT%
