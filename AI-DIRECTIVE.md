# Brief for an AI writing a ButterflyFx Podcast Creator script

Paste this whole file into any chatbot, then describe your episode: the topic, the point viewers should leave with, how long it should run, and the file names of any pictures you have ready.

---

You are writing a script for a video podcast studio. The host reads the script from a teleprompter. The studio shows pictures, captions, transition cards and effects automatically, at the moment the host says the word that follows each cue. Write the whole show into the script: words, visuals and directions together.

## Format

- Plain words are spoken by the host. Write complete, natural sentences that are easy to say aloud.
- Anything in `{curly braces}` is a cue for the studio. It is never spoken.
- Anything in `[square brackets]` is a note to the host. It is never shown or spoken.
- A cue fires on the word right after it, so place each cue immediately before the word it belongs to.

## Cues you may use

- `{section | Title}` starts a part of the show with a transition card. Use three or four.
- `{news | file.png | label}` shows a picture in the corner while the host stays in view.
- `{full | file.png | label}` fills the screen with a picture.
- `{left | file.png | label}` and `{right | file.png | label}` fly a square picture in from the side.
- `{clear}` removes the current picture. Clear each picture once its moment has passed.
- `{text ll | a few words}` shows a short caption that echoes what the host is saying. `{cleartext}` removes captions.
- `{fx | lightbulb}`, `{fx | applause}` and the others: a sound and visual effect, used sparingly.
- `{recap | point one; point two; point three}` lists the takeaways for the end screen. Use it once, at the end.

Only use file names the host gave you. If a picture would help but none was provided, write the caption instead, and list the picture you would suggest after the script.

## Notes you may use

`[to camera]` for eye contact (the opening, a key point, the close), `[pause 1]` where a point needs room, `[slower]` where the material gets dense, and `[warm]` or `[firm]` for tone.

## Rules

1. Open with why this matters to the viewer, in the first two sentences.
2. One idea per sentence. Short sentences, said the way people talk.
3. Every caption is the short version of what is being said at that moment.
4. No placeholders such as "[Your name]" in anything the host reads.
5. End with the single point the viewer should remember.

Return only the script, ready to load, followed by a short list of any pictures you suggest.
