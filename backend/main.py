"""
Agentic Loan Orchestrator - FastAPI Backend
============================================
Main entry point for the LoanOps AI hackathon project.

Endpoints:
- GET  /health           - Health check
- POST /signup           - User registration
- POST /login            - User authentication
- GET  /me               - Get current user
- POST /logout           - User logout
- POST /chat             - Main chat interface (requires auth)
- GET  /applications     - List all loan applications
- GET  /applications/{id} - Get application details
- GET  /session/{id}     - Debug: View session
- DELETE /session/{id}   - Debug: Clear session
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Literal, Any, List, Optional
from datetime import datetime
import traceback
import uuid

# Import loan application models
from models import (
    LoanApplication, LoanStatus, LoanApplicationResponse, LoanApplicationListResponse,
    User, EmailAuthRequest, AuthResponse, UserResponse
)

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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount generated files for PDF downloads
app.mount(
    "/files",
    StaticFiles(directory="generated"),
    name="files"
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
    sanction_letter: Optional[str] = None  # PDF filename when sanctioned

# ============================================================================
# In-Memory Session State (Minimal, for hackathon demo)
# ============================================================================

# Simple in-memory store for session states
session_store: Dict[str, dict] = {}

# ============================================================================
# Loan Application Store (In-Memory for Hackathon Demo)
# ============================================================================

application_store: Dict[str, LoanApplication] = {}

# ============================================================================
# User Store (In-Memory for Hackathon Demo)
# ============================================================================

user_store: Dict[str, User] = {}  # user_id -> User
email_to_user_id: Dict[str, str] = {}  # email -> user_id (for login lookup)
auth_sessions: Dict[str, str] = {}  # token -> user_id


def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[User]:
    """
    Extract current user from Authorization header.
    Returns None if not authenticated (for optional auth).
    """
    if not authorization:
        return None
    
    # Expect: "Bearer <token>"
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    user_id = auth_sessions.get(token)
    if not user_id:
        return None
    
    return user_store.get(user_id)


def require_auth(authorization: Optional[str] = Header(None)) -> User:
    """
    Require authentication. Raises 401 if not authenticated.
    """
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def get_or_create_session(session_id: str, user_id: Optional[str] = None) -> dict:
    """Get existing session or create a new one using LangGraph initial state."""
    if session_id not in session_store:
        session_store[session_id] = create_initial_state()
        # Create a corresponding loan application record
        if session_id not in application_store:
            application_store[session_id] = LoanApplication(
                application_id=session_id,
                user_id=user_id,  # Link to authenticated user
                status=LoanStatus.INITIATED,
                created_at=datetime.now()
            )
            print(f"[APPLICATION] Created new application: {session_id} (User: {user_id})")
    else:
        # Update user_id if not set (for existing sessions)
        if user_id and session_id in application_store:
            app = application_store[session_id]
            if not app.user_id:
                app.user_id = user_id
    return session_store[session_id]


def update_application_status(session_id: str, stage: str, loan_amount: float = None):
    """
    Update application status based on workflow stage.
    
    Stage to Status mapping:
    - sales/verification -> Initiated
    - underwriting -> Verified
    - sanction -> Approved -> Sanctioned
    - rejected -> Rejected
    
    CRITICAL: Includes hard guard to prevent sanction without verification
    """
    if session_id not in application_store:
        return
    
    app = application_store[session_id]
    
    # Update loan amount if provided
    if loan_amount:
        app.loan_amount = loan_amount
    
    # CRITICAL VERIFICATION GUARD:
    # Before setting SANCTIONED or VERIFIED status, check if session is actually verified
    session = session_store.get(session_id, {})
    is_verified = session.get("verified") == True and session.get("verification_status") == "verified"
    
    # Map stage to status
    stage_to_status = {
        "sales": LoanStatus.INITIATED,
        "verification": LoanStatus.INITIATED,
        "underwriting": LoanStatus.VERIFIED,
        "sanction": LoanStatus.SANCTIONED,
        "rejected": LoanStatus.REJECTED,
    }
    
    new_status = stage_to_status.get(stage)
    
    # HARD GUARD: Prevent sanction/verified status if not actually verified
    if new_status in [LoanStatus.SANCTIONED, LoanStatus.VERIFIED]:
        if not is_verified:
            print(f"[APPLICATION] BLOCKED: Cannot set {new_status.value} - verification not complete")
            new_status = LoanStatus.INITIATED  # Keep as INITIATED if not verified
    
    if new_status and new_status != app.status:
        app.status = new_status
        print(f"[APPLICATION] {session_id} status updated to: {new_status.value}")
    
    # Update sanction_letter if available in session
    sanction_letter = session.get("sanction_letter")
    if sanction_letter and new_status == LoanStatus.SANCTIONED:
        app.sanction_letter = sanction_letter
        print(f"[APPLICATION] {session_id} sanction_letter set to: {sanction_letter}")


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


# ============================================================================
# Authentication Endpoints (Email-Only for Hackathon Demo)
# ============================================================================

@app.post("/signup", response_model=AuthResponse)
async def signup(request: EmailAuthRequest):
    """
    Register a new user with email-only authentication.
    
    Email-only auth for hackathon demo - production would use stronger verification.
    If user already exists, returns success (idempotent).
    """
    email = request.email.strip().lower()
    
    # Validate email
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    
    # Check if user already exists
    if email in email_to_user_id:
        # User exists - log them in instead (idempotent signup)
        user_id = email_to_user_id[email]
        user = user_store.get(user_id)
        token = str(uuid.uuid4())
        auth_sessions[token] = user_id
        print(f"[AUTH] Existing user signup (login): {email}")
        return AuthResponse(token=token, user_id=user_id, email=email)
    
    # Create new user
    user_id = str(uuid.uuid4())
    user = User(
        user_id=user_id,
        email=email,
        created_at=datetime.now()
    )
    
    # Store user
    user_store[user_id] = user
    email_to_user_id[email] = user_id
    
    # Create session token
    token = str(uuid.uuid4())
    auth_sessions[token] = user_id
    
    print(f"[AUTH] New user signup: {email} (ID: {user_id})")
    
    return AuthResponse(token=token, user_id=user_id, email=email)


@app.post("/login", response_model=AuthResponse)
async def login(request: EmailAuthRequest):
    """
    Login with email-only authentication.
    
    Email-only auth for hackathon demo - production would use stronger verification.
    """
    email = request.email.strip().lower()
    
    # Validate email
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    
    # Find user by email
    user_id = email_to_user_id.get(email)
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found. Please sign up first.")
    
    user = user_store.get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found. Please sign up first.")
    
    # Create session token
    token = str(uuid.uuid4())
    auth_sessions[token] = user_id
    
    print(f"[AUTH] User login: {email}")
    
    return AuthResponse(token=token, user_id=user_id, email=email)


@app.get("/me", response_model=UserResponse)
async def get_me(authorization: Optional[str] = Header(None)):
    """
    Get current authenticated user info.
    """
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return UserResponse(user_id=user.user_id, email=user.email)


@app.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """
    Logout and invalidate session token.
    """
    if authorization:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            if token in auth_sessions:
                del auth_sessions[token]
                return {"status": "ok", "message": "Logged out successfully"}
    
    return {"status": "ok", "message": "Logged out"}


# ============================================================================
# Chat Endpoints
# ============================================================================
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, authorization: Optional[str] = Header(None)):
    """
    Main chat endpoint for loan orchestration.
    Requires authentication - user must be logged in.
    
    Routes messages through the LangGraph supervisor to appropriate agents:
    Sales → Verification → Underwriting → Sanction/Rejected
    
    Request:
        - session_id: Unique identifier for the conversation session
        - message: User's message text
        - Authorization header: Bearer token
    
    Response:
        - reply: Bot's response text
        - stage: Current workflow stage
        - active_agent: Currently active agent
    """
    # Require authentication
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required. Please login to continue.")
    
    try:
        # Validate input
        if not request.session_id or not request.session_id.strip():
            raise HTTPException(status_code=400, detail="session_id is required")
        
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="message is required")
        
        session_id = request.session_id.strip()
        message = request.message.strip()
        
        # Get or create session (link to authenticated user)
        session = get_or_create_session(session_id, user.user_id)
        
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
        
        # Get sanction_letter if available
        sanction_letter = session.get("sanction_letter")
        
        # Return structured response for frontend
        return ChatResponse(
            reply=result["reply"],
            stage=result["stage"],
            active_agent=result["active_agent"],
            application_status=get_application_status(session_id),
            sanction_letter=sanction_letter
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
            sanction_letter=app.sanction_letter,
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
        sanction_letter=app.sanction_letter,
        created_at=app.created_at
    )

