"""
PAN Verification Utility (Setu Sandbox)
========================================
Isolated function for verifying PAN via Setu API sandbox.
Includes PAN format validation and falls back to simulation if API fails.

This is SANDBOX-ONLY code for hackathon demo purposes.
Never use production endpoints or claim government verification.
"""

import os
import re
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

# Setu API Configuration (read from environment)
SETU_BASE_URL = os.getenv("SETU_BASE_URL", "https://dg-sandbox.setu.co")
SETU_CLIENT_ID = os.getenv("SETU_CLIENT_ID", "")
SETU_CLIENT_SECRET = os.getenv("SETU_CLIENT_SECRET", "")
SETU_PRODUCT_INSTANCE_ID = os.getenv("SETU_PRODUCT_INSTANCE_ID", "")

# Official PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
PAN_REGEX = r'^[A-Z]{5}[0-9]{4}[A-Z]$'


def is_valid_pan_format(pan: str) -> bool:
    """
    Validate PAN format against official structure.
    
    Official PAN format: AAAAA9999A
    - First 5 characters: Uppercase letters (A-Z)
    - Next 4 characters: Digits (0-9)
    - Last character: Uppercase letter (A-Z)
    
    Args:
        pan: PAN number to validate
    
    Returns:
        True if format is valid, False otherwise
    
    Note:
        This only validates FORMAT, not actual validity with government records.
    """
    if not pan:
        return False
    return bool(re.match(PAN_REGEX, pan.upper()))


def verify_pan_sandbox(pan_number: str, full_name: str = "") -> Dict[str, Any]:
    """
    Verify PAN number via Setu sandbox API with graceful fallback.
    
    Flow:
    1. Validate PAN format (if invalid, return invalid_format status)
    2. If format valid, attempt Setu sandbox API (if credentials exist)
    3. If API fails or no credentials, return simulated result
    
    Args:
        pan_number: 10-character PAN number (e.g., ABCDE1234F)
        full_name: Name for optional matching (not used in basic verification)
    
    Returns:
        Dict with verification result:
        - pan_verified: True | False | "SIMULATED"
        - verification_source: Source description for UI display
        - verification_status: "verified" | "invalid_format" | "simulated"
        - pan_format_valid: Boolean indicating if format passed validation
    
    Note:
        - NEVER blocks loan flow on any failure
        - NEVER exposes raw error messages to users
        - Logs errors server-side only
    """
    print(f"[PAN VERIFY] Starting verification for PAN: {pan_number[:5]}XXXXX" if pan_number and len(pan_number) >= 5 else "[PAN VERIFY] No/short PAN provided")
    
    # ================================================================
    # Step 1: Validate PAN Format (before any API call)
    # ================================================================
    if not is_valid_pan_format(pan_number):
        print(f"[PAN VERIFY] Invalid PAN format: '{pan_number}' does not match {PAN_REGEX}")
        return {
            "pan_verified": False,
            "verification_source": "PAN Format Validation",
            "name_on_pan": "",
            "verification_status": "invalid_format",
            "pan_format_valid": False
        }
    
    print(f"[PAN VERIFY] PAN format valid: {pan_number[:5]}XXXXX")
    
    # ================================================================
    # Step 2: Check if Setu credentials are configured
    # ================================================================
    if not all([SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_PRODUCT_INSTANCE_ID]):
        print("[PAN VERIFY] Setu credentials not configured - using simulation fallback")
        return _simulation_fallback("Sandbox-ready (credentials not configured)")
    
    # ================================================================
    # Step 3: Attempt Setu Sandbox API call
    # ================================================================
    try:
        import httpx
        
        url = f"{SETU_BASE_URL}/api/verify/pan"
        headers = {
            "x-client-id": SETU_CLIENT_ID,
            "x-client-secret": SETU_CLIENT_SECRET,
            "x-product-instance-id": SETU_PRODUCT_INSTANCE_ID,
            "Content-Type": "application/json"
        }
        payload = {
            "pan": pan_number.upper(),
            "consent": "Y",
            "reason": "Loan application identity verification"
        }
        
        print(f"[PAN VERIFY] Calling Setu sandbox API...")
        
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload, headers=headers)
        
        print(f"[PAN VERIFY] API Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            name_on_pan = data.get("data", {}).get("name", "")
            print(f"[PAN VERIFY] SUCCESS - Name on PAN: {name_on_pan[:10]}..." if name_on_pan else "[PAN VERIFY] SUCCESS - No name returned")
            
            return {
                "pan_verified": True,
                "verification_source": "Setu PAN Verification API (Sandbox)",
                "name_on_pan": name_on_pan,
                "verification_status": "verified",
                "pan_format_valid": True
            }
        else:
            logger.warning(f"PAN API returned status {response.status_code}")
            return _simulation_fallback(f"API returned status {response.status_code}")
            
    except ImportError:
        print("[PAN VERIFY] httpx not installed - using simulation fallback")
        return _simulation_fallback("HTTP client not available")
        
    except Exception as e:
        logger.error(f"PAN verification API error: {e}")
        print(f"[PAN VERIFY] API Error (logged): {type(e).__name__}")
        return _simulation_fallback("API request failed")


def _simulation_fallback(reason: str) -> Dict[str, Any]:
    """
    Return simulation fallback result for valid-format PANs.
    
    Used when:
    - Credentials not configured
    - API call fails
    
    Args:
        reason: Internal reason for fallback (not shown to user)
    
    Returns:
        Simulated verification result with format marked as valid
    """
    print(f"[PAN VERIFY] Fallback to simulation: {reason}")
    return {
        "pan_verified": "SIMULATED",
        "verification_source": "PAN Verification (Sandbox – Fallback)",
        "name_on_pan": "",
        "verification_status": "simulated",
        "pan_format_valid": True,  # Format was valid, only API failed
        "_fallback_reason": reason
    }

