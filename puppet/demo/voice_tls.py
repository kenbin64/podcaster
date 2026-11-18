# Lets edge-tts trust the Windows certificate store (antivirus that inspects secure traffic re-signs it,
# and Python's own certificate list does not know that signer). Import this before using edge_tts.
import ssl, truststore, edge_tts.communicate, edge_tts.voices
_ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
edge_tts.communicate._SSL_CTX = _ctx
edge_tts.voices._SSL_CTX = _ctx
