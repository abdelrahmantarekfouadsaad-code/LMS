"""Test the exact encryption used in serializers.py and output ciphertext for Node.js verification."""
import os, hashlib, base64, sys
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

def _evp_bytes_to_key(password: bytes, salt: bytes, key_len=32, iv_len=16):
    dtot = b''
    d = b''
    while len(dtot) < key_len + iv_len:
        d = hashlib.md5(d + password + salt).digest()
        dtot += d
    return dtot[:key_len], dtot[key_len:key_len + iv_len]

def encrypt_url(plain_text: str, passphrase: str) -> str:
    salt = os.urandom(8)
    password = passphrase.encode('utf-8')
    key, iv = _evp_bytes_to_key(password, salt)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded = pad(plain_text.encode('utf-8'), AES.block_size)
    encrypted = cipher.encrypt(padded)
    return base64.b64encode(b'Salted__' + salt + encrypted).decode('utf-8')

TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
SECRET = "ghost-player-secret-2024"

encrypted = encrypt_url(TEST_URL, SECRET)
print(f"ENCRYPTED={encrypted}")
