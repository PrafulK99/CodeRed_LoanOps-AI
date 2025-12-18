"""
Risk Scoring Utility
====================
Computes a deterministic risk score (0-100) with explainable factors.

This is a rule-based scoring system, NOT ML/AI prediction.
Used to explain why underwriting decisions are made.
"""

from typing import List, Dict, Any


def compute_risk_score(
    loan_amount: float,
    salary: float,
    emi: float,
    tenure: int,
    is_verified: bool = True
) -> Dict[str, Any]:
    """
    Compute weighted risk score 0-100 with explainable factors.
    
    Lower score = lower risk = better for approval.
    
    Factors (weighted contributions to risk):
    - EMI-to-income ratio: 40 points max
    - Loan-to-salary ratio: 30 points max
    - Tenure risk: 20 points max
    - Verification status: 10 points max
    
    Args:
        loan_amount: Requested loan amount
        salary: Monthly salary
        emi: Calculated EMI
        tenure: Loan tenure in months
        is_verified: Whether identity is verified
    
    Returns:
        dict with:
        - risk_score: 0-100 (lower is better)
        - risk_level: "Low" / "Medium" / "High"
        - risk_factors: List of explanatory strings
    """
    
    risk_score = 0
    risk_factors = []
    
    # Ensure we have valid values
    if salary <= 0:
        salary = 1  # Prevent division by zero
    if loan_amount <= 0:
        loan_amount = 1
    if emi <= 0:
        emi = 1
    if tenure <= 0:
        tenure = 12
    
    # =========================================================================
    # Factor 1: EMI-to-Income Ratio (40 points max)
    # =========================================================================
    emi_ratio = emi / salary
    
    if emi_ratio <= 0.3:
        # Excellent - EMI is under 30% of salary
        emi_points = 10
        risk_factors.append("✓ EMI-to-income ratio is excellent (under 30%)")
    elif emi_ratio <= 0.4:
        # Good - EMI is 30-40% of salary
        emi_points = 20
        risk_factors.append("✓ EMI-to-income ratio within acceptable limits")
    elif emi_ratio <= 0.5:
        # Borderline - EMI is 40-50% of salary
        emi_points = 30
        risk_factors.append("⚠ EMI-to-income ratio approaching threshold")
    else:
        # High risk - EMI exceeds 50%
        emi_points = 40
        risk_factors.append("⚠ EMI-to-income ratio exceeds recommended limits")
    
    risk_score += emi_points
    
    # =========================================================================
    # Factor 2: Loan-to-Salary Ratio (30 points max)
    # =========================================================================
    loan_salary_ratio = loan_amount / salary
    
    if loan_salary_ratio <= 3:
        # Loan is 3x or less of salary - low risk
        loan_points = 5
        risk_factors.append("✓ Loan amount is conservative relative to income")
    elif loan_salary_ratio <= 6:
        # Loan is 3-6x salary - moderate
        loan_points = 15
        risk_factors.append("✓ Loan amount is moderate relative to income")
    elif loan_salary_ratio <= 10:
        # Loan is 6-10x salary - elevated
        loan_points = 25
        risk_factors.append("⚠ Loan amount is elevated relative to income")
    else:
        # Loan exceeds 10x salary - high risk
        loan_points = 30
        risk_factors.append("⚠ Loan amount is high relative to income")
    
    risk_score += loan_points
    
    # =========================================================================
    # Factor 3: Tenure Risk (20 points max)
    # =========================================================================
    if tenure <= 12:
        # Short tenure - lower risk
        tenure_points = 5
        risk_factors.append("✓ Short loan tenure reduces overall exposure")
    elif tenure <= 24:
        # Medium tenure - moderate
        tenure_points = 10
        risk_factors.append("✓ Standard loan tenure")
    elif tenure <= 36:
        # Longer tenure - elevated
        tenure_points = 15
        risk_factors.append("⚠ Extended tenure increases interest burden")
    else:
        # Very long tenure - higher risk
        tenure_points = 20
        risk_factors.append("⚠ Long tenure increases repayment risk")
    
    risk_score += tenure_points
    
    # =========================================================================
    # Factor 4: Verification Status (10 points max)
    # =========================================================================
    if is_verified:
        verification_points = 0
        risk_factors.append("✓ Identity verification complete")
    else:
        verification_points = 10
        risk_factors.append("⚠ Identity verification pending")
    
    risk_score += verification_points
    
    # =========================================================================
    # Compute Final Risk Level
    # =========================================================================
    if risk_score <= 40:
        risk_level = "Low"
    elif risk_score <= 70:
        risk_level = "Medium"
    else:
        risk_level = "High"
    
    print(f"[RISK SCORING] Score: {risk_score}, Level: {risk_level}")
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors
    }
