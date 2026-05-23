# app/api/routes/auth.py
# PRODUCTION VERSION - Proper password hashing and validation

from fastapi import APIRouter, HTTPException
from app.db.supabase import supabase
from models.authentication.auth_requests import SignupRequest, LoginRequest
import logging
import uuid
import bcrypt

logger = logging.getLogger(__name__)
router = APIRouter()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

@router.post("/signup")
def signup(req: SignupRequest):
    try:
        logger.info(f"🟡 Signup attempt: {req.email}")
        
        # Validate inputs
        if not req.email or "@" not in req.email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        if len(req.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        if len(req.username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        
        # Hash the password
        password_hash = hash_password(req.password)
        user_id = str(uuid.uuid4())
        
        # Insert into users table
        result = supabase.table("users").insert({
            "id": user_id,
            "email": req.email,
            "username": req.username,
            "password_hash": password_hash
        }).execute()
        
        logger.info(f"🟢 User created: {req.username} ({user_id})")
        return {
            "status": "success",
            "user_id": user_id,
            "username": req.username,
            "email": req.email,
            "message": "Account created successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f"🔴 Signup error for {req.email}: {type(e).__name__}: {str(e)}")
        
        if "already exists" in error_msg or "unique" in error_msg:
            if "email" in error_msg:
                raise HTTPException(status_code=400, detail="Email already registered")
            else:
                raise HTTPException(status_code=400, detail="Username already taken")
        
        raise HTTPException(status_code=400, detail="Signup failed")

@router.post("/login")
def login(req: LoginRequest):
    try:
        logger.info(f"🟡 Login attempt: {req.email}")
        
        # Get user from database by email
        result = supabase.table("users").select("id, email, username, password_hash, deleted_at").eq("email", req.email).execute()
        
        if not result.data or len(result.data) == 0:
            logger.warning(f"🟡  User not found: {req.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = result.data[0]
        
        # Check if account is soft-deleted
        if user.get("deleted_at"):
            logger.warning(f"🟡  Deleted account login attempt: {req.email}")
            raise HTTPException(status_code=401, detail="Account has been deleted")
        
        # Verify password
        if not verify_password(req.password, user["password_hash"]):
            logger.warning(f"🟡  Invalid password for: {req.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"🟢 Login successful: {req.email}")
        return {
            "status": "success",
            "user_id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "message": "Logged in successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔴 Login error for {req.email}: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")