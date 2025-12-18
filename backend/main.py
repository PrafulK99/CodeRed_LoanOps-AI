"""
Agentic Loan Orchestrator - FastAPI Backend
============================================
Main entry point for the LoanOps AI hackathon project.

Endpoints:
- GET  /health           - Health check
- POST /chat             - Main chat interface
- GET  /applications     - List all loan applications
- GET  /applications/{id} - Get application details
- GET  /session/{id}     - Debug: View session
- DELETE /session/{id}   - Debug: Clear session
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Literal, Any, List
from datetime import datetime
import traceback

# Import loan application models
from models import LoanApplication, LoanStatus, LoanApplicationResponse, LoanApplicationListResponse

# Import the LangGraph supervisor
from agents.master import supervisor_node, create_initial_state
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


class VerificationRequest(BaseModel):
    session_id: str
    details: Dict[str, Any]

class ChatResponse(BaseModel):
    reply: str
    stage: Literal["sales", "verification", "underwriting", "sanction", "rejected"]
    active_agent: Literal["SalesAgent", "VerificationAgent", "UnderwritingAgent", "SanctionAgent"]
    application_status: str  # Current loan application status

# ============================================================================
# In-Memory Session State (Minimal, for hackathon demo)
# ============================================================================

# Simple in-memory store for session states
session_store: Dict[str, dict] = {}

# ============================================================================
# Loan Application Store (In-Memory for Hackathon Demo)
# ============================================================================

application_store: Dict[str, LoanApplication] = {}


def get_or_create_session(session_id: str) -> dict:
    """Get existing session or create a new one using LangGraph initial state."""
    if session_id not in session_store:
        session_store[session_id] = create_initial_state()
        # Create a corresponding loan application record
        if session_id not in application_store:
            application_store[session_id] = LoanApplication(
                application_id=session_id,
                status=LoanStatus.INITIATED,
                created_at=datetime.now()
            )
            print(f"[APPLICATION] Created new application: {session_id}")
    return session_store[session_id]


def update_application_status(session_id: str, stage: str, loan_amount: float = None):
    """
    Update application status based on workflow stage.
    
    Stage to Status mapping:
    - sales/verification -> Initiated
    - underwriting -> Verified
    - sanction -> Approved -> Sanctioned
    - rejected -> Rejected
    """
    if session_id not in application_store:
        return
    
    app = application_store[session_id]
    
    # Update loan amount if provided
    if loan_amount:
        app.loan_amount = loan_amount
    
    # Map stage to status
    stage_to_status = {
        "sales": LoanStatus.INITIATED,
        "verification": LoanStatus.INITIATED,
        "underwriting": LoanStatus.VERIFIED,
        "sanction": LoanStatus.SANCTIONED,
        "rejected": LoanStatus.REJECTED,
    }
    
    new_status = stage_to_status.get(stage)
    if new_status and new_status != app.status:
        app.status = new_status
        print(f"[APPLICATION] {session_id} status updated to: {new_status.value}")


def get_application_status(session_id: str) -> str:
    """Get current application status."""
    if session_id in application_store:
        return application_store[session_id].status.value if hasattr(application_store[session_id].status, 'value') else application_store[session_id].status
    return LoanStatus.INITIATED.value

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Agentic Loan Orchestrator is running"}


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for loan orchestration.
    
    Routes messages through the LangGraph supervisor to appropriate agents:
    Sales → Verification → Underwriting → Sanction/Rejected
    
    Request:
        - session_id: Unique identifier for the conversation session
        - message: User's message text
    
    Response:
        - reply: Bot's response text
        - stage: Current workflow stage
        - active_agent: Currently active agent
    """
    try:
        # Validate input
        if not request.session_id or not request.session_id.strip():
            raise HTTPException(status_code=400, detail="session_id is required")
        
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="message is required")
        
        session_id = request.session_id.strip()
        message = request.message.strip()
        
        # Get or create session
        session = get_or_create_session(session_id)
        
        # Add user message to history
        session["messages"].append({"role": "user", "content": message})
        
        # ======================================================================
        # Call the LangGraph Supervisor
        # This is the core orchestration - routes to appropriate agent
        # ======================================================================
        result = supervisor_node(session, message)
        
        # Add bot response to history
        session["messages"].append({"role": "assistant", "content": result["reply"]})
        
        # Update loan application status based on stage
        loan_amount = session.get("loan_amount")
        update_application_status(session_id, result["stage"], loan_amount)
        
        # Return structured response for frontend
        return ChatResponse(
            reply=result["reply"],
            stage=result["stage"],
            active_agent=result["active_agent"],
            application_status=get_application_status(session_id)
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    
    except Exception as e:
        # Log the error for debugging
        print(f"[ERROR] Chat endpoint error: {traceback.format_exc()}")
        
        # DEMO SAFETY: Return a safe fallback response - never crash
        return ChatResponse(
            reply="I apologize, but I encountered an issue processing your request. Please try again.",
            stage="sales",
            active_agent="SalesAgent",
            application_status="Initiated"
        )


@app.post("/verify")
async def verify_endpoint(request: VerificationRequest):
    """
    Lightweight verification endpoint.

    Accepts a structured `details` payload from the frontend, delegates to the
    `verification_agent_node` which encrypts and persists a verification blob
    in the in-memory session state for demo purposes.
    """
    try:
        if not request.session_id or not request.session_id.strip():
            raise HTTPException(status_code=400, detail="session_id is required")

        session = get_or_create_session(request.session_id.strip())

        # Call verification agent with the structured details
        result = verification_agent_node(session, request.details)

        # Append messages for traceability
        session["messages"].append({"role": "user", "content": "[verification_submitted]"})
        session["messages"].append({"role": "assistant", "content": result["reply"]})

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[VERIFY ENDPOINT] Error: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")


@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Debug endpoint to view session state.
    Useful for development and demo debugging.
    
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


@app.get("/stages")
async def get_workflow_stages():
    """
    Return the workflow stages and their descriptions.
    Useful for frontend visualization.
    """
    return {
        "stages": [
            {"id": "sales", "name": "Sales", "agent": "SalesAgent", "description": "Initial conversation and loan intent capture"},
            {"id": "verification", "name": "Verification", "agent": "VerificationAgent", "description": "KYC and identity verification"},
            {"id": "underwriting", "name": "Underwriting", "agent": "UnderwritingAgent", "description": "Loan eligibility assessment"},
            {"id": "sanction", "name": "Sanction", "agent": "SanctionAgent", "description": "Loan approval and letter generation"},
            {"id": "rejected", "name": "Rejected", "agent": "SanctionAgent", "description": "Application could not be approved"},
        ],
        "flow": "sales → verification → underwriting → sanction | rejected"
    }


# ============================================================================
# Loan Application API Endpoints (Read-Only)
# ============================================================================

@app.get("/applications", response_model=LoanApplicationListResponse)
async def list_applications():
    """
    List all loan applications.
    
    Returns all applications with their current status.
    This is a read-only endpoint for audit and traceability.
    """
    applications = []
    for app_id, app in application_store.items():
        applications.append(LoanApplicationResponse(
            application_id=app.application_id,
            user_id=app.user_id,
            loan_amount=app.loan_amount,
            status=app.status.value if hasattr(app.status, 'value') else app.status,
            created_at=app.created_at
        ))
    
    # Sort by created_at descending (newest first)
    applications.sort(key=lambda x: x.created_at, reverse=True)
    
    return LoanApplicationListResponse(
        total=len(applications),
        applications=applications
    )


@app.get("/applications/{application_id}", response_model=LoanApplicationResponse)
async def get_application(application_id: str):
    """
    Get details of a specific loan application.
    
    Returns the application details including status and loan amount.
    This is a read-only endpoint for audit and traceability.
    """
    if application_id not in application_store:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app = application_store[application_id]
    return LoanApplicationResponse(
        application_id=app.application_id,
        user_id=app.user_id,
        loan_amount=app.loan_amount,
        status=app.status.value if hasattr(app.status, 'value') else app.status,
        created_at=app.created_at
    )

