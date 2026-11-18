# Speaks one line with a neural voice and reports when each word starts and ends, for the animated characters.
#   input  (stdin, JSON): {"text": "...", "voice": "en-AU-WilliamMultilingualNeural", "out": "path/to/line.mp3"}
#   output (stdout, JSON): {"words": [{"text", "start", "end"}, ...]}   times in milliseconds
# Needs: pip install edge-tts truststore
# Note: these voices are Microsoft's online Read Aloud voices, so the line's TEXT is sent to Microsoft to be
# spoken. For fully offline voicing, use a Piper voice (*.onnx in tts/voices) instead.
import asyncio, json, re, ssl, sys
import edge_tts, edge_tts.communicate, edge_tts.voices

try:   # trust the Windows certificate store (antivirus that inspects secure traffic re-signs it)
    import truststore
    _ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    edge_tts.communicate._SSL_CTX = _ctx
    edge_tts.voices._SSL_CTX = _ctx
except ImportError:
    pass


async def speak(text, voice, out):
    words = text.split()
    c = edge_tts.Communicate(text, voice, boundary='WordBoundary')
    audio, marks = bytearray(), []
    async for ch in c.stream():
        if ch['type'] == 'audio': audio += ch['data']
        elif ch['type'] == 'WordBoundary': marks.append((ch['text'], ch['offset'] / 1e4, (ch['offset'] + ch['duration']) / 1e4))
    with open(out, 'wb') as f: f.write(audio)
    marks = [m for m in marks if re.sub(r'[^a-z0-9]', '', m[0].lower())]
    if len(marks) != len(words):   # timings that do not line up are worse than none: the mouth then follows the sound
        return None
    return [{'text': w, 'start': round(m[1]), 'end': round(m[2])} for w, m in zip(words, marks)]


job = json.load(sys.stdin)
print(json.dumps({'words': asyncio.run(speak(job['text'], job['voice'], job['out']))}))
