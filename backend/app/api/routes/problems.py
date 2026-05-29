from __future__ import annotations

import asyncio

from fastapi import APIRouter, Header, HTTPException, Query

from app.api.routes.auth import user_from_authorization
from app.data.problems import PROBLEM_DICTS
from app.services.problem_seed import seed_problem_catalog

router = APIRouter()


def sorted_unique(values: list[str]) -> list[str]:
    return sorted(set(values))


@router.get("")
async def list_problems(
    q: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    language: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    set_name: str | None = Query(default=None, alias="set"),
    batch: str | None = Query(default=None),
    tag: str | None = Query(default=None),
):
    needle = q.lower().strip() if q else None

    def matches(problem: dict) -> bool:
        if difficulty and problem["difficulty"] != difficulty:
            return False
        if language and problem["language"] != language:
            return False
        if topic and problem["topic"] != topic:
            return False
        if set_name and problem["set"] != set_name:
            return False
        if batch and problem["batch"] != batch:
            return False
        if tag and tag not in problem["tags"]:
            return False
        if needle:
            haystack = " ".join(
                [
                    problem["title"],
                    problem["difficulty"],
                    problem["language"],
                    problem["topic"],
                    problem["set"],
                    problem["batch"],
                    *problem["tags"],
                ]
            ).lower()
            return needle in haystack
        return True

    problems = [problem for problem in PROBLEM_DICTS if matches(problem)]
    return {"status": "success", "count": len(problems), "problems": problems}


@router.get("/metadata")
async def problem_metadata():
    return {
        "status": "success",
        "count": len(PROBLEM_DICTS),
        "sets": sorted_unique([problem["set"] for problem in PROBLEM_DICTS]),
        "batches": sorted_unique([problem["batch"] for problem in PROBLEM_DICTS]),
        "topics": sorted_unique([problem["topic"] for problem in PROBLEM_DICTS]),
        "tags": sorted_unique([tag for problem in PROBLEM_DICTS for tag in problem["tags"]]),
        "languages": sorted_unique([problem["language"] for problem in PROBLEM_DICTS]),
        "difficulties": ["Easy", "Medium", "Hard"],
    }


@router.get("/packs")
async def problem_packs():
    packs: dict[str, dict] = {}
    for problem in PROBLEM_DICTS:
        key = f"{problem['set']}::{problem['batch']}"
        if key not in packs:
            packs[key] = {
                "id": key,
                "set": problem["set"],
                "batch": problem["batch"],
                "language": problem["language"],
                "topic": problem["topic"],
                "difficulty": problem["difficulty"],
                "tags": set(),
                "problem_ids": [],
            }
        packs[key]["problem_ids"].append(problem["id"])
        packs[key]["tags"].update(problem["tags"])

    return {
        "status": "success",
        "packs": [
            {
                **pack,
                "tags": sorted(pack["tags"]),
                "count": len(pack["problem_ids"]),
            }
            for pack in sorted(packs.values(), key=lambda item: (item["set"], item["batch"]))
        ],
    }


@router.post("/seed")
async def seed_problems(authorization: str | None = Header(default=None)):
    await user_from_authorization(authorization)
    try:
        count = await asyncio.to_thread(seed_problem_catalog)
        return {"status": "success", "seeded": count}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Problem seed failed: {exc}")


@router.get("/{problem_id}")
async def get_problem(problem_id: int):
    problem = next((item for item in PROBLEM_DICTS if item["id"] == problem_id), None)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"status": "success", "problem": problem}
