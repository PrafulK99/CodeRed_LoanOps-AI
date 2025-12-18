from cryptography.fernet import Fernet
import os


def get_or_create_key(key_path: str = None) -> bytes:
    """Return an existing key or create one and persist it to disk (demo-only)."""
    if key_path is None:
        key_path = os.path.join(os.path.dirname(__file__), ".fernet_key")

    # Create key file if missing
    if not os.path.exists(key_path):
        key = Fernet.generate_key()
        try:
            with open(key_path, "wb") as f:
                f.write(key)
        except Exception:
            # Best-effort: if writing fails, just return the generated key
            return key
    else:
        with open(key_path, "rb") as f:
            key = f.read()

    return key


def encrypt_data(plaintext: bytes | str, key: bytes | None = None) -> bytes:
    """Encrypt bytes/string using Fernet and return token bytes."""
    if isinstance(plaintext, str):
        plaintext = plaintext.encode("utf-8")

    if key is None:
        key = get_or_create_key()

    f = Fernet(key)
    return f.encrypt(plaintext)


def decrypt_data(token: bytes | str, key: bytes | None = None) -> bytes:
    """Decrypt token (bytes/str) and return plaintext bytes."""
    if isinstance(token, str):
        token = token.encode("utf-8")

    if key is None:
        key = get_or_create_key()

    f = Fernet(key)
    return f.decrypt(token)
