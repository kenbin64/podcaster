# ButterflyFx Podcast Creator

A video podcast studio that runs on your own computer. Write a script once, with its pictures and captions marked in the text, and the studio shows each one on the exact word you say it, while a teleprompter keeps that word right under the camera so you are always looking at the lens. Done right, the episode is finished when you stop talking: no post-production.

This is a portfolio project, built to demonstrate my work.

**Watch the demo:** [butterflyfx.us/work/podcaster.html](https://butterflyfx.us/work/podcaster.html): a narrated walkthrough of the studio in use, and a 75-second episode it made on its own, with no person on camera and no editing.

## What it does

- **Cue-driven scripts.** `{news | chart.png | Sales}` puts a graphic in the corner on the next word; `{text ll | A caption}` puts a caption on screen; `{section | Title}` plays a transition card. Every picture, caption, effect and transition is placed by the script.
- **A teleprompter made for the lens.** A marquee keeps the current word right under the camera, so you never look like you are reading. It follows a pace you set, or your voice word by word where the browser offers speech recognition.
- **Notes only you see.** `[to camera]`, `[pause 1]`, `[slower]`, `[warm]`: directions to you, never shown and never recorded.
- **A director for takes.** It splits the script into scenes, waits until your delivery is in range, records each take, lets you pick the keeper with a double-click, and assembles the keepers with transitions.
- **AI script writing, on your machine.** Describe the topic and the studio's local AI (Ollama) writes a script in the cue format, or rewrites a scene on request. Nothing leaves your computer.
- **The look.** Backdrops, background removal (MediaPipe, on-device), props, spotlights, an animated intro and end screen, sound and visual effects, and an adaptive music score.

## Start it

You need [Node.js](https://nodejs.org) 18 or later.

```
git clone https://github.com/kenbin64/podcaster.git
cd podcaster
Start-Podcaster.cmd          (Windows)
./start-podcaster.sh         (Mac and Linux)
```

The first start installs Electron (the desktop shell). Then load the demo episode: **📁 Files**, type `projects/demo-episode` in the path box, and press **📁 Load from path**.

Optional, for AI writing: install [Ollama](https://ollama.com) and run `ollama pull llama3.2`.

## Documentation

- [User guide](docs/USER-GUIDE.md): every panel, in the order you use them
- [Script and cue reference](docs/SCRIPT-FORMAT.md): every cue and note the studio understands
- [Writing scripts that bring their own visuals](docs/WRITING-SCRIPTS-WITH-ASSETS.md): how to write so the right picture lands on the right word
- [Writing scripts with AI](docs/AI-SCRIPTS.md): the studio's local AI, or any chatbot
- [How the demo videos were made](docs/DEMO-VIDEO.md): a narrated walkthrough, and a complete episode with no host and no editing

## Credit

Concept and direction: Kenneth W. Bingham. Built with the help of Claude AI under a standing directive to be skeptical, to insist on proof, and to allow no claim that is not demonstrated in tested code. The ideas are the author's; the AI implemented and verified them, it did not originate them.

MIT licensed. The files in `vendor/selfie` are MediaPipe Selfie Segmentation by Google, under the Apache License 2.0.
