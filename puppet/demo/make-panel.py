# Reads panel.txt and voices it: every "Name: words" line is spoken in that person's voice and saved as
# panel-NN.mp3 with each word's timing; every "Name: <file>" line points at a recording as it is.
# Writes panel.json for panel.html, which lays the lines out one after another and gives each its character.
import asyncio, json, re
import voice_tls  # noqa: F401
import edge_tts

cast, lines = [], []
for raw in open('panel.txt', encoding='utf-8'):
    line = raw.strip()
    if not line or line.startswith('#'): continue
    if line.startswith('{cast'):
        name, look, voice = [p.strip() for p in line.strip('{}').split('|')[1:4]]
        cast.append({'name': name, 'look': look, 'voice': voice})
        continue
    who, text = line.split(':', 1)
    lines.append({'who': who.strip(), 'text': text.strip()})

def split_notes(text):
    spoken, notes = [], []
    for t in re.findall(r'\[[^\]]*\]|\S+', text):
        if t.startswith('['): notes.append({'at': len(spoken), 'note': t[1:-1]})
        else: spoken.append(t)
    return spoken, notes

async def speak(words, voice, out):
    c = edge_tts.Communicate(' '.join(words), voice, boundary='WordBoundary')
    audio, marks = bytearray(), []
    async for ch in c.stream():
        if ch['type'] == 'audio': audio += ch['data']
        elif ch['type'] == 'WordBoundary': marks.append((ch['text'], ch['offset'] / 1e4, (ch['offset'] + ch['duration']) / 1e4))
    open(out, 'wb').write(audio)
    marks = [m for m in marks if re.sub(r'[^a-z0-9]', '', m[0].lower())]
    if len(marks) != len(words): raise SystemExit(f'{out}: {len(marks)} timed words but {len(words)} in the script')
    return [{'text': w, 'start': round(m[1]), 'end': round(m[2])} for w, m in zip(words, marks)]

async def main():
    voices = {c['name']: c['voice'] for c in cast}
    out = []
    for i, l in enumerate(lines):
        if l['who'] not in voices: raise SystemExit(f'"{l["who"]}" speaks but is not in the cast')
        recorded = re.match(r'<([^>]+)>\s*(.*)', l['text'])
        if recorded:
            _, notes = split_notes(recorded.group(2))
            out.append({'who': l['who'], 'audio': recorded.group(1), 'words': None, 'notes': notes})
        else:
            spoken, notes = split_notes(l['text'])
            name = f'panel-{i + 1:02d}.mp3'
            words = await speak(spoken, voices[l['who']], name)
            out.append({'who': l['who'], 'audio': name, 'words': words, 'notes': notes})
        print(l['who'], '->', out[-1]['audio'])
    json.dump({'cast': cast, 'lines': out}, open('panel.json', 'w'), indent=1)
asyncio.run(main())
