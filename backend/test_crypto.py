import os
import hashlib
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

GHOST_SECRET_KEY = 'ghost-player-secret-2024'

def encrypt_url(raw_url):
    if not raw_url:
        return raw_url
    key = hashlib.sha256(GHOST_SECRET_KEY.encode('utf-8')).digest()
    iv = os.urandom(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct_bytes = cipher.encrypt(pad(raw_url.encode('utf-8'), AES.block_size))
    return base64.b64encode(iv + ct_bytes).decode('utf-8')

def decrypt_url(encrypted_url):
    if not encrypted_url or encrypted_url.startswith('http'):
        return encrypted_url
    key = hashlib.sha256(GHOST_SECRET_KEY.encode('utf-8')).digest()
    payload = base64.b64decode(encrypted_url)
    iv = payload[:16]
    ct = payload[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt.decode('utf-8')

if __name__ == '__main__':
    test_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    enc = encrypt_url(test_url)
    dec = decrypt_url(enc)
    assert dec == test_url, f"Mismatch: {dec}"
    print("Encryption round-trip successful.")
