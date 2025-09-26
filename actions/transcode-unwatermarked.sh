#!/usr/bin/env bash
FILE="$1"
if [[ -z "$FILE" ]]; then echo "Usage: $0 /path/file.mp4"; exit 2; fi
OUT="${FILE%.*}.unwatermarked.mp4"
: "${FFMPEG_PATH:=ffmpeg}"
"$FFMPEG_PATH" -y -i "$FILE" -c copy "$OUT"
echo "Done -> $OUT"
