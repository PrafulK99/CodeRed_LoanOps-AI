from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, Literal
import traceback

# Import agent nodes (placeholders for now)
from agents.master import supervisor_node
from agents.sales import sales_agent_node
from agents.verification import verification_agent_node
from agents.underwriting import underwriting_agent_node
from agents.sanction import sanction_agent_node

app = FastAPI(title="Agentic Loan Orchestrator API")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon demo, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Pydantic Models for Request/Response
# ============================================================================

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    stage: Literal["sales", "verification", "underwriting", "sanction", "rejected"]
    active_agent: Literal["SalesAgent", "VerificationAgent", "UnderwritingAgent", "SanctionAgent"]

# ============================================================================
# In-Memory Session State (Minimal, for hackathon demo)
# ============================================================================

# Simple in-memory store for session states
# Structure: { session_id: { "stage": str, "messages": list, "user_data": dict } }
session_store: Dict[str, dict] = {}

def get_or_create_session(session_id: str) -> dict:
    """Get existing session or create a new one."""
    if session_id not in session_store:
        session_store[session_id] = {
            "stage": "sales",
            "active_agent": "SalesAgent",
            "messages": [],
            "user_data": {},  # Collected user information
            "verified": False,
            "underwriting_decision": None,
        }
    return session_store[session_id]

# ============================================================================
# LangGraph Supervisor Integration (Mocked for now)
# ============================================================================

def determine_next_stage(session: dict, user_message: str) -> tuple[str, str]:
    """
    TODO: Replace with actual LangGraph supervisor logic.
    
    This mock implementation simulates stage transitions based on keywords.
    In production, the LangGraph supervisor will handle this routing.
    """
    current_stage = session["stage"]
    message_lower = user_message.lower()
    
    # Mock stage transition logic based on conversation flow
    # TODO: Integrate with LangGraph supervisor_node() for real routing
    
    if current_stage == "sales":
        # Check if user has provided enough info to move to verification
        if any(keyword in message_lower for keyword in ["loan", "lakh", "amount", "need", "want", "borrow"]):
            # Extract loan intent - stay in sales to gather more info
            if "verify" in message_lower or "proceed" in message_lower or session.get("loan_amount_mentioned"):
                return "verification", "VerificationAgent"
            session["loan_amount_mentioned"] = True
        return "sales", "SalesAgent"
    
    elif current_stage == "verification":
        # Check if verification data is collected
        if any(keyword in message_lower for keyword in ["pan", "aadhaar", "verified", "id", "confirm"]):
            session["verified"] = True
            return "underwriting", "UnderwritingAgent"
        return "verification", "VerificationAgent"
    
    elif current_stage == "underwriting":
        # Underwriting is typically automatic, move to sanction or rejection
        # TODO: Integrate with underwriting_rules.py
        return "sanction", "SanctionAgent"
    
    elif current_stage == "sanction":
        # Stay in sanction stage
        return "sanction", "SanctionAgent"
    
    return current_stage, session.get("active_agent", "SalesAgent")

def generate_agent_response(session: dict, user_message: str, stage: str, active_agent: str) -> str:
    """
    TODO: Replace with actual LangGraph agent responses.
    
    This generates mock responses based on the current stage.
    In production, each agent will use GPT-4o or deterministic logic.
    """
    # TODO: Call actual agent nodes:
    # - sales_agent_node(state) for Sales
    # - verification_agent_node(state) for Verification
    # - underwriting_agent_node(state) for Underwriting
    # - sanction_agent_node(state) for Sanction
    
    if stage == "sales":
        if "loan" in user_message.lower():
            return "Great! I'd be happy to help you with a personal loan. Could you please tell me the loan amount you're looking for and the purpose of the loan?"
        elif any(word in user_message.lower() for word in ["lakh", "amount", "₹", "rs", "rupees"]):
            return "Thank you for sharing that. To proceed with your loan application, I'll need to verify your identity. Would you like to continue with the verification process?"
        else:
            return "Hello! Welcome to our loan services. I'm here to help you with your loan application. What type of loan are you interested in - Personal Loan, Home Loan, or Business Loan?"
    
    elif stage == "verification":
        if not session.get("verified"):
            return "To verify your identity, please provide your PAN number. This helps us fetch your credit information securely."
        else:
            return "Your identity has been verified successfully! I'm now processing your application through our underwriting system."
    
    elif stage == "underwriting":
        # TODO: Call underwriting_rules.py check_eligibility()
        return "Your application is being evaluated based on our eligibility criteria. Please wait while I analyze your credit profile and loan eligibility..."
    
    elif stage == "sanction":
        return "Congratulations! Your loan has been pre-approved. The sanction letter is being generated with the approved loan amount and terms. You will receive it shortly."
    
    elif stage == "rejected":
        return "We regret to inform you that your loan application could not be approved at this time. Please contact our support team for more information."
    
    return "I'm here to help you with your loan application. How can I assist you today?"

def process_chat_message(session_id: str, message: str) -> ChatResponse:
    """
    Main chat processing logic.
    
    TODO: Replace with full LangGraph workflow:
    1. Pass message to supervisor_node()
    2. Supervisor routes to appropriate agent
    3. Agent processes and returns response
    4. Update state and return to user
    """
    # Get or create session
    session = get_or_create_session(session_id)
    
    # Add message to history
    session["messages"].append({"role": "user", "content": message})
    
    # Determine next stage and active agent
    # TODO: Use LangGraph supervisor for routing
    next_stage, next_agent = determine_next_stage(session, message)
    
    # Update session state
    session["stage"] = next_stage
    session["active_agent"] = next_agent
    
    # Generate response from the active agent
    # TODO: Use actual LangGraph agent nodes
    reply = generate_agent_response(session, message, next_stage, next_agent)
    
    # Add bot response to history
    session["messages"].append({"role": "assistant", "content": reply})
    
    return ChatResponse(
        reply=reply,
        stage=next_stage,
        active_agent=next_agent
    )

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Agentic Loan Orchestrator is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for loan orchestration.
    
    Accepts user messages and routes them through the LangGraph supervisor
    to the appropriate agent (Sales, Verification, Underwriting, Sanction).
    
    Request:
        - session_id: Unique identifier for the conversation session
        - message: User's message text
    
    Response:
        - reply: Bot's response text
        - stage: Current workflow stage (sales/verification/underwriting/sanction/rejected)
        - active_agent: Currently active agent handling the conversation
    """
    try:
        # Validate input
        if not request.session_id or not request.session_id.strip():
            raise HTTPException(status_code=400, detail="session_id is required")
        
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="message is required")
        
        # Process the chat message
        response = process_chat_message(
            session_id=request.session_id.strip(),
            message=request.message.strip()
        )
        
        return response
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing chat: {traceback.format_exc()}")
        
        # Return a safe fallback response - never crash
        return ChatResponse(
            reply="I apologize, but I encountered an issue processing your request. Please try again.",
            stage="sales",
            active_agent="SalesAgent"
        )

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Debug endpoint to view session state.
    Useful for development and testing.
    
    TODO: Remove or secure this in production.
    """
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session_store[session_id]

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """
    Clear a session to start fresh.
    Useful for testing and demos.
    
    TODO: Remove or secure this in production.
    """
    if session_id in session_store:
        del session_store[session_id]
        return {"status": "ok", "message": f"Session {session_id} cleared"}
    
    raise HTTPException(status_code=404, detail="Session not found")
