"""
Master Agent (Supervisor)
=========================
Orchestrates the flow between specialized agents using a simple state machine.

Flow: Sales -> Verification -> Underwriting -> Sanction/Rejected

This is a DEMO-FIRST implementation for hackathon demonstration.
Stability > Intelligence.
"""

from typing import Dict, Any
from agents.sales import sales_agent_node
from agents.verification import verification_agent_node
from agents.underwriting import underwriting_agent_node
from agents.sanction import sanction_agent_node

# ============================================================================
# LangGraph State Definition (Simple Dict)
# ============================================================================

def create_initial_state() -> Dict[str, Any]:
    """Create a fresh state for a new conversation."""
    return {
        "stage": "sales",
        "active_agent": "SalesAgent",
        "messages": [],
        "user_data": {},
        "verification_status": None,
        "underwriting_decision": None,
        "loan_details": {},
    }


# ============================================================================
# Agent Routing Map
# ============================================================================

STAGE_TO_AGENT = {
    "sales": ("SalesAgent", sales_agent_node),
    "verification": ("VerificationAgent", verification_agent_node),
    "underwriting": ("UnderwritingAgent", underwriting_agent_node),
    "sanction": ("SanctionAgent", sanction_agent_node),
    "rejected": ("SanctionAgent", None),  # No agent for rejected, just returns message
}


# ============================================================================
# Supervisor Logic
# ============================================================================

def determine_next_stage(state: Dict, user_message: str) -> str:
    """
    Determine the next stage based on current state and user message.
    
    SIMPLE & DETERMINISTIC routing for demo safety:
    - Start at "sales"
    - After intent captured -> "verification"
    - After KYC verified -> "underwriting"
    - After underwriting -> "sanction" or "rejected"
    
    TODO: Integrate with actual LangGraph routing when ready.
    """
    current_stage = state.get("stage", "sales")
    message_lower = user_message.lower()
    
    print(f"[SUPERVISOR] Current stage: {current_stage}")
    print(f"[SUPERVISOR] User message: {user_message[:50]}...")
    print(f"[SUPERVISOR] State verified: {state.get('verified')}")
    
    if current_stage == "sales":
        # Move to verification when user expresses loan intent
        if any(keyword in message_lower for keyword in ["loan", "lakh", "amount", "borrow", "need", "want", "rupees"]):
            print("[SUPERVISOR] Loan intent detected -> Moving to VERIFICATION")
            # Extract loan amount if present
            _extract_loan_amount(state, user_message)
            return "verification"
        return "sales"
    
    elif current_stage == "verification":
        # CRITICAL: HARD GUARD - Only move to underwriting if EXPLICITLY verified
        # This ensures no loan can ever be sanctioned without verification
        if state.get("verified") == True and state.get("verification_status") == "verified":
            print("[SUPERVISOR] Verification COMPLETE (verified=True) -> Moving to UNDERWRITING")
            # Extract salary if present in this or previous messages
            _extract_salary(state, user_message)
            return "underwriting"
        
        # If not verified, ALWAYS stay in verification stage
        # Do NOT use keyword-based fallback - this was causing unverified sanctions
        print("[SUPERVISOR] Verification PENDING - staying in VERIFICATION stage")
        return "verification"
    
    elif current_stage == "underwriting":
        # Underwriting auto-transitions based on decision
        decision = state.get("underwriting_decision")
        if decision == "approved":
            print("[SUPERVISOR] Loan APPROVED -> Moving to SANCTION")
            return "sanction"
        elif decision == "rejected":
            print("[SUPERVISOR] Loan REJECTED -> Moving to REJECTED")
            return "rejected"
        # Default: stay in underwriting until decision is made
        return "underwriting"
    
    elif current_stage == "sanction":
        # Terminal state - stay here
        return "sanction"
    
    elif current_stage == "rejected":
        # Terminal state - stay here
        return "rejected"
    
    return current_stage


def _extract_loan_amount(state: Dict, message: str):
    """Extract loan amount from user message and store in state."""
    import re
    # Match patterns like "100000", "1,00,000", "1 lakh", "50000"
    message_lower = message.lower()
    
    # Try to extract number
    numbers = re.findall(r'[\d,]+', message)
    for num_str in numbers:
        try:
            num = int(num_str.replace(',', ''))
            if num >= 1000:  # Minimum loan amount
                state["loan_amount"] = num
                print(f"[SUPERVISOR] Extracted loan_amount: {num}")
                return
        except:
            pass
    
    # Check for "lakh" mentions
    lakh_match = re.search(r'(\d+)\s*lakh', message_lower)
    if lakh_match:
        state["loan_amount"] = int(lakh_match.group(1)) * 100000
        print(f"[SUPERVISOR] Extracted loan_amount: {state['loan_amount']}")


def _extract_salary(state: Dict, message: str):
    """Extract salary from user message and store in state."""
    import re
    message_lower = message.lower()
    
    # Match patterns like "salary is 50000", "monthly salary 40000", "earn 30000"
    salary_match = re.search(r'(?:salary|earn|income|monthly)\s*(?:is|of)?\s*(\d[\d,]*)', message_lower)
    if salary_match:
        try:
            salary = int(salary_match.group(1).replace(',', ''))
            state["salary"] = salary
            print(f"[SUPERVISOR] Extracted salary: {salary}")
            return
        except:
            pass
    
    # Fallback: look for any number that could be salary
    numbers = re.findall(r'[\d,]+', message)
    for num_str in numbers:
        try:
            num = int(num_str.replace(',', ''))
            if 5000 <= num <= 500000:  # Reasonable salary range
                state["salary"] = num
                print(f"[SUPERVISOR] Extracted salary (fallback): {num}")
                return
        except:
            pass


