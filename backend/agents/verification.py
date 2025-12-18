"""
Verification Agent
==================
Mock KYC verification for hackathon demo.
Simplified verification for reliable demo flow.

This is a DEMO implementation - no real KYC validation.
"""

from typing import Dict, Any


def verification_agent_node(state: Dict, user_message: Any) -> Dict[str, Any]:
    """
    Verification Agent - Handles KYC and identity verification.

    SIMPLIFIED LOGIC for hackathon demo:
    - Verification succeeds if user message contains BOTH:
      1. "name:" (case-insensitive)
      2. "government id:" (case-insensitive)
    - No extraction, no parsing, no validation
    - This ensures deterministic demo behavior

    Args:
        state: Current conversation state
        user_message: User's input message

    Returns:
        Dict with reply and verification status
    """
    # Log short preview
    try:
        preview = str(user_message)[:50]
    except Exception:
        preview = "<unreadable>"

    print(f"[VERIFICATION AGENT] Processing: {preview}...")

    # Convert to string and lowercase for simple substring check
    message_lower = str(user_message).lower()

    # SIMPLIFIED VERIFICATION CHECK:
    # Success if message contains BOTH "name:" AND "government id:"
    has_name = "name:" in message_lower
    has_gov_id = "government id:" in message_lower

    print(f"[VERIFICATION AGENT] has_name={has_name}, has_gov_id={has_gov_id}")

    if has_name and has_gov_id:
        # Mark verification as complete in STATE
        state["verified"] = True
        state["verification_status"] = "verified"

        reply = (
            "✓ Identity verification successful!\n\n"
            "Your details have been recorded. Now proceeding to evaluate your loan eligibility..."
        )

        print("[VERIFICATION AGENT] VERIFIED - Moving to underwriting")

        return {
            "reply": reply,
            "verification_status": "verified",
            "verified": True
        }

    # Missing required format - provide clear, guided instructions
    state["verified"] = False
    state["verification_status"] = "pending"

    return {
        "reply": (
            "To continue, I need to verify your identity.\n\n"
            "Please reply in the following format:\n"
            "Name: <Your full name>\n"
            "Government ID: <Your ID number>\n\n"
            "For example:\n"
            "Name: Rahul Sharma\n"
            "Government ID: ABCDE1234F"
        ),
        "verification_status": "pending",
        "verified": False
    }
