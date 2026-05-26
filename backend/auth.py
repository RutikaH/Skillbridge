import urllib.parse
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from config import (
    FRONTEND_URL,
    GOOGLE_AUTH_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_TOKEN_URI,
    GOOGLE_USERINFO_URI,
)
from database import get_db
from jwt_utils import (
    create_access_token,
    create_password_hash,
    verify_password,
    get_current_user,
)
from models import User
from schemas import ForgotPasswordRequest, Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=create_password_hash(payload.password),
        provider="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "access_token": create_access_token(user.email),
        "token_type": "bearer",
    }


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    return {
        "access_token": create_access_token(user.email),
        "token_type": "bearer",
    }


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if user:
        # In a production deployment, send a secure password reset email here.
        pass

    return {"message": "If that account exists, password recovery instructions have been sent."}


@router.get("/me", response_model=UserResponse)
def current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


@router.get("/google/login")
def google_login():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    url = f"{GOOGLE_AUTH_URI}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(code: Optional[str] = Query(None), error: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code")

    token_response = httpx.post(
        GOOGLE_TOKEN_URI,
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    if token_response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to fetch Google token")

    token_data = token_response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid Google token response")

    user_response = httpx.get(
        GOOGLE_USERINFO_URI,
        params={"alt": "json"},
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if user_response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to fetch Google user profile")

    profile = user_response.json()
    email = profile.get("email")
    google_id = profile.get("id")
    name = profile.get("name") or profile.get("given_name") or "Google User"
    avatar = profile.get("picture")

    if not email or not google_id:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Google profile missing required fields")

    user = db.query(User).filter((User.google_id == google_id) | (User.email == email.lower())).first()
    if not user:
        user = User(
            name=name,
            email=email.lower(),
            provider="google",
            google_id=google_id,
            avatar=avatar,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.google_id = google_id
        user.avatar = avatar or user.avatar
        user.provider = "google"
        db.commit()

    token = create_access_token(user.email)
    redirect_url = f"{FRONTEND_URL}/oauth-success?token={urllib.parse.quote(token)}"
    return RedirectResponse(redirect_url)
