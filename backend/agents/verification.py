"""
Verification Agent
==================
Mock KYC verification for hackathon demo.
Auto-approves any user response to proceed with the flow.

This is a DEMO implementation - no real KYC validation.
"""

from typing import Dict, Any
import json
from utils.crypto_utils import encrypt_data


def verification_agent_node(state: Dict, user_message: Any) -> Dict[str, Any]:
    """
    Verification Agent - Handles KYC and identity verification.

    New behavior:
    - Accepts either a free-text `user_message` or a `dict` of details.
    - Encrypts sensitive verification details and stores an encrypted blob in `state`.
    - Performs minimal field validation and marks session as verified for demo purposes.

    Args:
        state: Current conversation state
        user_message: User's input message or details dict

    Returns:
        Dict with reply and verification status
    """
    # Log short preview
    try:
        preview = str(user_message)[:50]
    except Exception:
        preview = "<unreadable>"

    print(f"[VERIFICATION AGENT] Processing: {preview}...")

    # If details were sent as a dict (preferred), use them
    details = None
    if isinstance(user_message, dict):
        details = user_message
    else:
        # Fallback: try to parse JSON string
        try:
            details = json.loads(user_message)
        except Exception:
            details = {"raw_response": str(user_message)}

    # Minimal validation: require at least name and id_number (demo)
    name = details.get("name") or details.get("full_name")
    id_number = details.get("id_number") or details.get("id")

    if name and id_number:
        # Encrypt the full details payload (demo: persistent key in repo)
        try:
            payload_bytes = json.dumps(details).encode("utf-8")
            token = encrypt_data(payload_bytes)
            state["verification_encrypted"] = token.decode("utf-8")
        except Exception as e:
            print(f"[VERIFICATION AGENT] Encryption failed: {e}")

        # Mark verification as complete in STATE
        state["verified"] = True
        state["verification_status"] = "verified"
        state["customer_name"] = name

        reply = (
            "Verification completed successfully! Your identity has been verified. "
            "Now proceeding to evaluate your loan eligibility..."
        )

        print("[VERIFICATION AGENT] VERIFIED - Moving to underwriting")

        return {
            "reply": reply,
            "verification_status": "verified",
            "verified": True,
            "encrypted_blob": state.get("verification_encrypted")
        }

    # Missing required fields
    return {
        "reply": "Verification failed: please provide your full name and government ID number.",
        "verification_status": "pending",
        "verified": False
    }
