#!/usr/bin/env bash
FILE="$1"
if [[ -z "$FILE" ]]; then echo "Usage: $0 /path/file.mp4"; exit 2; fi
OUT="${FILE%.*}.SD.mp4"
: "${FFMPEG_PATH:=ffmpeg}"
"$FFMPEG_PATH" -y -i "$FILE" -vf scale=-2:480 -c:v libx264 -crf 21 -preset fast -c:a aac -b:a 128k "$OUT"
echo "Done -> $OUT"
