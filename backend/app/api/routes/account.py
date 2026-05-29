from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.api.routes.auth import user_from_authorization
from app.db.supabase import supabase

logger = logging.getLogger(__name__)
router = APIRouter()


class ProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    display_name: str | None = Field(default=None, max_length=80)
    role: str | None = Field(default=None, max_length=30)
    school_name: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=280)


def public_user(user: dict):
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "username": user.get("username"),
        "display_name": user.get("display_name") or user.get("username"),
        "role": user.get("role") or "student",
        "school_name": user.get("school_name") or "",
        "bio": user.get("bio") or "",
        "created_at": user.get("created_at"),
    }


@router.get("/me")
async def account_me(authorization: str | None = Header(default=None)):
    user = await user_from_authorization(authorization)
    return {"status": "success", "user": public_user(user)}


@router.patch("/me")
async def update_account(req: ProfileUpdate, authorization: str | None = Header(default=None)):
    user = await user_from_authorization(authorization)
    raw_updates = req.model_dump(exclude_unset=True) if hasattr(req, "model_dump") else req.dict(exclude_unset=True)
    updates = {
        key: value.strip() if isinstance(value, str) else value
        for key, value in raw_updates.items()
        if value is not None
    }

    if not updates:
        return {"status": "success", "user": public_user(user)}

    if "role" in updates and updates["role"] not in {"student", "teacher", "student-teacher"}:
        raise HTTPException(status_code=400, detail="Role must be student, teacher, or student-teacher")

    try:
        result = await asyncio.to_thread(
            lambda: supabase.table("users").update(updates).eq("id", user["id"]).execute()
        )
        updated = result.data[0] if result.data else {**user, **updates}
        return {"status": "success", "user": public_user(updated)}
    except Exception as exc:
        logger.warning("Profile update failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Profile update failed. Make sure the users table has display_name, role, school_name, and bio columns.",
        )
