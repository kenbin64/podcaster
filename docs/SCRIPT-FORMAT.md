# Script and cue reference

A script is plain text. Everything in it is one of three things:

| Looks like | It is | Shown on screen? | Spoken? |
|---|---|---|---|
| Plain words | What you say | On the teleprompter only | Yes |
| `{curly braces}` | A **cue**: something the studio shows or does | Its effect is | No |
| `[square brackets]` | A **note** to you | On the teleprompter only, as a gist line | No |

**The one rule:** a cue fires when the teleprompter reaches the word right after it. Put each cue immediately before the word it belongs to.

## Cues

Fields are separated by `|`. The first word picks the cue, and is not case-sensitive.

| Cue | What it does |
|---|---|
| `{news \| file \| label}` | A graphic in the upper right, about a third of the width. You stay in view. |
| `{full \| file \| label}` | A graphic filling the whole frame, covering you. `{img \| …}` does the same. |
| `{left \| file \| label}` / `{right \| file \| label}` | A graphic flies in from that side. The panel is nearly square, so square images fit it best. |
| `{clear}` | Removes the current graphic. |
| `{text POS \| words}` | A caption. Positions below; the default is `ll`. |
| `{blurp POS \| words}` | A thought-bubble caption. The default position is `clow`. |
| `{cleartext}` | Removes every caption and thought bubble. |
| `{emoji POS \| 💡}` | An emoji pops up for about 3.6 seconds. The default position is `ur`. |
| `{section \| Title}` | A transition card, "NEXT / PART k OF n", for 3.6 seconds. The teleprompter waits while it shows. |
| `{section \| Title \| subtitle}` | The same, with a subtitle. |
| `{section \| Title \| style}` | The same, with one of the styles `wipe`, `slide`, `pop` or `butterfly`. |
| `{fx \| name}` | A sound and visual effect. `{sfx …}` and `{effect …}` work too. Names below. |
| `{music \| mood}` / `{music \| off}` | Starts, changes or stops the adaptive score. Needs "Follow script" ticked in the Score panel. |
| `{theme \| name}` | Sets a recurring melody, derived from the name. |
| `{recap \| a; b; c}` | Points for the end screen's "Today:" list. The last recap in the script is the one used. |
| `{scene \| topic}` / `{take}` | Where the director splits the script into takes (see below). |

**Files** in `news`, `full`, `left` and `right` are matched by file name against the media you loaded. If a file is missing, a labeled placeholder holds its place, and the script view lists the missing files in red.

**Caption positions:** `ll` lower left, `lc` lower center, `lr` lower right, `ul` upper left, `ur` upper right, `clow` center, a little low.

**Effects:** `shake`, `closeup`, `spin`, `spiral`, `vertigo` (camera moves), and `glass`, `bubble`, `facepalm`, `emoji`, `womp`, `boing`, `laugh`, `applause`, `ovation`, `lightbulb`, `eyeroll`, `mindblown`, `think`, `wink`, `heehaw` (overlays). All sounds are synthesized; there are no sample files.

**Takes:** if the script has any `{section}`, each whole section is recorded as one take, and `{scene}` is ignored. Otherwise `{scene}` starts a new take, `{take}` forces a split, and a script with no markers is split at sentence ends once a piece reaches 18 words.

## Notes to yourself

Notes are matched by keyword, so ordinary words work.

| Write | It does |
|---|---|
| `[pause]`, `[pause 1.5]` | Holds the teleprompter for that many seconds (0.8 if no number). |
| `[faster]`, `[tempo up]`, `[build]` | Speeds the teleprompter up by a quarter. |
| `[slower]`, `[slow down]`, `[ease]` | Slows it to four fifths. |
| `[to camera]`, `[eyes up]`, `[lens]` | Flashes "● EYES TO CAMERA ●" by the lens for 2.4 seconds. |
| `[warm]`, `[firm]`, `[serious]`, `[excited]`, `[curious]`, `[smile]`, `[nod]` | Sets the delivery coach's expression. |
| `[intensity up]`, `[louder]`, `[softer]`, `[calm]` | Raises or lowers the coach's intensity. |

Every note's text also appears as a gist line under the teleprompter, for you only.

**Emphasis:** a word in capitals (three letters or more) is marked as emphasis. Writing `*word*` does the same, but the asterisks show on the teleprompter.

**Automatic director** (on by default): with no note on a word, punctuation sets the rhythm. `...` pauses 0.6 seconds, a full stop 0.35, and a comma, semicolon or colon 0.22. `!` lifts the delivery, and `?` makes it curious.

## A small example

```
{section | Why it matters | slide}
[to camera] Here is the number that changed my mind. {news | chart.png | Monthly cost} Our bill went DOWN.
{text ll | Same work, fewer tokens} [pause 1] And nothing else changed.
{clear} {cleartext}
```

The section card plays first. The chart appears on "Our", and the caption on "And". Then both clear.
