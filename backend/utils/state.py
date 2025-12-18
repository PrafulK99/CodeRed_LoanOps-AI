from typing import Dict, Any

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