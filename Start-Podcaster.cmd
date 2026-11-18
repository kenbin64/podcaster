@echo off
rem Starts ButterflyFx Podcast Creator. The first run installs Electron (the desktop shell), which takes a minute.
setlocal
cd /d "%~dp0"
where npm >nul 2>nul || (echo Node.js is needed: install it from https://nodejs.org and run this again. & pause & exit /b 1)
if not exist "node_modules\electron" (
  echo Installing Electron, the first time only...
  call npm install --no-audit --no-fund || (echo The install failed. See the messages above. & pause & exit /b 1)
)
rem Electron must start as a desktop app, not as plain Node.
set "ELECTRON_RUN_AS_NODE="
call npx electron .
