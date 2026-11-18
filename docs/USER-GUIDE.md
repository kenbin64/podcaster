# User guide

This guide follows the studio in the order you use it: set up, write or load a script, set the look, record, review, and save. Panels open from the tabs along the bottom of the window.

## 1. Start the studio

Run `Start-Podcaster.cmd` (Windows) or `./start-podcaster.sh` (Mac and Linux). The first start installs Electron, the desktop shell, which takes a minute. The studio opens in its own window and serves itself only to your own computer.

The first time, a Setup window appears. **Finish setup** saves your choices; **Skip for now** closes it. If [Ollama](https://ollama.com) is running, Setup lets you choose the AI model for script writing. Reopen it any time with **⚙ Setup**.

## 2. Camera and microphone (🎥 Camera & Voice)

1. **↻ Detect cameras**, then choose your camera and microphone.
2. **Enable camera (live)**. Record buttons stay off until a camera is on.
3. **🎚 Calibrate (room tone + my baseline)**: stay silent for 3 seconds, then talk normally for 10. The voice meters and the director use this baseline.

A phone can be the camera: Android 14 and later offers a USB "Webcam" mode, or use the Iriun Webcam app. To build an episode on footage you already shot, use **🎞 Open a video (prerecorded)** instead.

## 3. The script (📁 Files and 📝 Script & Prompter)

Any of these loads a script:

- Type or paste into the **Script** box.
- **⤓ Import script** for a `.txt` or `.md` file.
- **🔗 Open project folder**: picks a folder, loads its `*.cuescript.txt`, and loads every picture and clip in it (subfolders included) by file name.
- Type a folder path and press **📁 Load from path** (desktop app). A relative path such as `projects/demo-episode` is read from the studio's own folder.
- **✨ AI write** or **✨ Hybrid**: see [Writing scripts with AI](AI-SCRIPTS.md).

Add pictures with **+ Import media**. Any picture the script names but that is not loaded shows as a red block in the script view, and as a labeled placeholder on screen.

The cue format is in the [script and cue reference](SCRIPT-FORMAT.md), and how to write a good one is in [Writing scripts that bring their own visuals](WRITING-SCRIPTS-WITH-ASSETS.md).

## 4. The teleprompter

The current word sits right under the **↑ CAMERA ↑** mark, with the next words visible, so your eyes stay on the lens.

- **Pace** sets words per minute (60 to 300). Notes like `[slower]` adjust it as you go.
- **Space** pauses and resumes.
- **🎤 Voice-advance** makes the teleprompter follow your voice word by word, where speech recognition is available.
- **🎙 Voice commands**: say "action" to record, "cut" to stop, "again" for a retake, and "slow down" or "faster" to change pace.

## 5. The look (💡 Look)

- **Backdrop**: built-in themes or your own image.
- **Keep me in front**: on-device background removal, so you stand in front of the backdrop.
- **Props**: microphone, ON AIR sign, plant, framed art, episode badge. Add your own PNGs, then drag to move them, scroll to resize, and Shift-scroll to rotate.
- **Spotlights**, an **animated intro** (title, host, tagline, episode number) and an **end screen** with "coming up next".
- **Music & Score**: intro music, and an adaptive score that can follow `{music}` cues.

## 6. Record

**The director (recommended):** in **🎬 Director & Scenes**, press **🎬 Start Director**. It checks that the camera and script are ready, splits the script into scenes, calibrates if needed, and then records each scene once your delivery is in range. A clapperboard slates every take.

**By hand:** **● Record this scene** records the current scene. **● Record (with 3-2-1)** records the whole script in one go, with the intro and end screen. **▷ Rehearse** runs everything without saving.

Effects can also be fired live from the **✨ Effects** bar while you record.

## 7. Review takes

Each scene lists its takes:

- Click a take to play it; **double-click to keep it** (★).
- Right-click for Play, Set as keeper, Download, Delete. **✕** deletes the take and its file.
- Untick a scene to leave it out of the final video.

## 8. Assemble and save

- **▶ Preview the cut** plays the keepers in order, with dissolves and section cards.
- **⤓ Assemble + save** records the finished episode.
- **🎬 Save as video** writes it to the `exports` folder as WebM (720p or 1080p).
- **💾 Save as project** saves the script, settings and pictures in one `.bfxproj` file.

Takes are saved as they are recorded, in `recordings/<title>/scene-NN/take-N.webm`.

## Known limits

- Video export is WebM only.
- AI video generation is not built yet; AI images need a local Stable Diffusion server.
- Voice-advance and voice commands depend on speech recognition, which may not be available in the desktop shell.
- Effect sounds may not be captured in single-scene takes, because those record the microphone directly.
- Two fields share the id `epNum`, so the episode number in the Look panel is not read; set it in the quick-load box instead.
