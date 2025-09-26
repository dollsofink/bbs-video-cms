#!/usr/bin/env bash
FILE="$1"
if [[ -z "$FILE" ]]; then echo "Usage: $0 /path/file.mp4"; exit 2; fi
OUT="${FILE%.*}.1080p.mp4"
: "${FFMPEG_PATH:=ffmpeg}"
"$FFMPEG_PATH" -y -i "$FILE" -vf scale=-2:1080 -c:v libx264 -crf 19 -preset medium -c:a aac -b:a 160k "$OUT"
echo "Done -> $OUT"
