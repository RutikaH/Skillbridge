from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    provider: str
    avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserSkillResponse(BaseModel):
    id: int
    skill_id: int
    name: str
    verified_score: int
    level: str
    assessment_count: int
    last_evaluated_date: Optional[datetime] = None
    verified: bool

    class Config:
        from_attributes = True


class AssessmentResultResponse(BaseModel):
    id: int
    assessment_name: Optional[str] = None
    score: int
    strengths: List[str] = []
    improvements: List[str] = []
    status: str = "In review"
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityResponse(BaseModel):
    id: int
    title: str
    detail: Optional[str] = None
    activity_type: str = "general"
    created_at: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: int
    title: str
    icon: str = "✅"
    tone: str = "success"

    class Config:
        from_attributes = True


class OpportunityResponse(BaseModel):
    id: int
    title: str
    company: str
    location: Optional[str] = None
    type: str = "Internship"
    required_skills: List[str] = []
    required_score: int = 0
    description: Optional[str] = None
    match_pct: int = 0

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    user: UserResponse
    skills: List[UserSkillResponse] = []
    recent_activities: List[ActivityResponse] = []
    top_opportunities: List[OpportunityResponse] = []
    badges: List[BadgeResponse] = []
    overall_skill_score: int = 0
    assessments_completed: int = 0
    verified_skills_count: int = 0
    opportunity_matches: int = 0


class ProfileResponse(BaseModel):
    user: UserResponse
    skills: List[UserSkillResponse] = []
    assessment_history: List[AssessmentResultResponse] = []
    badges: List[BadgeResponse] = []
    preferences: Optional[Dict[str, Any]] = None
    recent_activities: List[ActivityResponse] = []
    overall_skill_score: int = 0
    assessments_completed: int = 0
    verified_skills_count: int = 0
    opportunity_matches: int = 0


class SkillsDashboardResponse(BaseModel):
    skills: List[UserSkillResponse] = []


class AssessmentTimelineResponse(BaseModel):
    current_progress: Dict[str, Any] = {}
    stats: Dict[str, int] = {}
    recent_results: List[AssessmentResultResponse] = []
    timeline: List[AssessmentResultResponse] = []
    skills_earned: List[UserSkillResponse] = []


class PreferencesUpdateRequest(BaseModel):
    preferred_language: Optional[str] = None
    preferred_roles: Optional[List[str]] = None
    preferred_work_modes: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None


class OpportunityRecommendRequest(BaseModel):
    role: str
    reason: Optional[str] = None
    skills_matched: List[str] = []
    search_link: Optional[str] = None
    skill_name: Optional[str] = None
