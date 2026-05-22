from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth import AuthError, AuthService
from app.utils.db import get_db
from app.utils.jwt import get_current_user

from .schemas import (
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

"""
Auth Routes
===========
POST   /auth/register          - Register new user
POST   /auth/login             - Login, receive JWT pair
POST   /auth/logout            - Invalidate tokens
POST   /auth/refresh           - Rotate refresh token
POST   /auth/password-reset    - Request password reset email
POST   /auth/password-reset/{token} - Confirm password reset
GET    /auth/me                - Get current user
"""

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


def _handle_auth_error(exc: AuthError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.message)

# ── POST /auth/register ───────────────────────
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    body: RegisterRequest,
    svc: AuthService = Depends(get_auth_service),
):
    try:
        user = await svc.register(
            email=body.email,
            username=body.username,
            password=body.password,
            role=body.role,
        )
    except AuthError as exc:
        _handle_auth_error(exc)

    return UserResponse.model_validate(user)


# ── POST /auth/login ──────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive JWT tokens",
)
async def login(
    body: LoginRequest,
    svc: AuthService = Depends(get_auth_service),
):
    try:
        result = await svc.login(email=body.email, password=body.password)
    except AuthError as exc:
        _handle_auth_error(exc)

    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user=UserResponse.model_validate(result["user"]),
    )


# ── POST /auth/logout ─────────────────────────
@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Invalidate the current session",
)
async def logout(
    request: Request,
    body: RefreshRequest | None = None,
    svc: AuthService = Depends(get_auth_service),
    current_user=Depends(get_current_user),
):
    raw_token = _extract_bearer(request)
    refresh = body.refresh_token if body else None

    await svc.logout(access_token=raw_token, refresh_token=refresh)
    return MessageResponse(message="Logged out successfully")


# ── POST /auth/refresh ────────────────────────
@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and get a new access token",
)
async def refresh_token(
    body: RefreshRequest,
    svc: AuthService = Depends(get_auth_service),
):
    try:
        result = await svc.refresh(body.refresh_token)
    except AuthError as exc:
        _handle_auth_error(exc)

    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user=UserResponse.model_validate(result["user"]),
    )


# ── POST /auth/password-reset ─────────────────
@router.post(
    "/password-reset",
    response_model=MessageResponse,
    summary="Request a password reset email",
)
async def request_password_reset(
    body: PasswordResetRequest,
    svc: AuthService = Depends(get_auth_service),
):
    token = await svc.request_password_reset(body.email)

    if token:
        # TODO: enqueue email task
        # send_password_reset_email.delay(body.email, token)
        pass

    return MessageResponse(
        message="If that email exists, a reset link has been sent."
    )


# ── POST /auth/password-reset/{token} ────────
@router.post(
    "/password-reset/{token}",
    response_model=MessageResponse,
    summary="Confirm password reset with token",
)
async def confirm_password_reset(
    token: str,
    body: PasswordResetConfirmRequest,
    svc: AuthService = Depends(get_auth_service),
):
    try:
        await svc.confirm_password_reset(token=token, new_password=body.new_password)
    except AuthError as exc:
        _handle_auth_error(exc)

    return MessageResponse(message="Password reset successfully. Please log in.")


# ── GET /auth/me ──────────────────────────────
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user",
)
async def get_me(
    current_user=Depends(get_current_user),
):
    return UserResponse.model_validate(current_user)


# ── Private helper ────────────────────────────
def _extract_bearer(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    return auth_header[len("Bearer "):]