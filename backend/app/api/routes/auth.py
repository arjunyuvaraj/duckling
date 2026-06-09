import asyncio
import logging
import uuid

from fastapi import APIRouter, Header, HTTPException
from app.db.supabase import supabase
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, decode_access_token, hash_password, verify_password
from models.authentication.auth_requests import SignupRequest, LoginRequest

logger = logging.getLogger(__name__)
router = APIRouter()


def session_payload(user: dict):
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "username": user["username"],
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


async def user_from_authorization(authorization: str | None):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    result = await asyncio.to_thread(
        lambda: supabase.table("users").select(
            "id, email, username, feathers, deleted_at"
        ).eq("id", payload["sub"]).execute()
    )

    if not result.data:
        raise HTTPException(status_code=401, detail="User not found")

    user = result.data[0]
    if user.get("deleted_at"):
        raise HTTPException(status_code=401, detail="Account has been deleted")

    return user


@router.post("/signup")
async def signup(req: SignupRequest):
    try:
        logger.info(f"Signup attempt: {req.email}")

        if not req.email or "@" not in req.email:
            raise HTTPException(status_code=400, detail="Invalid email format")

        if len(req.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

        if len(req.username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")

        password_hash = hash_password(req.password)
        user_id = str(uuid.uuid4())

        await asyncio.to_thread(
            lambda: supabase.table("users").insert({
                "id": user_id,
                "email": req.email,
                "username": req.username,
                "password_hash": password_hash,
                "feathers": 0,
            }).execute()
        )

        logger.info(f"User created: {req.username} ({user_id})")
        user = {"id": user_id, "username": req.username, "email": req.email}
        return {
            "status": "success",
            "user_id": user_id,
            "username": req.username,
            "email": req.email,
            "feathers": 0,
            "message": "Account created successfully",
            **session_payload(user),
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f"Signup error for {req.email}: {type(e).__name__}: {str(e)}")

        if "already exists" in error_msg or "unique" in error_msg:
            if "email" in error_msg:
                raise HTTPException(status_code=409, detail="Email already registered")
            raise HTTPException(status_code=409, detail="Username already taken")

        raise HTTPException(status_code=500, detail="Signup failed")


@router.post("/login")
async def login(req: LoginRequest):
    try:
        logger.info(f"Login attempt: {req.email}")

        result = await asyncio.to_thread(
            lambda: supabase.table("users").select(
                "id, email, username, feathers, password_hash, deleted_at"
            ).eq("email", req.email).execute()
        )

        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = result.data[0]

        if user.get("deleted_at"):
            raise HTTPException(status_code=401, detail="Account has been deleted")

        if not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        logger.info(f"Login successful: {req.email}")
        return {
            "status": "success",
            "user_id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "feathers": user.get("feathers", 0),
            "message": "Logged in successfully",
            **session_payload(user),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {req.email}: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.get("/me")
async def me(authorization: str | None = Header(default=None)):
    user = await user_from_authorization(authorization)
    return {
        "status": "success",
        "user_id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "feathers": user.get("feathers", 0),
    }


@router.post("/logout")
async def logout():
    return {"status": "success", "message": "Logged out"}
