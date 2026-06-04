from sqlalchemy import Boolean, Column, DateTime, Integer, String, Float, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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

    skills = relationship("UserSkill", back_populates="user",
                          cascade="all, delete-orphan")
    assessment_results = relationship(
        "AssessmentResult", back_populates="user", cascade="all, delete-orphan")
    activities = relationship(
        "Activity", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship(
        "UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"),
                     nullable=False, unique=True)
    preferred_language = Column(String(length=32), default="English")
    preferred_roles = Column(JSON, default=list)
    preferred_work_modes = Column(JSON, default=list)
    preferred_industries = Column(JSON, default=list)
    preferred_locations = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="preferences")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(length=128), unique=True, nullable=False, index=True)
    category = Column(String(length=64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_skills = relationship("UserSkill", back_populates="skill")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    verified_score = Column(Integer, default=0)
    level = Column(String(length=32), default="Beginner")
    assessment_count = Column(Integer, default=0)
    last_evaluated_date = Column(DateTime(timezone=True), nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="user_skills")


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    session_id = Column(String(length=256), nullable=True)
    assessment_name = Column(String(length=256), nullable=True)
    score = Column(Integer, default=0)
    strengths = Column(JSON, default=list)
    improvements = Column(JSON, default=list)
    status = Column(String(length=32), default="In review")
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="assessment_results")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(length=256), nullable=False)
    detail = Column(String(length=512), nullable=True)
    activity_type = Column(String(length=64), default="general")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activities")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(length=256), nullable=False)
    icon = Column(String(length=16), default="✅")
    tone = Column(String(length=32), default="success")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id"), nullable=True, index=True)
    title = Column(String(length=256), nullable=False)
    company = Column(String(length=128), nullable=False)
    location = Column(String(length=128), nullable=True)
    type = Column(String(length=32), default="Internship")
    required_skills = Column(JSON, default=list)
    required_score = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    match_pct = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
