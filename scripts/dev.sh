#!/usr/bin/env bash
#
# Local development server with working live reload.
#
# Starts three things and shuts them all down together on Ctrl+C:
#   1. Tailwind, watching assets/css/input.css -> static/css/main.css
#   2. hugo server on http://localhost:1313/
#   3. A poll loop that forces a full re-render when data/*.yaml changes
#
# Two environment quirks this works around:
#
#   * This repo lives under ~/Documents, which is a symlink into iCloud Drive
#     (~/Library/Mobile Documents/com~apple~CloudDocs). CloudDocs does not emit
#     reliable filesystem change events, so the default fsnotify/chokidar
#     watchers never fire. Both watchers therefore run in polling mode.
#     Tailwind also needs --watch=always, because its CLI exits as soon as
#     stdin closes.
#
#   * Hugo detects edits to data/*.yaml ("Data changed /people.yaml") but then
#     re-renders nothing ("Total in 0 ms") and writes nothing to public/, even
#     with --disableFastRender. This site is almost entirely data-driven, so
#     that leaves the rendered HTML stale. Touching layouts/_default/baseof.html
#     registers as a template change, which does force a full re-render and a
#     live-reload push — so the loop below does exactly that whenever the
#     contents of data/ change.
#
# Usage: npm run dev   (extra args are passed through to hugo server)

set -eo pipefail
cd "$(dirname "$0")/.."

TW_PID=""
HUGO_PID=""

cleanup() {
  [ -n "$TW_PID" ] && kill "$TW_PID" 2>/dev/null
  [ -n "$HUGO_PID" ] && kill "$HUGO_PID" 2>/dev/null
  return 0
}
trap cleanup EXIT INT TERM

echo "==> Tailwind watcher (polling)"
npx tailwindcss -i assets/css/input.css -o static/css/main.css --watch=always --poll &
TW_PID=$!

echo "==> hugo server (polling)"
hugo server --poll 700ms --disableFastRender --navigateToChanged -D "$@" &
HUGO_PID=$!

# Content hash of all data files. Hashing content rather than checking mtimes
# matters here: iCloud sync re-stamps mtimes roughly once a minute, which would
# otherwise cause a steady stream of pointless rebuilds.
fingerprint() {
  find data -name '*.yaml' -type f -exec shasum {} + 2>/dev/null | shasum
}

last="$(fingerprint)"
while sleep 1; do
  # Stop the loop if either watcher died, so Ctrl+C-ing one exits cleanly.
  kill -0 "$HUGO_PID" 2>/dev/null || break

  now="$(fingerprint)"
  if [ "$now" != "$last" ]; then
    last="$now"
    echo "==> data/ changed - forcing full re-render"
    touch layouts/_default/baseof.html
  fi
done
