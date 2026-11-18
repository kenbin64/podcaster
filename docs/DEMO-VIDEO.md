# How the demo videos were made

There are two: a narrated **walkthrough** of the studio being used, and the **episode** the studio made on its own. Both are on [the project page](https://butterflyfx.us/work/podcaster.html).

## The walkthrough

`projects/walkthrough-episode/video` records the real studio on screen, about 69 seconds:

1. `walkthrough.json` lists what the narrator says and what happens on screen at each step: open the episode folder, show a cue in the script, set the look, then talk.
2. `narrate.py` speaks each line with an Australian Microsoft neural voice (en-AU William, through `edge-tts`), and records when every word begins. It builds `timeline.json`: when each clip plays, when each on-screen step happens, and, for the episode part, when each word reaches the teleprompter.
3. `record-walkthrough.cjs` opens the studio, clicks through those steps on time, and during the episode drives the teleprompter and cues from the word timings, while Chrome records its own tab with the narration.

```
cd projects/walkthrough-episode/video
npm install
pip install edge-tts truststore
python narrate.py
npm run record
```

`edge-tts` sends the narration text to Microsoft's online Read Aloud service to make the audio. `voice_tls.py` lets it use the Windows certificate store, for machines where antivirus inspects secure traffic.

## The episode

[The demo](https://butterflyfx.us/work/podcaster.html) is a complete 75-second episode made by the studio itself, with no person on camera and no editing afterwards. Every graphic, caption, transition and effect was placed by the script in `projects/demo-episode`.

## The pieces

| Piece | Where it is | What it does |
|---|---|---|
| The script | `projects/demo-episode/demo-episode.cuescript.txt` | Words, cues and notes, in the studio's format |
| The pictures | `projects/demo-episode/assets/` | Six slides, named exactly as the script names them |
| The host | `projects/demo-episode/host.png` | An illustrated host, used as the studio's backdrop |
| The narration | `projects/demo-episode/video/` | Spoken by Windows text-to-speech, with the time of every word |
| The recorder | `projects/demo-episode/video/record-demo.cjs` | Runs the studio and records its stage |

## How it works

1. **Narration with word timing.** `make-timing.py items` reads the script with the studio's own tokenizer and lists the spoken words, plus a silence wherever a section card or a `[pause]` belongs. `tts.ps1` has Windows speak them, and records the exact moment each word begins.
2. **The studio does the rest.** `record-demo.cjs` opens the studio, loads the episode folder exactly as **🔗 Open project folder** would, and sets the host picture as the backdrop. As the narration plays, each word's moment advances the teleprompter and fires that word's cues: the same thing the studio's voice-advance does for a live speaker.
3. **Recording.** The studio's stage is recorded with the narration, scaled to 720p so the file stays small enough to host, with a keyframe every 2 seconds so viewers can skip around, and its length written in so players show a timeline.

## Make it again, or make your own

```
cd projects/demo-episode/video
npm install
python make-timing.py items
powershell -ExecutionPolicy Bypass -File tts.ps1
python make-timing.py timing
npm run record
```

Change the script and the pictures, run the same steps, and you have a new episode. The narration needs Windows; anything that can speak the words and report when each one starts would work the same way.
