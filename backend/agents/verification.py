"""
Verification Agent
==================
Structured KYC verification for hackathon demo.
Handles multi-step KYC form with personal, identity, employment, and document data.

Integrates with Setu PAN Verification API (sandbox) with graceful fallback.
This is a DEMO implementation - sandbox verification only.
"""

from typing import Dict, Any
from utils.crypto_utils import encrypt_data
from utils.pan_verification import verify_pan_sandbox
import json


def verification_agent_node(state: Dict, user_message: Any) -> Dict[str, Any]:
    """
    Verification Agent - Handles KYC and identity verification.

    Accepts structured KYC data from the frontend form:
    - Personal Details (name, DOB, mobile, email)
    - Identity Details (PAN, Aadhaar last 4, address)
    - Employment Details (type, income, employer)
    - Document uploads (filenames only)

    Integrates with Setu PAN Verification API (sandbox):
    - Calls verify_pan_sandbox() for PAN verification
    - Falls back to simulation if API fails
    - Never blocks loan flow on verification failure

    Args:
        state: Current conversation state
        user_message: User's input message or structured KYC dict

    Returns:
        Dict with reply and verification status
    """
    print(f"[VERIFICATION AGENT] Processing KYC submission...")

    # Check if this is a structured KYC submission (dict with 'name' and/or 'kyc_data')
    if isinstance(user_message, dict):
        # Structured KYC form submission
        name = user_message.get("name", "")
        kyc_data = user_message.get("kyc_data", {})
        
        print(f"[VERIFICATION AGENT] Structured KYC submission for: {name}")
        
        # Extract and store relevant data in state
        if kyc_data:
            personal = kyc_data.get("personal", {})
            employment = kyc_data.get("employment", {})
            identity = kyc_data.get("identity", {})
            documents = kyc_data.get("documents", {})
            
            # ================================================================
            # PAN Verification via Setu Sandbox API
            # Validates format first, then falls back to simulation if API fails
            # Never blocks loan flow regardless of result
            # ================================================================
            pan_number = identity.get("panNumber", "")
            full_name = personal.get("fullName", "")
            pan_result = verify_pan_sandbox(pan_number, full_name)
            
            # Store PAN verification result in state
            state["pan_verification_status"] = pan_result.get("pan_verified")
            state["pan_verification_source"] = pan_result.get("verification_source")
            state["pan_name_on_record"] = pan_result.get("name_on_pan", "")
            state["pan_format_valid"] = pan_result.get("pan_format_valid", True)
            
            print(f"[VERIFICATION AGENT] PAN verification: {pan_result.get('verification_status')}, format_valid: {pan_result.get('pan_format_valid')}")
            
            # Store customer name for sanction letter
            state["customer_name"] = personal.get("fullName") or name or "Valued Customer"
            
            # Store salary for underwriting calculations
            monthly_income = employment.get("monthlyIncome", "")
            if monthly_income:
                try:
                    state["salary"] = float(monthly_income)
                    print(f"[VERIFICATION AGENT] Stored salary: {state['salary']}")
                except ValueError:
                    state["salary"] = 50000  # Default
            
            # Store employment type
            state["employment_type"] = employment.get("employmentType", "Salaried")
            
            # Store KYC summary for audit (includes PAN verification result)
            state["kyc_summary"] = {
                "personal_submitted": bool(personal.get("fullName")),
                "identity_submitted": bool(identity.get("panNumber") or identity.get("aadhaarLast4")),
                "employment_submitted": bool(employment.get("monthlyIncome")),
                "documents_uploaded": bool(documents.get("panCard") or documents.get("idProof") or documents.get("incomeProof")),
                "pan_provided": bool(identity.get("panNumber")),
                "city": identity.get("city", ""),
                "state": identity.get("state", ""),
                # PAN Verification via Setu Sandbox API
                "pan_verification_status": pan_result.get("pan_verified"),
                "pan_verification_source": pan_result.get("verification_source"),
                "pan_name_on_record": pan_result.get("name_on_pan", ""),
                "pan_format_valid": pan_result.get("pan_format_valid", True),
                "verification_mode": "SANDBOX_READY" if pan_result.get("pan_verified") == True else ("INVALID_FORMAT" if pan_result.get("verification_status") == "invalid_format" else "SIMULATED")
            }
            
            # Encrypt sensitive data for demo
            try:
                sensitive_data = json.dumps({
                    "name": state["customer_name"],
                    "pan": identity.get("panNumber", "")[:5] + "XXXXX" if identity.get("panNumber") else "",
                    "aadhaar_last4": identity.get("aadhaarLast4", ""),
                    "mobile": personal.get("mobileNumber", ""),
                    "verified_at": kyc_data.get("submittedAt", "")
                })
                encrypted = encrypt_data(sensitive_data.encode("utf-8"))
                state["verification_encrypted"] = encrypted.decode("utf-8")
            except Exception as e:
                print(f"[VERIFICATION AGENT] Encryption failed: {e}")
        
        # Mark verification as complete
        state["verified"] = True
        state["verification_status"] = "verified"
        
        # Build verification summary
        summary_items = []
        if state.get("kyc_summary", {}).get("personal_submitted"):
            summary_items.append("✓ Personal details verified")
        if state.get("kyc_summary", {}).get("identity_submitted"):
            summary_items.append("✓ Identity documents submitted")
        if state.get("kyc_summary", {}).get("employment_submitted"):
            summary_items.append("✓ Employment information recorded")
        if state.get("kyc_summary", {}).get("documents_uploaded"):
            summary_items.append("✓ Supporting documents uploaded")
        
        summary_text = "\n".join(summary_items) if summary_items else "✓ KYC information received"
        
        reply = f"""✅ KYC Verification Complete

{summary_text}

ℹ️ Verification simulated for demo purposes.
In production, identity would be verified using DigiLocker APIs.

Now proceeding to evaluate your loan eligibility..."""

        print("[VERIFICATION AGENT] VERIFIED via structured KYC - Moving to underwriting")

        return {
            "reply": reply,
            "verification_status": "verified",
            "verified": True,
            "kyc_summary": state.get("kyc_summary", {})
        }

    # Legacy text-based verification (fallback)
    message_lower = str(user_message).lower()
    has_name = "name:" in message_lower
    has_gov_id = "government id:" in message_lower

    print(f"[VERIFICATION AGENT] Legacy mode: has_name={has_name}, has_gov_id={has_gov_id}")

    if has_name and has_gov_id:
        state["verified"] = True
        state["verification_status"] = "verified"

        reply = (
            "✓ Identity verification successful!\n\n"
            "Your details have been recorded. Now proceeding to evaluate your loan eligibility..."
        )

        print("[VERIFICATION AGENT] VERIFIED via legacy - Moving to underwriting")

        return {
            "reply": reply,
            "verification_status": "verified",
            "verified": True
        }

    # Missing required format - prompt for KYC form
    state["verified"] = False
    state["verification_status"] = "pending"

    return {
        "reply": (
            "To continue, I need to verify your identity.\n\n"
            "Please complete the KYC verification form with your:\n"
            "• Personal details (name, contact)\n"
            "• Identity documents (PAN, Aadhaar)\n"
            "• Employment information\n\n"
            "This information is required to process your loan application."
        ),
        "verification_status": "pending",
        "verified": False
    }
