import asyncio
import logging
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.api.routes.auth import user_from_authorization
from app.db.supabase import supabase

logger = logging.getLogger(__name__)
router = APIRouter()

# Safe chars for 6-digit PIN (Kahoot-style all-numeric)
def _generate_code() -> str:
    return str(random.randint(100000, 999999))

# Problems bucketed by difficulty (must have compete harnesses in server)
_EASY   = [1, 2, 3, 5, 6, 9, 11, 12, 14]
_MEDIUM = [4, 7, 10, 13, 15, 16]
_HARD   = [8, 17, 18, 19, 20]

def _pick_problem(avg_feathers: int) -> int:
    if avg_feathers < 300:
        pool = _EASY
    elif avg_feathers < 600:
        pool = _EASY + _MEDIUM
    elif avg_feathers < 900:
        pool = _MEDIUM + _HARD
    else:
        pool = _HARD
    return random.choice(pool)

def _compute_rankings(submissions: list, players: list) -> dict[str, int]:
    """Returns {user_id: place} 1-based. Lower place = better."""
    sub_map = {s["user_id"]: s for s in submissions}

    def sort_key(uid: str):
        s = sub_map.get(uid)
        if s is None:
            return (0, 0, "9999")
        total = s["passed_visible"] + s["passed_hidden"]
        won   = 1 if s["all_passed"] else 0
        ts    = s.get("submitted_at") or "9999"
        # Higher won/total is better; earlier ts breaks ties for all_passed
        return (won, total, ts)

    sorted_uids = sorted(
        [p["user_id"] for p in players],
        key=sort_key,
        reverse=True,  # descending (best first)
    )
    # Re-sort ts ascending for all_passed ties
    # Already handled: "won" is max first; among equal totals earlier ts wins because
    # reversed sort would put later ts first — fix below by stable secondary sort
    # Simpler: sort in two passes
    def final_key(uid: str):
        s = sub_map.get(uid)
        if s is None:
            return (-1, 0, "9999-all")
        total = s["passed_visible"] + s["passed_hidden"]
        won   = 1 if s["all_passed"] else 0
        ts    = s.get("submitted_at") or "9999"
        # Negate total and won for descending; keep ts ascending
        return (-won, -total, ts)

    sorted_uids = sorted([p["user_id"] for p in players], key=final_key)
    return {uid: i + 1 for i, uid in enumerate(sorted_uids)}


def _compute_feather_changes(players: list, rankings: dict[str, int]) -> dict[str, int]:
    """Multi-player Elo: each player vs every other, averaged."""
    n = len(players)
    if n <= 1:
        return {}
    K = 32
    result: dict[str, int] = {}
    player_map = {p["user_id"]: p for p in players}

    for p in players:
        uid      = p["user_id"]
        my_rank  = rankings.get(uid, n)
        my_score = (n - my_rank) / (n - 1)       # 1.0 = 1st, 0.0 = last
        my_f     = p["feathers"]
        others   = [o for o in players if o["user_id"] != uid]
        total    = 0.0
        for opp in others:
            expected = 1 / (1 + 10 ** ((opp["feathers"] - my_f) / 400))
            total   += K * (my_score - expected)
        result[uid] = round(total / len(others))

    return result


async def _update_feathers(user_id: str, current: int, change: int) -> int:
    new_val = max(0, current + change)
    await asyncio.to_thread(
        lambda: supabase.table("users")
            .update({"feathers": new_val}).eq("id", user_id).execute()
    )
    return new_val


async def _finalize_lobby(lobby: dict, all_subs: list, all_players: list) -> dict:
    """Compute rankings, apply feather changes, mark lobby completed."""
    lobby_id = lobby["id"]
    rankings  = _compute_rankings(all_subs, all_players)

    # Update player places
    for uid, place in rankings.items():
        uid_val = uid  # capture for lambda
        place_val = place
        await asyncio.to_thread(
            lambda: supabase.table("compete_lobby_players")
                .update({"place": place_val})
                .eq("lobby_id", lobby_id).eq("user_id", uid_val)
                .execute()
        )

    feather_changes: dict[str, int] = {}
    if lobby["mode"] == "ranked":
        feather_changes = _compute_feather_changes(all_players, rankings)
        for player in all_players:
            uid    = player["user_id"]
            change = feather_changes.get(uid, 0)
            await _update_feathers(uid, player["feathers"], change)

    await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").update({
            "status": "completed",
            "ended_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", lobby_id).execute()
    )

    return {"rankings": rankings, "feather_changes": feather_changes}


# ── Request schemas ──────────────────────────────────────────────────────────

class CreateLobbyRequest(BaseModel):
    mode: str

class JoinLobbyRequest(BaseModel):
    code: str

