#!/usr/bin/env bash
# Starts ButterflyFx Podcast Creator. The first run installs Electron (the desktop shell), which takes a minute.
cd "$(dirname "$0")"
command -v npm >/dev/null || { echo "Node.js is needed: install it from https://nodejs.org and run this again."; exit 1; }
if [ ! -d node_modules/electron ]; then
  echo "Installing Electron, the first time only..."
  npm install --no-audit --no-fund || { echo "The install failed. See the messages above."; exit 1; }
fi
unset ELECTRON_RUN_AS_NODE
npx electron .
