"""
Loan Application Models
=======================
Pydantic models for loan application tracking.

This module provides data models for persisting loan applications
as traceable entities throughout the agent workflow.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class LoanStatus(str, Enum):
    """Status states for a loan application lifecycle."""
    INITIATED = "Initiated"
    VERIFIED = "Verified"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    SANCTIONED = "Sanctioned"


class LoanApplication(BaseModel):
    """
    Represents a loan application entity.
    
    Each loan request creates a trackable application with:
    - Unique ID (matches session_id in LOAN-XXXX format)
    - Status tracking through the agent workflow
    - Loan amount when captured
    - Timestamps for audit trail
    """
    application_id: str  # Same as session_id (LOAN-XXXX format)
    user_id: Optional[str] = None
    loan_amount: Optional[float] = None
    status: LoanStatus = LoanStatus.INITIATED
    created_at: datetime

    class Config:
        use_enum_values = True


class LoanApplicationResponse(BaseModel):
    """Response model for single application."""
    application_id: str
    user_id: Optional[str] = None
    loan_amount: Optional[float] = None
    status: str
    created_at: datetime


class LoanApplicationListResponse(BaseModel):
    """Response model for applications list."""
    total: int
    applications: list[LoanApplicationResponse]


# ============================================================================
# User Authentication Models
# ============================================================================

class User(BaseModel):
    """
    Represents a user account.
    
    Simple user entity for identification:
    - Unique ID and email
    - Creation timestamp for audit
    
    Note: Email-only auth for hackathon demo.
    Production would use stronger verification (e.g., DigiLocker).
    """
    user_id: str
    email: str
    created_at: datetime


class EmailAuthRequest(BaseModel):
    """Request model for email-only signup/login."""
    email: str


class AuthResponse(BaseModel):
    """Response model for successful authentication."""
    token: str
    user_id: str
    email: str


class UserResponse(BaseModel):
    """Response model for user info."""
    user_id: str
    email: str

