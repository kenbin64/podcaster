# Run ONCE (PowerShell), from this folder, to add a free local voice so the studio's
#   Voiceover -> Generate  makes private .wav files entirely on your machine.
# It downloads Piper (open-source TTS) + one English voice into the layout the app expects:
#   tts/piper/piper.exe   and   tts/voices/<voice>.onnx (+ .onnx.json)
#
# YOU RUN:  Right-click this file -> Run with PowerShell   (or:  powershell -ExecutionPolicy Bypass -File .\get-voice.ps1)
# Honest note: if a download 404s, the project may have moved. Check https://github.com/rhasspy/piper/releases
# for the current Windows zip, and https://huggingface.co/rhasspy/piper-voices for voices, then update the URLs below.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$piperUrl = 'https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip'
$voiceOnnx = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx'
$voiceJson = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json'

if (-not (Test-Path (Join-Path $root 'piper\piper.exe'))) {
  $zip = Join-Path $root 'piper.zip'
  Write-Host 'Downloading Piper (Windows)...'
  Invoke-WebRequest -Uri $piperUrl -OutFile $zip
  Write-Host 'Extracting Piper...'
  Expand-Archive -Path $zip -DestinationPath $root -Force
  Remove-Item $zip -Force
} else { Write-Host 'Piper already present, skipping.' }

$voices = Join-Path $root 'voices'
New-Item -ItemType Directory -Force -Path $voices | Out-Null
if (-not (Test-Path (Join-Path $voices 'en_US-lessac-medium.onnx'))) {
  Write-Host 'Downloading a default voice (en_US-lessac-medium)...'
  Invoke-WebRequest -Uri $voiceOnnx -OutFile (Join-Path $voices 'en_US-lessac-medium.onnx')
  Invoke-WebRequest -Uri $voiceJson -OutFile (Join-Path $voices 'en_US-lessac-medium.onnx.json')
} else { Write-Host 'Voice already present, skipping.' }

Write-Host ''
Write-Host 'Done. Restart the studio. In the Voiceover panel pick a "Local:" voice and hit Generate.' -ForegroundColor Green
Write-Host 'Add more voices: drop any *.onnx (+ its .onnx.json) into tts\voices\ .'
