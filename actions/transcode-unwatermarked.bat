@echo off
:: Copy stream (unwatermarked passthrough if source is clean)
setlocal
set FILE=%1
if "%FILE%"=="" echo Usage: %~n0 "C:\path\file.mp4" & exit /b 2
set OUT=%~dpn1.unwatermarked.mp4

echo [Unwatermarked passthrough] Input: %FILE%
if not defined FFMPEG_PATH set FFMPEG_PATH=ffmpeg
"%FFMPEG_PATH%" -y -i "%FILE%" -c copy "%OUT%"
echo Done -> %OUT%
