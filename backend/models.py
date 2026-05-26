from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(length=128), nullable=False)
    email = Column(String(length=256), unique=True, index=True, nullable=False)
    password_hash = Column(String(length=256), nullable=True)
    provider = Column(String(length=32), nullable=False, default="local")
    google_id = Column(String(length=256), nullable=True, index=True)
    avatar = Column(String(length=512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
