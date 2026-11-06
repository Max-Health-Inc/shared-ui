#!/usr/bin/env bash
# Usage: encode-background-video <input> <output-basename> [height] [sigma] [crf] [out-dir]
# Pairs with BackgroundVideo. Always bump the -vN suffix: a long-cached clip under a reused name never ships.
set -euo pipefail

IN="${1:?usage: encode-background-video <input> <output-basename> [height] [sigma] [crf] [out-dir]}"
NAME="${2:?missing output basename}"
# Visible blur is about SIGMA x (viewport height / HEIGHT), so change them together; 0 keeps the clip sharp.
HEIGHT="${3:-720}"
SIGMA="${4:-8}"
# Blurred gradients band late; inspect a smooth region upscaled before raising CRF past 33.
CRF="${5:-33}"
OUT_DIR="${6:-public/video}"
FADE=1.5
CUT_FADE=1.0

mkdir -p "$OUT_DIR"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")"
echo "source: ${DURATION}s"

mapfile -t CUTS < <(
  ffmpeg -v error -i "$IN" -vf "select='gt(scene,0.3)',metadata=print:file=-" -f null - 2>&1 |
    sed -n 's/.*pts_time:\([0-9.]*\).*/\1/p'
)
echo "scene changes: ${#CUTS[@]} ${CUTS[*]:-}"

BASE="scale=-2:${HEIGHT}:flags=lanczos,fps=15"
if awk -v s="$SIGMA" 'BEGIN{exit !(s > 0)}'; then BASE="${BASE},gblur=sigma=${SIGMA}"; fi

if [ "${#CUTS[@]}" -eq 1 ]; then
  CUT="${CUTS[0]}"
  OFFSET="$(awk -v c="$CUT" -v f="$CUT_FADE" 'BEGIN{printf "%.6f", c - f}')"
  ffmpeg -y -v error -i "$IN" -filter_complex "
    [0:v]${BASE},split[s1][s2];
    [s1]trim=0:${CUT},setpts=PTS-STARTPTS[a];
    [s2]trim=${CUT},setpts=PTS-STARTPTS[b];
    [a][b]xfade=transition=fade:duration=${CUT_FADE}:offset=${OFFSET}[v]
  " -map "[v]" -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -an "$WORK/mid.mp4"
else
  ffmpeg -y -v error -i "$IN" -vf "$BASE" \
    -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -an "$WORK/mid.mp4"
fi

MID_DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/mid.mp4")"
LOOP_OFFSET="$(awk -v d="$MID_DUR" -v f="$FADE" 'BEGIN{printf "%.6f", d - 2*f}')"

# A starts at FADE so the crossfade ends on the same frame the output began with.
ffmpeg -y -v error -i "$WORK/mid.mp4" -filter_complex "
  [0:v]split[p][q];
  [p]trim=${FADE}:${MID_DUR},setpts=PTS-STARTPTS[a];
  [q]trim=0:${FADE},setpts=PTS-STARTPTS[b];
  [a][b]xfade=transition=fade:duration=${FADE}:offset=${LOOP_OFFSET}[v]
" -map "[v]" -c:v libx264 -profile:v main -crf "$CRF" -preset slow -g 30 \
  -pix_fmt yuv420p -an -movflags +faststart "$OUT_DIR/${NAME}.mp4"

ffmpeg -y -v error -i "$OUT_DIR/${NAME}.mp4" -frames:v 1 \
  -c:v libwebp -quality 70 "$OUT_DIR/${NAME}-poster.webp"

printf '\n%s: %s bytes, %ss\n' "${NAME}.mp4" \
  "$(wc -c < "$OUT_DIR/${NAME}.mp4" | tr -d ' ')" \
  "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT_DIR/${NAME}.mp4")"
printf '%s: %s bytes\n' "${NAME}-poster.webp" "$(wc -c < "$OUT_DIR/${NAME}-poster.webp" | tr -d ' ')"
