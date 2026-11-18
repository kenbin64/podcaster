# Speaks line.txt with the Australian neural voice and saves line.mp3 plus line.json: every spoken word with
# its start and end time, and the [notes] with the word they come before, for the puppet director.
import asyncio, json, re
import voice_tls  # noqa: F401
import edge_tts

text = open('line.txt', encoding='utf-8').read()
tokens = re.findall(r'\[[^\]]*\]|\S+', text)
spoken, notes = [], []
for t in tokens:
    if t.startswith('['): notes.append({'at': len(spoken), 'note': t[1:-1]})
    else: spoken.append(t)

async def main():
    c = edge_tts.Communicate(' '.join(spoken), 'en-AU-WilliamMultilingualNeural', boundary='WordBoundary')
    audio, marks = bytearray(), []
    async for ch in c.stream():
        if ch['type'] == 'audio': audio += ch['data']
        elif ch['type'] == 'WordBoundary': marks.append((ch['text'], ch['offset'] / 1e4, (ch['offset'] + ch['duration']) / 1e4))
    open('line.mp3', 'wb').write(audio)
    norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())
    marks = [m for m in marks if norm(m[0])]
    if len(marks) != len(spoken): raise SystemExit(f'{len(marks)} timed words but {len(spoken)} in the script')
    words = [{'text': w, 'start': round(m[1]), 'end': round(m[2])} for w, m in zip(spoken, marks)]
    json.dump({'words': words, 'notes': notes, 'durationMs': round(marks[-1][2]) + 600}, open('line.json', 'w'), indent=1)
    print(len(words), 'words,', round(marks[-1][2] / 1000, 1), 's,', len(notes), 'notes')
asyncio.run(main())
