# Voiceover (local, free, private)

The studio's **Voiceover & narration** panel turns text into speech.

- **Preview** works right now, no setup, using your browser's built-in voices (not saved).
- **Generate** makes a real `.wav` file using **Piper**, a free, open-source voice that runs entirely on
  this machine. Nothing is uploaded anywhere.

## One-time setup for saved files

Run `get-voice.ps1` once (right-click -> Run with PowerShell). It places:

```
tts/piper/piper.exe          the engine
tts/voices/<name>.onnx        a voice (+ its .onnx.json)
```

Restart the studio, pick a **Local:** voice in the panel, and Generate.

## More / different voices

Drop any Piper voice (`*.onnx` plus its matching `*.onnx.json`) into `tts/voices/`. Browse voices at
<https://huggingface.co/rhasspy/piper-voices>. Each shows up in the panel's voice list.

## Two modes

- **Voice only** — a standalone audio episode (podcast audio, no video).
- **Over the video** — a narration track to lay over your video. (Mixing it straight into the assembled
  cut is the next step; for now you get the track to drop on.)
