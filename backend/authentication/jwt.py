from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.utils.db import get_db

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate the Bearer token and return the authenticated User.
    Raises 401 if the token is missing, invalid, expired, or blacklisted.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.services.auth import AuthService

    svc = AuthService(db)
    user = await svc.validate_access_token(credentials.credentials)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_role(*roles: str):
    """
    Dependency factory. Wraps get_current_user and additionally enforces role.

    Example:
        @router.delete("/classes/{id}")
        async def delete_class(user = Depends(require_role("teacher", "admin"))):
            ...
    """
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to: {', '.join(roles)}",
            )
        return user

    return _check


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Like get_current_user but returns None instead of raising 401.
    Useful for endpoints that behave differently for authed vs anon users.
    """
    if credentials is None:
        return None

    async def _resolve() -> User | None:
        from app.services.auth import AuthService
        svc = AuthService(db)
        return await svc.validate_access_token(credentials.credentials)

    return _resolve