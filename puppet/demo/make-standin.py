# Makes recorded/friend.mp3, a stand-in for a real person's recording, so the recorded-voice path can be shown
# before anyone has recorded. The panel treats it exactly like a microphone recording: only the sound is used.
import asyncio, os
import voice_tls  # noqa: F401
import edge_tts

os.makedirs('recorded', exist_ok=True)
asyncio.run(edge_tts.Communicate('Characters that talk with real voices. You record a line, and they move with it.',
                                 'en-GB-RyanNeural').save('recorded/friend.mp3'))
print('wrote recorded/friend.mp3')
