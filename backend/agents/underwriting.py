"""
Underwriting Agent
Evaluates loan eligibility based on salary and loan amount.

DEMO IMPLEMENTATION: Uses simple EMI < 50% of salary rule.
For demo, auto-approves most loans to show the full flow.
"""

from typing import Dict, Any
from utils.risk_scoring import compute_risk_score


def underwriting_agent_node(state: Dict, user_message: str) -> Dict[str, Any]:
    """
    Underwriting Agent - Evaluates loan eligibility.
    
    DEMO LOGIC:
    - If EMI < 50% of salary -> APPROVED
    - Otherwise -> REJECTED
    - If salary unknown, auto-approve for demo
    
    Also computes risk score for transparency.
    
    Args:
        state: Current conversation state
        user_message: User's input message
    
    Returns:
        Dict with reply, underwriting_decision, and risk assessment
    """
    print("[UNDERWRITING AGENT] Processing eligibility...")
    
    # Get loan details from state
    loan_amount = state.get("loan_amount", 100000)
    salary = state.get("salary", 50000)  # Default to 50k if not provided
    tenure = state.get("tenure", 24)  # months
    interest_rate = 10.5  # Annual interest rate
    is_verified = state.get("verified", False)
    
    print(f"[UNDERWRITING AGENT] Loan: {loan_amount}, Salary: {salary}")
    
    # Calculate EMI (simple formula for demo)
    monthly_rate = interest_rate / 100 / 12
    emi = loan_amount * monthly_rate * (1 + monthly_rate)**tenure / ((1 + monthly_rate)**tenure - 1)
    emi = round(emi, 2)
    
    # Store EMI in state for sanction letter
    state["emi"] = emi
    state["tenure"] = tenure
    state["interest_rate"] = interest_rate
    
    print(f"[UNDERWRITING AGENT] Calculated EMI: {emi}")
    
    # =========================================================================
    # Compute Risk Score (for transparency, not for decision)
    # =========================================================================
    risk_result = compute_risk_score(
        loan_amount=loan_amount,
        salary=salary,
        emi=emi,
        tenure=tenure,
        is_verified=is_verified
    )
    
    # Store risk data in state
    state["risk_score"] = risk_result["risk_score"]
    state["risk_level"] = risk_result["risk_level"]
    state["risk_factors"] = risk_result["risk_factors"]
    
    # Decision Rule: EMI should be less than 50% of salary
    emi_to_salary_ratio = emi / salary if salary > 0 else 1
    
    if emi_to_salary_ratio <= 0.5:
        # APPROVED
        decision = "approved"
        reason = f"EMI ({emi:.0f}) is {emi_to_salary_ratio*100:.1f}% of salary - within acceptable limits"
        
        reply = f"""✅ CONGRATULATIONS! Your loan has been PRE-APPROVED!

📊 Eligibility Assessment:
- Loan Amount: Rs. {loan_amount:,}
- Monthly EMI: Rs. {emi:,.2f}
- Your Salary: Rs. {salary:,}
- EMI/Salary Ratio: {emi_to_salary_ratio*100:.1f}% (Max allowed: 50%)

📈 Risk Assessment: {risk_result['risk_level']} ({risk_result['risk_score']}/100)

Your application meets all our eligibility criteria. Proceeding to generate your sanction letter..."""
        
        print(f"[UNDERWRITING AGENT] Decision: APPROVED - {reason}")
        
    else:
        # REJECTED
        decision = "rejected"
        reason = f"EMI ({emi:.0f}) is {emi_to_salary_ratio*100:.1f}% of salary - exceeds 50% limit"
        
        reply = f"""❌ We regret to inform you that your loan application cannot be approved at this time.

📊 Eligibility Assessment:
- Loan Amount Requested: Rs. {loan_amount:,}
- Calculated EMI: Rs. {emi:,.2f}
- Your Salary: Rs. {salary:,}
- EMI/Salary Ratio: {emi_to_salary_ratio*100:.1f}%

📈 Risk Assessment: {risk_result['risk_level']} ({risk_result['risk_score']}/100)

⚠️ Reason: The EMI exceeds 50% of your monthly salary.

💡 Suggestion: You may consider:
- Reducing the loan amount
- Increasing the loan tenure
- Reapplying after a salary increase

Thank you for your interest in LoanOps."""
        
        print(f"[UNDERWRITING AGENT] Decision: REJECTED - {reason}")
    
    return {
        "reply": reply,
        "underwriting_decision": decision,
        "emi": emi,
        "loan_amount": loan_amount,
        "salary": salary,
        "reason": reason,
        # Risk Assessment Data
        "risk_score": risk_result["risk_score"],
        "risk_level": risk_result["risk_level"],
        "risk_factors": risk_result["risk_factors"]
    }
