"""
Gemini Explainer Utility
========================
Uses Google's Gemini API to generate human-friendly explanations for loan decisions.

This is a READ-ONLY enhancement:
- Gemini does NOT make decisions
- Gemini does NOT control routing
- If Gemini fails, the system uses default fallback messages

Usage:
    from utils.gemini_explainer import generate_explanation
    
    explanation = generate_explanation({
        "status": "APPROVED",
        "reason": "EMI within acceptable limits",
        "loan_amount": 100000,
        "salary": 40000
    })
"""

import os
from pathlib import Path
import google.generativeai as genai
from typing import Optional

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Look for .env in project root (parent of backend folder)
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"[GEMINI] Loaded .env from {env_path}")
    else:
        # Try backend folder
        env_path_backend = Path(__file__).resolve().parent.parent / ".env"
        if env_path_backend.exists():
            load_dotenv(env_path_backend)
            print(f"[GEMINI] Loaded .env from {env_path_backend}")
except ImportError:
    print("[GEMINI] python-dotenv not installed, using system environment only")

# Configure Gemini API (reads from environment variable)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Flag to enable/disable Gemini (for demo safety)
GEMINI_ENABLED = bool(GEMINI_API_KEY)

if GEMINI_ENABLED:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        print("[GEMINI] API configured successfully")
    except Exception as e:
        print(f"[GEMINI] Configuration failed: {e}")
        GEMINI_ENABLED = False
        model = None
else:
    print("[GEMINI] No API key found. Using fallback responses.")
    model = None


# =============================================================================
# Default Fallback Messages (Used when Gemini is unavailable)
# =============================================================================

DEFAULT_MESSAGES = {
    "APPROVED": """
🎉 Congratulations! Your loan has been APPROVED!

Based on our assessment:
- Your income meets our eligibility criteria
- The requested EMI is within acceptable limits
- Your verification was successful

Your sanction letter is being generated. Thank you for choosing LoanOps!
""".strip(),

    "REJECTED": """
We regret to inform you that your loan application could not be approved at this time.

Reason: {reason}

This decision is based on our standard underwriting criteria. You may reapply after addressing the above concerns.

Thank you for your interest in LoanOps.
""".strip(),

    "VERIFICATION_SUCCESS": """
✅ Verification Complete!

Your identity has been successfully verified. We are now proceeding to the underwriting stage where we will assess your loan eligibility.

Please wait while our underwriting team reviews your application.
""".strip(),

    "VERIFICATION_PENDING": """
📋 Verification Required

To proceed with your loan application, we need to verify your identity. Please provide your:
- Full Name
- PAN Number
- Monthly Salary

This information helps us process your application securely.
""".strip(),
}


# =============================================================================
# Main Explanation Generator
# =============================================================================

def generate_explanation(
    decision: dict,
    context: str = "loan_decision"
) -> str:
    """
    Generate a human-friendly explanation for a loan decision.
    
    Args:
        decision: Dictionary containing decision details
            - status: "APPROVED" | "REJECTED" | "VERIFICATION_SUCCESS" | etc.
            - reason: (optional) Reason for the decision
            - loan_amount: (optional) Requested loan amount
            - salary: (optional) Customer's salary
            - emi: (optional) Calculated EMI
        context: Type of explanation needed
    
    Returns:
        Human-friendly explanation string
    
    FAIL-SAFE: If Gemini API fails, returns a sensible default message.
    """
    status = decision.get("status", "UNKNOWN").upper()
    reason = decision.get("reason", "Standard policy criteria")
    loan_amount = decision.get("loan_amount", "N/A")
    salary = decision.get("salary", "N/A")
    emi = decision.get("emi", "N/A")
    
    # If Gemini is disabled or unavailable, use fallback
    if not GEMINI_ENABLED or model is None:
        return _get_fallback_message(status, reason)
    
    # Build prompt for Gemini
    prompt = _build_prompt(status, reason, loan_amount, salary, emi, context)
    
    try:
        response = model.generate_content(prompt)
        explanation = response.text.strip()
        
        # Basic validation - ensure we got something useful
        if len(explanation) < 20:
            print("[GEMINI] Response too short, using fallback")
            return _get_fallback_message(status, reason)
        
        print(f"[GEMINI] Generated explanation ({len(explanation)} chars)")
        return explanation
    
    except Exception as e:
        print(f"[GEMINI] API call failed: {e}")
        return _get_fallback_message(status, reason)


def _build_prompt(
    status: str,
    reason: str,
    loan_amount,
    salary,
    emi,
    context: str
) -> str:
    """Build the prompt for Gemini based on decision context."""
    
    base_prompt = """You are a professional loan officer at a modern NBFC (Non-Banking Financial Company).
Your task is to write a brief, friendly, and clear message to a customer about their loan application.

RULES:
- Be professional but warm
- Keep it under 100 words
- Do not include any legal disclaimers
- Do not mention specific interest rates unless provided
- Use simple language
- Include an emoji or two for friendliness

"""

    if status == "APPROVED":
        return base_prompt + f"""
The customer's loan has been APPROVED.

Details:
- Loan Amount: ₹{loan_amount}
- Monthly Salary: ₹{salary}
- Calculated EMI: ₹{emi}
- Reason: {reason}

Write a congratulatory message explaining their loan is approved and their sanction letter will be generated.
"""
    
    elif status == "REJECTED":
        return base_prompt + f"""
The customer's loan has been REJECTED.

Details:
- Loan Amount Requested: ₹{loan_amount}
- Monthly Salary: ₹{salary}
- Rejection Reason: {reason}

Write a polite, empathetic message explaining why the loan could not be approved. Suggest they may reapply in the future after addressing the issue.
"""
    
    elif status == "VERIFICATION_SUCCESS":
        return base_prompt + """
The customer has successfully completed identity verification.

Write a brief message confirming their verification is complete and that we are now proceeding to assess their loan eligibility.
"""
    
    elif status == "VERIFICATION_PENDING":
        return base_prompt + """
We need to verify the customer's identity before proceeding.

Write a friendly message asking them to provide their Full Name, PAN Number, and Monthly Salary for verification.
"""
    
    else:
        return base_prompt + f"""
Context: {context}
Status: {status}
Reason: {reason}

Write an appropriate professional message for this situation.
"""


def _get_fallback_message(status: str, reason: str = "") -> str:
    """Return a default message when Gemini is unavailable."""
    
    if status in DEFAULT_MESSAGES:
        return DEFAULT_MESSAGES[status].format(reason=reason)
    
    # Generic fallback
    return f"Your application status: {status}. {reason}"


# =============================================================================
# Quick Test
# =============================================================================

if __name__ == "__main__":
    # Test the explainer
    test_decision = {
        "status": "APPROVED",
        "reason": "EMI is within 50% of salary",
        "loan_amount": 100000,
        "salary": 40000,
        "emi": 5000
    }
    
    print("Testing Gemini Explainer...")
    print("-" * 50)
    result = generate_explanation(test_decision)
    print(result)
