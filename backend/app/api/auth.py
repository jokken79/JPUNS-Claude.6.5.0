"""
Authentication API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, UserRole
from app.schemas.auth import (
    UserLogin, UserRegister, Token, UserResponse,
    UserUpdate, PasswordChange, RefreshTokenRequest, LogoutRequest,
    UserAdminUpdate, PasswordReset
)
from app.services.auth_service import AuthService, auth_service
from app.core.response import (
    success_response, paginated_response,
    created_response, no_content_response
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register")
@limiter.limit("3/hour")
async def register(
    request: Request,
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register new user

    Rate limit: 3 registrations per hour per IP address.
    """
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    hashed_password = auth_service.get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return created_response(
        data={"id": new_user.id, "username": new_user.username, "email": new_user.email},
        request=request,
        location=f"/api/auth/users/{new_user.id}"
    )


@router.post("")
@router.post("/login")
@router.post("/login/")
@limiter.limit("5/minute")  # Limit to 5 login attempts per minute (brute force protection)
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with username and password

    Returns both access_token and refresh_token.
    Tokens are also set as HttpOnly cookies for browser security.

    Rate Limited: 10 attempts per minute per IP address
    """
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    # Create refresh token
    user_agent = request.headers.get("user-agent")
    client_host = request.client.host if request.client else None
    refresh_token = auth_service.create_refresh_token(
        db=db,
        user=user,
        user_agent=user_agent,
        ip_address=client_host
    )

    # Set HttpOnly cookies for browser clients
    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        httponly=settings.COOKIE_HTTPONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN
    )

    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # Convert to seconds
        httponly=settings.COOKIE_HTTPONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN
    )

    # Also return tokens in response body for API clients (like Postman, mobile apps)
    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        },
        request=request,
        status_code=200
    )


@router.post("/refresh")
@limiter.limit("10/minute")  # Allow 10 refresh attempts per minute
async def refresh_token(
    request: Request,
    response: Response,
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token

    Returns new access_token and refresh_token (token rotation).
    The old refresh_token is revoked automatically.
    New tokens are set as HttpOnly cookies.

    Rate Limited: 10 attempts per minute per IP address
    """
    # Try to get refresh token from cookie if not provided in body
    token_to_refresh = refresh_data.refresh_token or request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)

    if not token_to_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )

    # Verify the refresh token
    user = auth_service.verify_refresh_token(db, token_to_refresh)

    # Revoke the old refresh token (token rotation)
    auth_service.revoke_refresh_token(db, token_to_refresh)

    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    # Create new refresh token (rotation)
    user_agent = request.headers.get("user-agent")
    client_host = request.client.host if request.client else None
    new_refresh_token = auth_service.create_refresh_token(
        db=db,
        user=user,
        user_agent=user_agent,
        ip_address=client_host
    )

    # Set HttpOnly cookies for browser clients
    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=settings.COOKIE_HTTPONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN
    )

    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=new_refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=settings.COOKIE_HTTPONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN
    )

    # Also return tokens in response body for API clients
    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        },
        request=request,
        status_code=200
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    logout_data: LogoutRequest,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Logout user by revoking refresh token(s) and clearing cookies

    Options:
    - logout_all_devices=false: Revokes only the provided refresh_token
    - logout_all_devices=true: Revokes ALL refresh tokens for this user (logout from all devices)

    Clears HttpOnly cookies for browser clients.
    """
    # Get refresh token from request body or cookie
    refresh_token = logout_data.refresh_token or request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)

    if logout_data.logout_all_devices:
        # Revoke all refresh tokens for this user
        auth_service.revoke_all_user_tokens(db, current_user.id)
        message = "Logged out from all devices successfully"
    else:
        # Revoke only this refresh token
        if refresh_token:
            revoked = auth_service.revoke_refresh_token(db, refresh_token)
            if not revoked:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Refresh token not found"
                )
        message = "Logged out successfully"

    # Clear HttpOnly cookies
    response.delete_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        domain=settings.COOKIE_DOMAIN
    )
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        domain=settings.COOKIE_DOMAIN
    )

    return success_response(data={"message": message}, request=request, status_code=200)


@router.get("/me")
async def get_current_user(
    request: Request,
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Get current logged in user
    """
    return success_response(data=current_user, request=request, status_code=200)


@router.put("/me")
async def update_current_user(
    request: Request,
    user_update: UserUpdate,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information
    """
    if user_update.email:
        # Check if email already exists
        existing = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_update.email

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.password:
        current_user.password_hash = auth_service.get_password_hash(user_update.password)

    db.commit()
    db.refresh(current_user)

    return success_response(data=current_user, request=request, status_code=200)


@router.post("/change-password")
async def change_password(
    request: Request,
    password_data: PasswordChange,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Verify old password
    if not auth_service.verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    # Update password
    current_user.password_hash = auth_service.get_password_hash(password_data.new_password)
    db.commit()

    return success_response(data={"message": "Password changed successfully"}, request=request, status_code=200)


@router.get("/users")
async def list_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    List all users (Admin only)
    """
    total = db.query(User).count()
    users = db.query(User).offset(skip).limit(limit).all()
    page = (skip // limit) + 1 if limit > 0 else 1
    return paginated_response(
        items=users,
        total=total,
        page=page,
        per_page=limit,
        request=request
    )


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Get user by ID (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return success_response(data=user, request=request, status_code=200)


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    request: Request,
    user_update: UserAdminUpdate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Update user (Admin only)

    Allows updating username, email, full_name, role, and is_active status.
    Password updates should use the reset-password endpoint.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if updating username and it already exists
    if user_update.username and user_update.username != user.username:
        existing = db.query(User).filter(
            User.username == user_update.username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use"
            )
        user.username = user_update.username

    # Check if updating email and it already exists
    if user_update.email and user_update.email != user.email:
        existing = db.query(User).filter(
            User.email == user_update.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        user.email = user_update.email

    # Update other fields
    if user_update.full_name is not None:
        user.full_name = user_update.full_name

    if user_update.role is not None:
        # Prevent downgrading own role below admin
        if user.id == current_user.id:
            if user_update.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot downgrade your own role below ADMIN"
                )
        user.role = user_update.role

    if user_update.is_active is not None:
        # Prevent deactivating yourself
        if user.id == current_user.id and not user_update.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )
        user.is_active = user_update.is_active

    db.commit()
    db.refresh(user)

    return success_response(data=user, request=request, status_code=200)


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    request: Request,
    password_data: PasswordReset,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Reset user password (Admin only)

    Allows administrators to reset any user's password without knowing the old password.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update password
    user.password_hash = auth_service.get_password_hash(password_data.new_password)
    db.commit()

    return success_response(
        data={"message": f"Password reset successfully for user {user.username}"},
        request=request,
        status_code=200
    )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(auth_service.require_role("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Delete user (Super Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )

    db.delete(user)
    db.commit()

    return success_response(data={"message": "User deleted successfully"}, request=request, status_code=200)