class SubmitRequest(BaseModel):
    code: str
    language: str
    passed_visible: int
    total_visible: int
    passed_hidden: int
    total_hidden: int
    all_passed: bool


# ── Lobby lifecycle ──────────────────────────────────────────────────────────

@router.post("/lobby/create")
async def create_lobby(req: CreateLobbyRequest, authorization: str | None = Header(default=None)):
    if req.mode not in ("casual", "ranked"):
        raise HTTPException(status_code=400, detail="Invalid mode")

    user     = await user_from_authorization(authorization)
    user_id  = str(user["id"])
    feathers = user.get("feathers") or 100

    # Generate a unique code (retry on collision)
    for _ in range(10):
        code = _generate_code()
        existing = await asyncio.to_thread(
            lambda: supabase.table("compete_lobbies").select("id").eq("code", code).eq("status", "waiting").execute()
        )
        if not existing.data:
            break

    # Create lobby
    lobby_res = await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").insert({
            "code": code,
            "host_id": user_id,
            "mode": req.mode,
        }).execute()
    )
    lobby_id = lobby_res.data[0]["id"]

    # Host joins as first player
    await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players").insert({
            "lobby_id": lobby_id,
            "user_id": user_id,
            "username": user["username"],
            "feathers": feathers,
        }).execute()
    )

    return {"lobby_id": lobby_id, "code": code}


@router.post("/lobby/join")
async def join_lobby(req: JoinLobbyRequest, authorization: str | None = Header(default=None)):
    user     = await user_from_authorization(authorization)
    user_id  = str(user["id"])
    feathers = user.get("feathers") or 100
    code     = req.code.strip()

    result = await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").select("*").eq("code", code).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Lobby not found. Check the code and try again.")

    lobby = result.data[0]

    if lobby["status"] != "waiting":
        raise HTTPException(status_code=400, detail="This game has already started.")

    # Already in lobby?
    already = await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players")
            .select("id").eq("lobby_id", lobby["id"]).eq("user_id", user_id).execute()
    )
    if already.data:
        return {"lobby_id": lobby["id"], "code": lobby["code"]}

    # Check capacity
    count_res = await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players")
            .select("id").eq("lobby_id", lobby["id"]).execute()
    )
    if len(count_res.data) >= lobby["max_players"]:
        raise HTTPException(status_code=400, detail="Lobby is full (max 4 players).")

    await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players").insert({
            "lobby_id": lobby["id"],
            "user_id": user_id,
            "username": user["username"],
            "feathers": feathers,
        }).execute()
    )

    return {"lobby_id": lobby["id"], "code": lobby["code"]}


@router.get("/lobby/{code}")
async def get_lobby(code: str, authorization: str | None = Header(default=None)):
    await user_from_authorization(authorization)  # auth guard

    result = await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").select("*").eq("code", code).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Lobby not found")

    lobby   = result.data[0]
    players = await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players")
            .select("*").eq("lobby_id", lobby["id"]).order("joined_at").execute()
    )
    subs = await asyncio.to_thread(
        lambda: supabase.table("compete_submissions")
            .select("*").eq("lobby_id", lobby["id"]).execute()
    )

    return {"lobby": lobby, "players": players.data, "submissions": subs.data}


@router.post("/lobby/{code}/leave")
async def leave_lobby(code: str, authorization: str | None = Header(default=None)):
    user    = await user_from_authorization(authorization)
    user_id = str(user["id"])

    result = await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").select("*").eq("code", code).execute()
    )
    if not result.data:
        return {"status": "ok"}  # already gone

    lobby = result.data[0]

    await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players")
            .delete().eq("lobby_id", lobby["id"]).eq("user_id", user_id).execute()
    )

    # If host left and not started, transfer or delete
    if lobby["host_id"] == user_id and lobby["status"] == "waiting":
        remaining = await asyncio.to_thread(
            lambda: supabase.table("compete_lobby_players")
                .select("*").eq("lobby_id", lobby["id"]).order("joined_at").execute()
        )
        if remaining.data:
            new_host = remaining.data[0]["user_id"]
            await asyncio.to_thread(
                lambda: supabase.table("compete_lobbies")
                    .update({"host_id": new_host}).eq("id", lobby["id"]).execute()
            )
        else:
            await asyncio.to_thread(
                lambda: supabase.table("compete_lobbies").delete().eq("id", lobby["id"]).execute()
            )

    return {"status": "ok"}


@router.post("/lobby/{code}/start")
async def start_lobby(code: str, authorization: str | None = Header(default=None)):
    user    = await user_from_authorization(authorization)
    user_id = str(user["id"])

    result = await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").select("*").eq("code", code).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Lobby not found")

    lobby = result.data[0]

    if lobby["host_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the host can start the game")
    if lobby["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Game already started")

    players = await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players")
            .select("feathers").eq("lobby_id", lobby["id"]).execute()
    )
    if len(players.data) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 players to start")

    avg_feathers = sum(p["feathers"] for p in players.data) // len(players.data)
    problem_id   = _pick_problem(avg_feathers)

    await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").update({
            "status":     "active",
            "problem_id": problem_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", lobby["id"]).execute()
    )

    return {"status": "ok", "problem_id": problem_id}


