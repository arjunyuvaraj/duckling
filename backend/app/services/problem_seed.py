from __future__ import annotations

import re

from app.data.problems import PROBLEM_DICTS
from app.db.supabase import supabase

BASE_COLUMNS = {
    "id",
    "slug",
    "title",
    "description",
    "difficulty",
    "category",
    "estimated_time_minutes",
    "is_published",
    "version",
}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "problem"


def estimated_minutes(difficulty: str) -> int:
    return {"Easy": 18, "Medium": 32, "Hard": 48}.get(difficulty, 25)


def catalog_problem_rows(problem_ids: list[int] | None = None) -> list[dict]:
    allowed = set(problem_ids or [])
    rows = []
    for problem in PROBLEM_DICTS:
        if allowed and problem["id"] not in allowed:
            continue
        rows.append(
            {
                "id": problem["id"],
                "slug": f"{problem['id']}-{slugify(problem['title'])}",
                "title": problem["title"],
                "description": problem["description"],
                "difficulty": problem["difficulty"],
                "language": problem["language"],
                "topic": problem["topic"],
                "category": problem["topic"],
                "problem_set": problem["set"],
                "batch_name": problem["batch"],
                "tags": problem["tags"],
                "acceptance": problem["acceptance"],
                "estimated_time_minutes": estimated_minutes(problem["difficulty"]),
                "is_published": True,
                "version": 1,
            }
        )
    return rows


def remove_column(rows: list[dict], column: str) -> list[dict]:
    return [{key: value for key, value in row.items() if key != column} for row in rows]


def strip_to_base_columns(rows: list[dict]) -> list[dict]:
    return [{key: value for key, value in row.items() if key in BASE_COLUMNS} for row in rows]


def upsert_rows(rows: list[dict]) -> None:
    current_rows = rows
    optional_columns = ["topic", "problem_set", "batch_name", "tags", "acceptance"]

    while True:
        try:
            supabase.table("problems").upsert(current_rows, on_conflict="id").execute()
            return
        except Exception as exc:
            message = str(exc).lower()
            removable = next(
                (
                    column
                    for column in optional_columns
                    if column in current_rows[0] and column in message and ("column" in message or "schema cache" in message)
                ),
                None,
            )
            if removable:
                current_rows = remove_column(current_rows, removable)
                continue
            if "language" in current_rows[0] and "language" in message and ("column" in message or "schema cache" in message):
                current_rows = strip_to_base_columns(current_rows)
                continue
            raise


def seed_problem_catalog(problem_ids: list[int] | None = None) -> int:
    rows = catalog_problem_rows(problem_ids)
    if not rows:
        return 0

    for start in range(0, len(rows), 100):
        upsert_rows(rows[start : start + 100])

    return len(rows)


def existing_problem_ids(problem_ids: list[int]) -> set[int]:
    if not problem_ids:
        return set()

    result = supabase.table("problems").select("id").in_("id", problem_ids).execute()
    return {int(row["id"]) for row in result.data or []}
