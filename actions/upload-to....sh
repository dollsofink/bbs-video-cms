#!/usr/bin/env bash
FILE="$1"
if [[ -z "$FILE" ]]; then echo "Usage: $0 /path/file.mp4"; exit 2; fi
read -rp "Enter upload destination (e.g., rclone remote:path): " DEST
if [[ -z "$DEST" ]]; then echo "No destination provided."; exit 1; fi
echo "Uploading '$FILE' to '$DEST' ..."
# Example: rclone copy "$FILE" "$DEST"
echo "(stub) Implement your upload here."
