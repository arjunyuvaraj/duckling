import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.utils.redis import get_redis

# Constants (pull from config in real app)
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = timedelta(minutes=15)
REFRESH_TOKEN_TTL = timedelta(days=7)
RESET_TOKEN_TTL = timedelta(hours=1)

# Redis key prefixes
_REFRESH_PREFIX = "auth:refresh:"
_RESET_PREFIX   = "auth:reset:"
_BLACKLIST_PREFIX = "auth:blacklist:"

# Internal helpers
def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _make_access_token(user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + ACCESS_TOKEN_TTL,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _make_refresh_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + REFRESH_TOKEN_TTL,
        "type": "refresh",
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def _store_refresh_token(user_id: int, token: str) -> None:
    """Persist refresh token in Redis so we can invalidate it on logout."""
    redis = await get_redis()
    key = f"{_REFRESH_PREFIX}{user_id}:{_decode_jti(token)}"
    await redis.setex(key, int(REFRESH_TOKEN_TTL.total_seconds()), "1")


async def _revoke_refresh_token(token: str) -> None:
    payload = _decode_token(token, expected_type="refresh")
    if not payload:
        return
    redis = await get_redis()
    key = f"{_REFRESH_PREFIX}{payload['sub']}:{payload['jti']}"
    await redis.delete(key)


async def _refresh_token_valid(token: str) -> bool:
    payload = _decode_token(token, expected_type="refresh")
    if not payload:
        return False
    redis = await get_redis()
    key = f"{_REFRESH_PREFIX}{payload['sub']}:{payload['jti']}"
    return bool(await redis.exists(key))


async def _blacklist_access_token(token: str) -> None:
    """Add an access token to the deny-list until it naturally expires."""
    payload = _decode_token(token, expected_type="access")
    if not payload:
        return
    redis = await get_redis()
    exp: datetime = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    ttl = max(0, int((exp - datetime.now(timezone.utc)).total_seconds()))
    if ttl:
        key = f"{_BLACKLIST_PREFIX}{token}"
        await redis.setex(key, ttl, "1")


async def _access_token_blacklisted(token: str) -> bool:
    redis = await get_redis()
    return bool(await redis.exists(f"{_BLACKLIST_PREFIX}{token}"))


def _decode_token(token: str, expected_type: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != expected_type:
            return None
        return payload
    except JWTError:
        return None


def _decode_jti(token: str) -> str:
    """Extract jti without full validation (token already validated by caller)."""
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return payload["jti"]


# AuthService
class AuthError(Exception):
    """Raised for expected auth failures; routes convert to HTTP responses."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Registration ──────────────────────────
    async def register(
        self,
        email: str,
        username: str,
        password: str,
        role: str = "student",
    ) -> User:
        """
        Create a new user account.

        Raises AuthError on:
          - duplicate email
          - duplicate username
        """
        # Duplicate email check
        if await self._find_by_email(email):
            raise AuthError("Email is already registered", status_code=409)

        # Duplicate username check
        if await self._find_by_username(username):
            raise AuthError("Username is already taken", status_code=409)

        user = User(
            email=email.lower().strip(),
            username=username.strip(),
            password_hash=_hash_password(password),
            role=role,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    # ── Login ─────────────────────────────────
    async def login(self, email: str, password: str) -> dict:
        """
        Authenticate a user and return access + refresh tokens.

        Raises AuthError on:
          - unknown email
          - soft-deleted account
          - wrong password
        """
        user = await self._find_by_email(email)
        if not user:
            raise AuthError("Invalid email or password", status_code=401)

        if user.deleted_at is not None:
            raise AuthError("Account has been deactivated", status_code=403)

        if not _verify_password(password, user.password_hash):
            raise AuthError("Invalid email or password", status_code=401)

        return await self._issue_tokens(user)

    # ── Logout ────────────────────────────────
    async def logout(self, access_token: str, refresh_token: Optional[str] = None) -> None:
        """
        Invalidate the session.
          - Blacklists the access token until its natural expiry.
          - Deletes the refresh token from Redis.
        """
        await _blacklist_access_token(access_token)
        if refresh_token:
            await _revoke_refresh_token(refresh_token)

    # ── Token refresh ─────────────────────────
    async def refresh(self, refresh_token: str) -> dict:
        """
        Exchange a valid refresh token for a new access + refresh token pair.
        Old refresh token is invalidated (rotation).

        Raises AuthError on invalid/expired/already-used token.
        """
        if not await _refresh_token_valid(refresh_token):
            raise AuthError("Invalid or expired refresh token", status_code=401)

        payload = _decode_token(refresh_token, expected_type="refresh")
        if not payload:
            raise AuthError("Invalid refresh token", status_code=401)

        user = await self._find_by_id(int(payload["sub"]))
        if not user or user.deleted_at is not None:
            raise AuthError("User not found or deactivated", status_code=401)

        await _revoke_refresh_token(refresh_token)
        return await self._issue_tokens(user)

    # ── Password reset ────────────────────────
    async def request_password_reset(self, email: str) -> Optional[str]:
        """
        Generate a one-time password-reset token and store it in Redis.

        Returns the raw token so the caller can include it in a reset email.
        Returns None if the email is not found (silent; don't leak existence).
        """
        user = await self._find_by_email(email)
        if not user or user.deleted_at is not None:
            return None

        token = secrets.token_urlsafe(32)
        redis = await get_redis()
        key = f"{_RESET_PREFIX}{token}"
        # Store user ID; delete on use
        await redis.setex(key, int(RESET_TOKEN_TTL.total_seconds()), str(user.id))
        return token

    async def confirm_password_reset(self, token: str, new_password: str) -> User:
        """
        Consume a reset token and update the user's password.

        Raises AuthError on invalid/expired token.
        """
        redis = await get_redis()
        key = f"{_RESET_PREFIX}{token}"
        user_id_bytes = await redis.get(key)

        if not user_id_bytes:
            raise AuthError("Reset token is invalid or has expired", status_code=400)

        user_id = int(user_id_bytes)
        user = await self._find_by_id(user_id)
        if not user or user.deleted_at is not None:
            raise AuthError("User not found", status_code=404)

        user.password_hash = _hash_password(new_password)
        user.updated_at = datetime.utcnow()

        # Consume token — can only be used once
        await redis.delete(key)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    # ── Token validation (used by auth middleware) ──

    async def validate_access_token(self, token: str) -> Optional[User]:
        """
        Decode and validate an access token.

        Returns the User if valid, None otherwise.
        Used by the JWT middleware / dependency.
        """
        if await _access_token_blacklisted(token):
            return None

        payload = _decode_token(token, expected_type="access")
        if not payload:
            return None

        user = await self._find_by_id(int(payload["sub"]))
        if not user or user.deleted_at is not None:
            return None

        return user

    # ── Get current user ──────────────────────

    async def get_me(self, user_id: int) -> User:
        user = await self._find_by_id(user_id)
        if not user or user.deleted_at is not None:
            raise AuthError("User not found", status_code=404)
        return user

    # ── Private helpers ───────────────────────

    async def _find_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def _find_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.username == username.strip())
        )
        return result.scalar_one_or_none()

    async def _find_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def _issue_tokens(self, user: User) -> dict:
        access = _make_access_token(user.id, user.role)
        refresh = _make_refresh_token(user.id)
        await _store_refresh_token(user.id, refresh)
        return {
            "access_token": access,
            "refresh_token": refresh,
            "user": user,
        }