def supervisor_node(state: Dict, user_message: str) -> Dict[str, Any]:
    """
    Main supervisor function that orchestrates the agent workflow.
    
    This is the entry point called from the /chat endpoint.
    
    Args:
        state: Current conversation state
        user_message: User's input message
    
    Returns:
        Dict with: reply, stage, active_agent
    
    DEMO SAFETY:
    - Never crashes
    - Always returns valid response
    - Clear logging for mentor visibility
    """
    try:
        print("\n" + "="*60)
        print("[SUPERVISOR] Processing message...")
        print("="*60)
        
        # Determine the next stage
        next_stage = determine_next_stage(state, user_message)
        state["stage"] = next_stage
        
        # Get the appropriate agent
        agent_name, agent_func = STAGE_TO_AGENT.get(next_stage, ("SalesAgent", sales_agent_node))
        state["active_agent"] = agent_name
        
        print(f"[SUPERVISOR] Routing to: {agent_name}")
        
        # Call the agent to get response
        if agent_func:
            agent_response = agent_func(state, user_message)
        else:
            # Fallback for terminal states without agent
            agent_response = {
                "reply": "Thank you for your interest. Is there anything else I can help you with?",
                "underwriting_decision": state.get("underwriting_decision")
            }
        
        # Extract reply from agent response
        reply = agent_response.get("reply", "How can I assist you today?")
        
        # Update state with any agent-provided data
        if "underwriting_decision" in agent_response:
            state["underwriting_decision"] = agent_response["underwriting_decision"]
        
        # CRITICAL: Sync verification status from agent response to state
        if "verified" in agent_response:
            state["verified"] = agent_response["verified"]
            print(f"[SUPERVISOR] Synced verified={state['verified']} from agent response")
        
        # Check if we need to auto-transition after underwriting
        if next_stage == "underwriting" and state.get("underwriting_decision"):
            # Re-route based on decision
            final_stage = determine_next_stage(state, user_message)
            state["stage"] = final_stage
            final_agent_name = STAGE_TO_AGENT.get(final_stage, ("SalesAgent", None))[0]
            state["active_agent"] = final_agent_name
            
            # Get sanction/rejection message
            if final_stage == "sanction":
                sanction_response = sanction_agent_node(state, user_message)
                reply = sanction_response.get("reply", reply)
            elif final_stage == "rejected":
                reply = "We regret to inform you that your loan application could not be approved at this time based on our eligibility criteria. Please contact our support team for more information."
        
        print(f"[SUPERVISOR] Final stage: {state['stage']}")
        print(f"[SUPERVISOR] Active agent: {state['active_agent']}")
        print(f"[SUPERVISOR] Reply: {reply[:50]}...")
        print("="*60 + "\n")
        
        return {
            "reply": reply,
            "stage": state["stage"],
            "active_agent": state["active_agent"]
        }
    
    except Exception as e:
        # DEMO SAFETY: Never crash during live presentation
        print(f"[SUPERVISOR ERROR] {str(e)}")
        return {
            "reply": "I apologize, but I encountered an issue. Let me help you with your loan application. What type of loan are you interested in?",
            "stage": "sales",
            "active_agent": "SalesAgent"
        }


# ============================================================================
# Underwriting Rules Engine (TODO: Move to rules/underwriting_rules.py)
# ============================================================================

async def run_underwriting(customer_id: str, loan_details: dict):
    """
    Underwriting rules engine.
    
    TODO: This is placeholder code for the underwriting rules.
    TODO: Integrate with services/credit_bureau.py and services/offer_mart.py
    TODO: Move to rules/underwriting_rules.py when services are implemented.
    """
    # TODO: Import these when services are created
    # from backend.services.credit_bureau import fetch_credit_score
    # from backend.services.offer_mart import get_preapproved_limit

    loan_amount = loan_details.get("amount", 0)
    salary = loan_details.get("salary")
    expected_emi = loan_details.get("expected_emi")

    # TODO: Replace with actual service calls
    credit_score = 750  # Mock: fetch_credit_score(customer_id)
    preapproved_limit = 100000  # Mock: get_preapproved_limit(customer_id)

    # Rule 3: Reject if credit score < 700
    if credit_score < 700:
        return {
            "status": "rejected",
            "reason": "Low credit score",
            "credit_score": credit_score
        }

    # Rule 1: Instant approval if loan <= preapproved limit
    if loan_amount <= preapproved_limit:
        return {
            "status": "approved",
            "approval_type": "instant",
            "credit_score": credit_score
        }

    # Rule 2: Salary slip required if loan <= 2x preapproved limit
    if loan_amount <= 2 * preapproved_limit:
        if not salary or not expected_emi:
            return {
                "status": "salary_slip_required",
                "message": "Please upload your latest salary slip"
            }

        if expected_emi <= 0.5 * salary:
            return {
                "status": "approved",
                "approval_type": "salary_verified",
                "credit_score": credit_score
            }

        return {
            "status": "rejected",
            "reason": "EMI exceeds 50% of salary"
        }

    # Rule 3: Loan amount too high
    return {
        "status": "rejected",
        "reason": "Loan amount exceeds eligibility"
    }
