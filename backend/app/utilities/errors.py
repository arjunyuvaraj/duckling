# app/utils/error_handler.py

from fastapi import HTTPException
from supabase_auth.errors import AuthApiError
import logging

logger = logging.getLogger(__name__)

class AuthError(HTTPException):
    """Custom auth error with better formatting"""
    def __init__(self, message: str, status_code: int = 400, detail: str = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail or message
        super().__init__(status_code=status_code, detail=self.detail)
        logger.error(f"AUTH ERROR: {message}")

def handle_auth_error(error: Exception) -> None:
    """Parse Supabase auth errors and raise with better messages"""
    error_str = str(error).lower()
    
    # Rate limiting
    if "rate limit" in error_str or "429" in error_str:
        raise AuthError(
            message="Too many attempts. Please wait before trying again.",
            status_code=429,
            detail="Rate limit exceeded. Try again in a few minutes."
        )
    
    # Invalid email
    elif "invalid email" in error_str or "invalid_credentials" in error_str:
        raise AuthError(
            message="Invalid email format.",
            status_code=400,
            detail="Please provide a valid email address."
        )
    
    # Weak password
    elif "password" in error_str and ("weak" in error_str or "short" in error_str):
        raise AuthError(
            message="Password too weak.",
            status_code=400,
            detail="Password must be at least 6 characters."
        )
    
    # Email already exists
    elif "already registered" in error_str or "user already exists" in error_str:
        raise AuthError(
            message="Email already registered.",
            status_code=400,
            detail="This email is already in use. Try logging in instead."
        )
    
    # User not found
    elif "user not found" in error_str or "invalid login credentials" in error_str:
        raise AuthError(
            message="Invalid email or password.",
            status_code=401,
            detail="Email or password is incorrect."
        )
    
    # Generic auth error
    else:
        raise AuthError(
            message=f"Authentication failed: {str(error)[:100]}",
            status_code=400,
            detail="An error occurred during authentication."
        )
