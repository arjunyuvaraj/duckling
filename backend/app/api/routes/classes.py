from __future__ import annotations

import asyncio
import logging
import random
import string

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.api.routes.auth import user_from_authorization
from app.data.problems import PROBLEM_DICTS
from app.db.supabase import supabase
from app.services.problem_seed import existing_problem_ids, seed_problem_catalog

logger = logging.getLogger(__name__)
router = APIRouter()


class ClassCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    language_focus: str | None = Field(default=None, max_length=40)


class JoinClass(BaseModel):
    code: str = Field(min_length=4, max_length=20)


class AssignmentCreate(BaseModel):
    problem_id: int | None = None
    problem_ids: list[int] | None = None
    pack_id: str | None = Field(default=None, max_length=180)
    title: str | None = Field(default=None, max_length=160)
    instructions: str | None = Field(default=None, max_length=600)
    due_at: str | None = None


def class_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(6))


def decorate_class(row: dict, role: str, assignments: list[dict] | None = None, students: int = 0) -> dict:
    return {
        "id": str(row.get("id")),
        "name": row.get("name"),
        "description": row.get("description") or "",
        "code": row.get("code"),
        "language_focus": row.get("language_focus") or "Mixed",
        "teacher_id": row.get("teacher_id"),
        "role": role,
        "student_count": students,
        "assignments": assignments or [],
        "created_at": row.get("created_at"),
    }


def problem_title(problem_id: int) -> str:
    problem = next((item for item in PROBLEM_DICTS if item["id"] == problem_id), None)
    return problem["title"] if problem else f"Problem {problem_id}"


async def assignments_for(class_id: str) -> list[dict]:
    result = await asyncio.to_thread(
        lambda: supabase.table("assignments").select("*").eq("class_id", class_id).execute()
    )
    return [
        {
            **row,
            "problem_title": row.get("title") or problem_title(row["problem_id"]),
        }
        for row in result.data or []
    ]


@router.get("")
async def list_classes(authorization: str | None = Header(default=None)):
    user = await user_from_authorization(authorization)

    try:
        taught = await asyncio.to_thread(
            lambda: supabase.table("classes").select("*").eq("teacher_id", user["id"]).eq("is_active", True).execute()
        )
        enrollments = await asyncio.to_thread(
            lambda: supabase.table("enrollments").select("class_id").eq("student_id", user["id"]).execute()
        )
        class_ids = [row["class_id"] for row in enrollments.data or []]
        joined = []
        if class_ids:
            joined_result = await asyncio.to_thread(
                lambda: supabase.table("classes").select("*").in_("id", class_ids).eq("is_active", True).execute()
            )
            joined = joined_result.data or []

        classes = []
        for row in taught.data or []:
            classes.append(decorate_class(row, "teacher", await assignments_for(row["id"])))
        for row in joined:
            classes.append(decorate_class(row, "student", await assignments_for(row["id"])))
        return {"status": "success", "classes": classes}
    except Exception as exc:
        logger.warning("Class listing failed: %s", exc)
        raise HTTPException(status_code=500, detail="Class listing failed. Make sure classes and enrollments tables exist.")


@router.post("")
async def create_class(req: ClassCreate, authorization: str | None = Header(default=None)):
    user = await user_from_authorization(authorization)
    row = {
        "teacher_id": user["id"],
        "name": req.name.strip(),
        "description": (req.description or "").strip(),
        "language_focus": req.language_focus or "Mixed",
        "code": class_code(),
        "is_active": True,
    }

    try:
        result = await asyncio.to_thread(lambda: supabase.table("classes").insert(row).execute())
        created = result.data[0] if result.data else row
        return {"status": "success", "class": decorate_class(created, "teacher")}
    except Exception as exc:
        logger.warning("Class creation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Class creation failed. Make sure the classes table exists.")


@router.post("/join")
async def join_class(req: JoinClass, authorization: str | None = Header(default=None)):
    user = await user_from_authorization(authorization)
    code = req.code.strip().upper()

    try:
        class_result = await asyncio.to_thread(
            lambda: supabase.table("classes").select("*").eq("code", code).eq("is_active", True).execute()
        )
        if not class_result.data:
            raise HTTPException(status_code=404, detail="Class code not found")

        class_row = class_result.data[0]
        enrollment = {"class_id": class_row["id"], "student_id": user["id"]}
        await asyncio.to_thread(lambda: supabase.table("enrollments").insert(enrollment).execute())
        return {"status": "success", "class": decorate_class(class_row, "student")}
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Join class failed: %s", exc)
        raise HTTPException(status_code=500, detail="Joining class failed. Make sure the enrollments table exists.")


@router.get("/{class_id}/assignments")
async def list_assignments(class_id: str, authorization: str | None = Header(default=None)):
    await user_from_authorization(authorization)
    try:
        result = await asyncio.to_thread(
            lambda: supabase.table("assignments").select("*").eq("class_id", class_id).execute()
        )
        assignments = [
            {
                **row,
                "problem_title": row.get("title") or problem_title(row["problem_id"]),
            }
            for row in result.data or []
        ]
        return {"status": "success", "assignments": assignments}
    except Exception as exc:
        logger.warning("Assignment listing failed: %s", exc)
        raise HTTPException(status_code=500, detail="Assignment listing failed. Make sure the assignments table exists.")


@router.post("/{class_id}/assignments")
async def create_assignment(class_id: str, req: AssignmentCreate, authorization: str | None = Header(default=None)):
    user = await user_from_authorization(authorization)
    problem_ids = req.problem_ids or ([req.problem_id] if req.problem_id is not None else [])
    problem_ids = list(dict.fromkeys(problem_ids))
    if not problem_ids:
        raise HTTPException(status_code=400, detail="Choose at least one problem")

    valid_ids = {problem["id"] for problem in PROBLEM_DICTS}
    missing = [problem_id for problem_id in problem_ids if problem_id not in valid_ids]
    if missing:
        raise HTTPException(status_code=404, detail=f"Problem not found: {missing[0]}")

    try:
        stored_ids = await asyncio.to_thread(lambda: existing_problem_ids(problem_ids))
        missing_from_database = [problem_id for problem_id in problem_ids if problem_id not in stored_ids]
        if missing_from_database:
            await asyncio.to_thread(lambda: seed_problem_catalog(missing_from_database))
    except Exception as exc:
        logger.warning("Problem catalog seed check failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Assignment creation failed because the problems table is not ready. Run backend/supabase_schema.sql and seed the problem catalog.",
        )

    rows = [
        {
            "class_id": class_id,
            "problem_id": problem_id,
            "title": req.title or problem_title(problem_id),
            "instructions": req.instructions or "",
            "due_at": req.due_at,
            "created_by": user["id"],
        }
        for problem_id in problem_ids
    ]

    try:
        result = await asyncio.to_thread(lambda: supabase.table("assignments").insert(rows).execute())
        created_rows = result.data or rows
        assignments = [{**row, "problem_title": row.get("title") or problem_title(row["problem_id"])} for row in created_rows]
        return {"status": "success", "assignments": assignments, "assignment": assignments[0]}
    except Exception as exc:
        logger.warning("Assignment creation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Assignment creation failed. Make sure the assignments table exists.")
