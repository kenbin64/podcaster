# Turns the cue script into narration input (items.json), and after tts.ps1 has spoken it, into timing.json:
# for each spoken word, when its cues fire and when it becomes the current teleprompter word.
#   python make-timing.py items      then   powershell -File tts.ps1   then   python make-timing.py timing
import json, re, sys, wave
if sys.argv[1] == 'items':
    text = open('../demo-episode.cuescript.txt', encoding='utf-8').read()
    items, k, pending = [], 0, 0
    for t in re.findall(r'\{[^}]*\}|\[[^\]]*\]|\S+', text):       # the studio's own tokenizer
        if t.startswith('{'):
            if t[1:].strip().lower().startswith('section'): pending = max(pending, 3900)   # silence for the 3.6 s section card
        elif t.startswith('['):
            m = re.match(r'\[\s*pause\s*([\d.]+)?', t, re.I)
            if m: pending = max(pending, int(float(m.group(1) or 0.8) * 1000))
        else:
            if pending: items.append({'break': pending}); pending = 0
            items.append({'word': t, 'k': k}); k += 1
    json.dump(items, open('items.json', 'w'), indent=0)
    print('words', k)
else:
    items = json.load(open('items.json'))
    raw = {int(a): int(b) for a, b in (l.split(':') for l in open('marks.txt').read().split())}
    w = wave.open('narration.wav'); dur = w.getnframes() / w.getframerate()
    events, brk = [], 0
    for it in items:
        if 'break' in it: brk = it['break']; continue
        k = it['k']; start = raw[k] + brk     # a word right after a pause reports the pause's start; its own start is after it
        events.append({'k': k, 'fire': raw[k] if brk else start, 'word': start}); brk = 0
    json.dump({'durationMs': int(dur * 1000), 'events': events}, open('timing.json', 'w'))
    print('narration', round(dur, 1), 's; words', len(events))
