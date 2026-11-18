# Builds the walkthrough's narration and its timeline from walkthrough.json:
#   - each spoken line becomes an MP3 in audio/, spoken by a Microsoft neural voice (edge-tts), with the moment
#     every word begins;
#   - the timeline (timeline.json) says when each clip plays, when each on-screen action happens, and, for the
#     episode part, when each word becomes the teleprompter's current word and when its cues fire.
#   python narrate.py
import asyncio, json, os, re
import voice_tls  # noqa: F401  (lets edge-tts trust the Windows certificate store)
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
plan = json.load(open(os.path.join(HERE, 'walkthrough.json'), encoding='utf-8'))
os.makedirs(os.path.join(HERE, 'audio'), exist_ok=True)
SECTION_SILENCE = 3900   # the studio shows a section card for 3.6 s


async def speak(text, name):
    """Speaks text to audio/<name>.mp3 and returns [(word, start ms)] and the clip length in ms."""
    c = edge_tts.Communicate(text, plan['voice'], rate=plan.get('rate', '+0%'), boundary='WordBoundary')
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            words.append((ch['text'], ch['offset'] / 1e4, (ch['offset'] + ch['duration']) / 1e4))
    open(os.path.join(HERE, 'audio', name + '.mp3'), 'wb').write(audio)
    return words


def norm(w):
    return re.sub(r'[^a-z0-9]', '', w.lower())


async def main():
    t, clips, actions, episode = 0.0, [], [], []
    for i, seg in enumerate(plan['segments']):
        if 'gap' in seg:
            t += seg['gap']
        elif 'say' in seg:
            name = f'line-{i:02d}'
            words = await speak(seg['say'], name)
            clips.append({'file': f'audio/{name}.mp3', 'start': round(t)})
            if seg.get('do'): actions.append({'t': round(t), 'do': seg['do']})
            if seg.get('then'): actions.append({'t': round(t + words[seg['thenAtWord']][1]), 'do': seg['then']})
            t += words[-1][2] + 150
        elif 'episode' in seg:
            text = open(os.path.join(HERE, '..', seg['episode']), encoding='utf-8').read()
            tokens = re.findall(r'\{[^}]*\}|\[[^\]]*\]|\S+', text)          # the studio's own tokenizer
            spoken = [w for w in tokens if not w.startswith(('{', '['))]
            opens_with_section = tokens[0].lower().startswith('{section')
            fire0 = t
            if opens_with_section: t += SECTION_SILENCE
            words = await speak(' '.join(spoken), 'episode')
            clips.append({'file': 'audio/episode.mp3', 'start': round(t)})
            # Match the voice's words to the script's words in order (punctuation can differ).
            j = 0
            for k, w in enumerate(spoken):
                while j < len(words) and norm(words[j][0]) == '' : j += 1
                start = words[j][1] if j < len(words) else words[-1][2]
                if j < len(words) and norm(words[j][0]) != norm(w):
                    raise SystemExit(f'word {k} mismatch: script "{w}" voice "{words[j][0]}"')
                episode.append({'k': k, 'fire': round(fire0 if (k == 0 and opens_with_section) else t + start), 'word': round(t + start)})
                j += 1
            actions.append({'t': round(fire0), 'do': 'episode'})
            t += words[-1][2] + 150
    timeline = {'totalMs': round(t), 'clips': clips, 'actions': actions, 'episode': episode}
    json.dump(timeline, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
    print(f'total {t/1000:.1f} s, {len(clips)} clips, {len(actions)} actions, {len(episode)} episode words')
    for a in actions: print(f'  {a["t"]/1000:6.1f} s  {a["do"]}')

asyncio.run(main())
