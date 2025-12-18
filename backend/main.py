"""
Agentic Loan Orchestrator - FastAPI Backend
============================================
Main entry point for the LoanOps AI hackathon project.

Endpoints:
- GET  /health           - Health check
- POST /chat             - Main chat interface
- GET  /session/{id}     - Debug: View session
- DELETE /session/{id}   - Debug: Clear session
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Literal
import traceback

# Import the LangGraph supervisor
from .agents.master import supervisor_node
from .agents.sales import sales_agent_node
from .agents.verification import verification_agent_node
from .agents.underwriting import underwriting_agent_node
from .agents.sanction import sanction_agent_node
from backend.agents.master import create_initial_state

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
session_store: Dict[str, dict] = {}

def get_or_create_session(session_id: str) -> dict:
    """Get existing session or create a new one using LangGraph initial state."""
    if session_id not in session_store:
        session_store[session_id] = create_initial_state()
    return session_store[session_id]

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
        
        # Return structured response for frontend
        return ChatResponse(
            reply=result["reply"],
            stage=result["stage"],
            active_agent=result["active_agent"]
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
            active_agent="SalesAgent"
        )


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