# ── In-game submission ────────────────────────────────────────────────────────

@router.post("/lobby/{code}/submit")
async def submit_to_lobby(
    code: str,
    req: SubmitRequest,
    authorization: str | None = Header(default=None),
):
    user    = await user_from_authorization(authorization)
    user_id = str(user["id"])

    result = await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").select("*").eq("code", code).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Lobby not found")

    lobby = result.data[0]

    if lobby["status"] == "completed":
        return {"status": "completed"}
    if lobby["status"] != "active":
        raise HTTPException(status_code=400, detail="Game not active")

    # Upsert this player's submission
    existing = await asyncio.to_thread(
        lambda: supabase.table("compete_submissions").select("id")
            .eq("lobby_id", lobby["id"]).eq("user_id", user_id).execute()
    )
    sub_payload = {
        "lobby_id":      lobby["id"],
        "user_id":       user_id,
        "code":          req.code,
        "language":      req.language,
        "passed_visible": req.passed_visible,
        "total_visible":  req.total_visible,
        "passed_hidden":  req.passed_hidden,
        "total_hidden":   req.total_hidden,
        "all_passed":     req.all_passed,
        "submitted_at":  datetime.now(timezone.utc).isoformat(),
    }
    if existing.data:
        await asyncio.to_thread(
            lambda: supabase.table("compete_submissions")
                .update(sub_payload).eq("id", existing.data[0]["id"]).execute()
        )
    else:
        await asyncio.to_thread(
            lambda: supabase.table("compete_submissions").insert(sub_payload).execute()
        )

    # Instant-win check: first player to pass ALL tests wins
    if req.all_passed:
        all_subs = await asyncio.to_thread(
            lambda: supabase.table("compete_submissions")
                .select("*").eq("lobby_id", lobby["id"]).execute()
        )
        winners = [s for s in all_subs.data if s["all_passed"]]

        # Only finalize on the very first winner
        if len(winners) == 1 and winners[0]["user_id"] == user_id:
            all_players = await asyncio.to_thread(
                lambda: supabase.table("compete_lobby_players")
                    .select("*").eq("lobby_id", lobby["id"]).execute()
            )
            final = await _finalize_lobby(lobby, all_subs.data, all_players.data)

            my_player      = next((p for p in all_players.data if p["user_id"] == user_id), None)
            my_feathers    = (my_player["feathers"] if my_player else 100)
            feather_change = final["feather_changes"].get(user_id, 0)
            new_feathers   = max(0, my_feathers + feather_change)

            return {
                "status":         "winner",
                "place":          1,
                "feather_change": feather_change,
                "new_feathers":   new_feathers,
            }

    return {"status": "ok"}


@router.post("/lobby/{code}/end")
async def end_lobby(code: str, authorization: str | None = Header(default=None)):
    """Called when time runs out on any player's client."""
    user    = await user_from_authorization(authorization)
    user_id = str(user["id"])

    result = await asyncio.to_thread(
        lambda: supabase.table("compete_lobbies").select("*").eq("code", code).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Lobby not found")

    lobby = result.data[0]

    all_players = await asyncio.to_thread(
        lambda: supabase.table("compete_lobby_players")
            .select("*").eq("lobby_id", lobby["id"]).execute()
    )
    all_subs = await asyncio.to_thread(
        lambda: supabase.table("compete_submissions")
            .select("*").eq("lobby_id", lobby["id"]).execute()
    )

    if lobby["status"] == "completed":
        # Already finalized — return current state
        rankings = _compute_rankings(all_subs.data, all_players.data)
        my_sub   = next((s for s in all_subs.data if s["user_id"] == user_id), None)
        return {
            "lobby":           lobby,
            "players":         all_players.data,
            "submissions":     all_subs.data,
            "rankings":        rankings,
            "feather_changes": {},
            "my_passed":       ((my_sub["passed_visible"] + my_sub["passed_hidden"]) if my_sub else 0),
        }

    final = await _finalize_lobby(lobby, all_subs.data, all_players.data)

    # Re-fetch fresh players (with updated feathers)
    my_sub = next((s for s in all_subs.data if s["user_id"] == user_id), None)
    return {
        "lobby":           lobby,
        "players":         all_players.data,
        "submissions":     all_subs.data,
        "rankings":        final["rankings"],
        "feather_changes": final["feather_changes"],
        "my_passed":       ((my_sub["passed_visible"] + my_sub["passed_hidden"]) if my_sub else 0),
    }
