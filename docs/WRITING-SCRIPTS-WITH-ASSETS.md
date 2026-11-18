# Writing scripts that bring their own visuals

Most video podcasts are recorded first and dressed afterwards. Someone scrubs through the footage, finds the moment the host mentions the chart, drops the chart in, and does that again for every caption and transition. The pictures are an afterthought, so they rarely land on the word that needs them.

There is another way: write the visuals into the script. Then they appear the moment you say the word, every time, and the episode is finished when you stop talking.

## Every script has three jobs

**Say it.** The plain words are what you speak.

**Show it.** A cue in curly braces is what the audience sees: `{news | chart.png | Monthly cost}`.

**Direct it.** A note in square brackets is for you alone: `[to camera]`, `[pause 1]`, `[slower]`.

Write all three at once, and you stop thinking of the visuals as decoration. They become part of the sentence.

## The one rule: cue before the word

A cue fires when the teleprompter reaches the word right after it. So put the cue immediately in front of the word it belongs to:

```
Our costs fell by half. {news | chart.png | Monthly cost} Here is the month it happened.
```

The chart appears on "Here," just as you point to it. If you put the cue at the start of the sentence before, it would arrive early and steal attention from what you are still saying.

The teleprompter keeps the current word right under the camera, so your eyes stay on the lens. Because the cue is tied to that same word, the picture and your voice stay in time without you thinking about it.

## Choose where the picture goes

**`news`** puts it in the corner and keeps you in view. Use it when the picture supports what you are saying.

**`full`** fills the screen and hides you. Use it when the picture *is* the point, such as a diagram the audience has to read.

**`left`** and **`right`** fly it in from the side. They make good reveals for a definition, an anatomy, or a list. The side panel is nearly square, so make those images square.

End each one with `{clear}` when you move on. A graphic left on screen after its moment pulls attention from the next point.

## Make captions echo the words

A caption works best as the short version of what you are saying, timed to the phrase it echoes:

```
A cue names {text ll | Where it goes} where it goes, {cleartext} {text ll | Which asset} which asset to show,
{cleartext} {text ll | A short label} and a short label.
```

Each caption appears on its phrase and clears before the next one. Viewers who watch with the sound off, and many do, still get the point.

Keep captions to a few words. If a caption needs a full sentence, it is probably a graphic.

## Shape it with sections

`{section | Title}` plays a transition card and holds the teleprompter while it shows. Three or four sections are enough for most episodes. The cards give viewers a map ("PART 2 OF 3"), and they give you natural places to pause, breathe and re-record if a section goes wrong.

## Direct yourself

Notes in square brackets never show and are never spoken, so use them freely:

- `[to camera]` where you need eye contact: the opening, a key point, the close.
- `[pause 1]` where a point needs room to land.
- `[slower]` where the material gets dense.
- `[warm]` or `[firm]` to set the tone of a section.

## Prepare the assets first

Put every picture in the episode folder (an `assets` subfolder is fine), and name each file exactly as the script names it. The studio matches by file name. A missing file shows as a labeled placeholder, and the script view lists missing files in red, so you can see what is missing before you record.

Make pictures in the shape they will be shown: wide (16 by 9) for `news` and `full`, square for `left` and `right`. The studio's Asset Studio can make title cards, bullet lists, big numbers and quotes for you.

## Before you record

Check three things:

1. Every file name in the script matches an asset.
2. Every cue sits right before its word.
3. Every section has a title.

Then press record and talk. When you stop, the episode is done.

## See it

The demo episode in `projects/demo-episode` follows every rule on this page. [Watch it here](https://butterflyfx.us/work/podcaster.html): a 75-second episode the studio made from that script, with no person on camera and no editing.
