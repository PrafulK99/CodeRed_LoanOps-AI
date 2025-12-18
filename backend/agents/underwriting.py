"""
Underwriting Agent
------------------
This agent evaluates personal loan eligibility using
STRICT RULE-BASED logic (no LLM decision-making).

All decisions are deterministic and auditable.
"""

from services.credit_bureau import fetch_credit_score
from services.offer_mart import get_preapproved_limit


async def run_underwriting(customer_id: str, loan_details: dict):
    """
    Evaluates loan eligibility for a customer.

    Rules:
    1. Reject if credit score < 700
    2. Auto-approve if loan amount <= pre-approved limit
    3. If loan amount <= 2x pre-approved limit:
       - Request salary slip
       - Approve only if EMI <= 50% of salary
    4. Reject if loan amount > 2x pre-approved limit
    """

    loan_amount = loan_details.get("amount")
    salary = loan_details.get("salary")
    expected_emi = loan_details.get("expected_emi")

    # Fetch external data (mocked services)
    credit_score = fetch_credit_score(customer_id)
    preapproved_limit = get_preapproved_limit(customer_id)

    # -------------------------------
    # Rule 1: Reject if credit score < 700
    # -------------------------------
    if credit_score < 700:
        return {
            "status": "rejected",
            "reason": "Credit score below minimum threshold",
            "credit_score": credit_score
        }

    # -------------------------------
    # Rule 2: Instant approval
    # Loan amount within pre-approved limit
    # -------------------------------
    if loan_amount <= preapproved_limit:
        return {
            "status": "approved",
            "approval_type": "instant",
            "credit_score": credit_score
        }

    # -------------------------------
    # Rule 3: Salary-based evaluation
    # Loan amount within 2x pre-approved limit
    # -------------------------------
    if loan_amount <= 2 * preapproved_limit:

        # Salary slip not provided yet
        if salary is None or expected_emi is None:
            return {
                "status": "salary_slip_required",
                "message": "Salary slip required for further evaluation"
            }

        # EMI must be <= 50% of monthly salary
        if expected_emi <= 0.5 * salary:
            return {
                "status": "approved",
                "approval_type": "salary_verified",
                "credit_score": credit_score
            }

        # EMI too high → reject
        return {
            "status": "rejected",
            "reason": "EMI exceeds 50% of monthly salary"
        }

    # -------------------------------
    # Rule 4: Reject if loan amount > 2x pre-approved limit
    # -------------------------------
    return {
        "status": "rejected",
        "reason": "Requested loan amount exceeds eligibility limits"
    }


def underwriting_agent_node(state):
    """
    Placeholder implementation for the underwriting agent node.
    """
    # TODO: Implement the actual logic for underwriting
    return {"status": "underwriting complete"}
