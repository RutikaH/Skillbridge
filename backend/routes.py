from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from jwt_utils import get_current_user
from models import (
    User, UserSkill, Skill, AssessmentResult, Activity,
    Badge, Opportunity, UserPreference
)
from schemas import (
    DashboardResponse, ProfileResponse, SkillsDashboardResponse,
    AssessmentTimelineResponse, AssessmentResultResponse,
    ActivityResponse, BadgeResponse, OpportunityResponse,
    UserSkillResponse, UserResponse, PreferencesUpdateRequest,
    ProfileUpdateRequest, OpportunityRecommendRequest
)

router = APIRouter(prefix="/api", tags=["api"])


def _now():
    return datetime.utcnow()


def _get_or_create_skill(db: Session, name: str) -> Skill:
    skill = db.query(Skill).filter(Skill.name.ilike(name)).first()
    if not skill:
        skill = Skill(name=name)
        db.add(skill)
        db.flush()
    return skill


def _ensure_preferences(db: Session, user_id: int):
    prefs = db.query(UserPreference).filter(
        UserPreference.user_id == user_id).first()
    if not prefs:
        prefs = UserPreference(user_id=user_id)
        db.add(prefs)
        db.flush()
    return prefs


def _skill_to_response(user_skill: UserSkill) -> UserSkillResponse:
    return UserSkillResponse(
        id=user_skill.id,
        skill_id=user_skill.skill_id,
        name=user_skill.skill.name,
        verified_score=user_skill.verified_score,
        level=user_skill.level,
        assessment_count=user_skill.assessment_count,
        last_evaluated_date=user_skill.last_evaluated_date,
        verified=user_skill.verified,
    )


# ============================================================
# DASHBOARD
# ============================================================

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_skills = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id
    ).all()

    skills_resp = [_skill_to_response(us) for us in user_skills]

    recent_activities = db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.created_at.desc()).limit(5).all()

    activities_resp = [
        ActivityResponse(
            id=a.id, title=a.title, detail=a.detail,
            activity_type=a.activity_type, created_at=a.created_at
        ) for a in recent_activities
    ]

    opportunities = db.query(Opportunity).filter(
        Opportunity.is_active == True,
        (Opportunity.user_id == None) | (Opportunity.user_id == current_user.id)
    ).order_by(Opportunity.match_pct.desc()).limit(10).all()

    opps_resp = [
        OpportunityResponse(
            id=o.id, title=o.title, company=o.company,
            location=o.location, type=o.type,
            required_skills=o.required_skills or [],
            required_score=o.required_score,
            description=o.description, match_pct=o.match_pct
        ) for o in opportunities
    ]

    badges = db.query(Badge).filter(Badge.user_id == current_user.id).all()
    badges_resp = [
        BadgeResponse(id=b.id, title=b.title, icon=b.icon, tone=b.tone)
        for b in badges
    ]

    assessments_count = db.query(AssessmentResult).filter(
        AssessmentResult.user_id == current_user.id
    ).count()

    verified_count = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.verified == True
    ).count()

    avg_score = 0
    if user_skills:
        avg_score = sum(
            s.verified_score for s in user_skills) // len(user_skills)

    # Calculate dynamic completion metrics
    total_skills_possible = db.query(Skill).count()
    completion_pct = min(100, (len(user_skills) * 100) //
                         max(total_skills_possible, 1)) if total_skills_possible > 0 else 0

    return DashboardResponse(
        user=UserResponse(
            id=current_user.id, name=current_user.name,
            email=current_user.email, provider=current_user.provider,
            avatar=current_user.avatar, created_at=current_user.created_at
        ),
        skills=skills_resp,
        recent_activities=activities_resp,
        top_opportunities=opps_resp,
        badges=badges_resp,
        overall_skill_score=avg_score,
        assessments_completed=assessments_count,
        verified_skills_count=verified_count,
        opportunity_matches=len(opps_resp),
    )


# ============================================================
# SKILLS (with backend filtering)
# ============================================================

@router.get("/skills", response_model=SkillsDashboardResponse)
def get_skills(
    query: Optional[str] = Query(
        None, description="Search by skill name or level"),
    level_filter: Optional[str] = Query(
        None, description="Filter by level: Beginner/Intermediate/Advanced/Expert"),
    verified_only: Optional[bool] = Query(
        None, description="Show only verified skills"),
    sort_by: Optional[str] = Query(
        "score", description="Sort by: score or name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_query = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id
    )

    # Level filter
    if level_filter and level_filter != "All":
        db_query = db_query.filter(UserSkill.level == level_filter)

    # Verified only filter
    if verified_only:
        db_query = db_query.filter(UserSkill.verified == True)

    user_skills = db_query.all()

    skills_resp = [_skill_to_response(us) for us in user_skills]

    # Search filter (post-query for ILIKE on related skill name)
    if query:
        q = query.strip().lower()
        skills_resp = [
            s for s in skills_resp
            if q in s.name.lower() or q in s.level.lower()
        ]

    # Sort
    if sort_by == "name":
        skills_resp.sort(key=lambda s: s.name.lower())
    else:
        skills_resp.sort(key=lambda s: s.verified_score, reverse=True)

    return SkillsDashboardResponse(skills=skills_resp)


@router.post("/skills", response_model=UserSkillResponse)
def add_skill(
    skill_name: str = Query(..., description="Name of the skill to add"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = _get_or_create_skill(db, skill_name)

    existing = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == skill.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Skill already added")

    user_skill = UserSkill(
        user_id=current_user.id,
        skill_id=skill.id,
        verified_score=0,
        level="Beginner",
        assessment_count=0,
        verified=False,
    )
    db.add(user_skill)
    db.commit()
    db.refresh(user_skill)

    activity = Activity(
        user_id=current_user.id,
        title="New skill added",
        detail=f"You added {skill.name} to your skills",
        activity_type="skill_added",
    )
    db.add(activity)
    db.commit()

    return _skill_to_response(user_skill)


@router.put("/skills/{skill_id}/verify", response_model=UserSkillResponse)
def verify_skill(
    skill_id: int,
    verified_score: int = Query(..., ge=0, le=100,
                                description="Verified score 0-100"),
    level: str = Query("Intermediate", description="Skill level"),
    verified: bool = Query(True, description="Verification status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skill = db.query(UserSkill).filter(
        UserSkill.id == skill_id,
        UserSkill.user_id == current_user.id
    ).first()

    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    user_skill.verified_score = verified_score
    user_skill.level = level
    user_skill.verified = verified
    user_skill.assessment_count = (user_skill.assessment_count or 0) + 1
    user_skill.last_evaluated_date = _now()
    db.commit()
    db.refresh(user_skill)

    return _skill_to_response(user_skill)


# ============================================================
# ASSESSMENT RESULTS
# ============================================================

@router.get("/assessments", response_model=AssessmentTimelineResponse)
def get_assessments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = db.query(AssessmentResult).filter(
        AssessmentResult.user_id == current_user.id
    ).order_by(AssessmentResult.created_at.desc()).all()

    results_resp = [
        AssessmentResultResponse(
            id=r.id, assessment_name=r.assessment_name,
            score=r.score, strengths=r.strengths or [],
            improvements=r.improvements or [],
            status=r.status, created_at=r.created_at
        ) for r in results
    ]

    user_skills = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.verified == True
    ).all()

    skills_resp = [_skill_to_response(us) for us in user_skills]

    total = len(results)
    avg_score = sum(r.score for r in results) // max(total,
                                                     1) if total > 0 else 0
    best_score = max((r.score for r in results), default=0)
    verified_count = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.verified == True
    ).count()

    stats = {
        "assessments_completed": total,
        "average_score": avg_score,
        "skills_verified": verified_count,
        "best_score": best_score,
        "total_assessments": total,
        "verified_earned": verified_count,
    }

    current_progress = {
        "current_step": "Ready",
        "completion_pct": min(100, total * 8) if total > 0 else 62,
        "status": "In progress" if total < 5 else "Active",
    }

    recent = results_resp[:5] if len(results_resp) > 5 else results_resp

    return AssessmentTimelineResponse(
        current_progress=current_progress,
        stats=stats,
        recent_results=recent,
        timeline=results_resp[:20],
        skills_earned=skills_resp,
    )


class SaveAssessmentRequest(BaseModel):
    assessment_name: str
    score: int
    skill_name: Optional[str] = None
    strengths: List[str] = []
    improvements: List[str] = []
    status: str = "Verified"


@router.post("/assessments/save", response_model=AssessmentResultResponse)
def save_assessment_result(
    payload: SaveAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment_name = payload.assessment_name
    score = payload.score
    skill_name = payload.skill_name
    strengths = payload.strengths or []
    improvements = payload.improvements or []
    status = payload.status

    if not assessment_name:
        raise HTTPException(
            status_code=400, detail="assessment_name is required")
    if score < 0 or score > 100:
        raise HTTPException(
            status_code=400, detail="score must be between 0 and 100")

    skill_id = None
    if skill_name:
        skill = _get_or_create_skill(db, skill_name)
        skill_id = skill.id

    result = AssessmentResult(
        user_id=current_user.id,
        skill_id=skill_id,
        assessment_name=assessment_name,
        score=score,
        strengths=strengths or [],
        improvements=improvements or [],
        status=status,
    )
    db.add(result)

    # Update or create user skill
    if skill_id:
        user_skill = db.query(UserSkill).filter(
            UserSkill.user_id == current_user.id,
            UserSkill.skill_id == skill_id
        ).first()

        if not user_skill:
            new_level = "Intermediate" if score >= 60 else "Beginner"
            user_skill = UserSkill(
                user_id=current_user.id,
                skill_id=skill_id,
                verified_score=score,
                level=new_level,
                assessment_count=1,
                verified=True,
                last_evaluated_date=_now(),
            )
            db.add(user_skill)
        else:
            user_skill.verified_score = score
            user_skill.assessment_count = (
                user_skill.assessment_count or 0) + 1
            user_skill.verified = True
            user_skill.last_evaluated_date = _now()
            if score >= 80:
                user_skill.level = "Advanced"
            elif score >= 60:
                user_skill.level = "Intermediate"
            else:
                user_skill.level = "Beginner"

    activity = Activity(
        user_id=current_user.id,
        title="Assessment completed",
        detail=f"{assessment_name} — Score: {score}% — {status}",
        activity_type="assessment",
    )
    db.add(activity)

    db.commit()
    db.refresh(result)

    return AssessmentResultResponse(
        id=result.id,
        assessment_name=result.assessment_name,
        score=result.score,
        strengths=result.strengths or [],
        improvements=result.improvements or [],
        status=result.status,
        created_at=result.created_at,
    )


# ============================================================
# ACTIVITIES
# ============================================================

@router.get("/activities", response_model=list[ActivityResponse])
def get_activities(
    limit: int = Query(
        20, ge=1, le=100, description="Number of activities to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.created_at.desc()).limit(limit).all()

    return [
        ActivityResponse(
            id=a.id, title=a.title, detail=a.detail,
            activity_type=a.activity_type, created_at=a.created_at
        ) for a in activities
    ]


# ============================================================
# OPPORTUNITIES (with backend filtering)
# ============================================================

@router.get("/opportunities", response_model=list[OpportunityResponse])
def get_opportunities(
    type_filter: Optional[str] = Query(
        None, description="Filter by type: Internship/Job"),
    location_filter: Optional[str] = Query(
        None, description="Filter by location: Remote/Hybrid/Onsite"),
    min_match: Optional[int] = Query(
        None, ge=0, le=100, description="Minimum match percentage"),
    skill_filter: Optional[str] = Query(
        None, description="Filter by required skill name"),
    search: Optional[str] = Query(
        None, description="Search in title, company, location"),
    sort_by: Optional[str] = Query(
        "match", description="Sort by: match or title"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity).filter(
        Opportunity.is_active == True,
        (Opportunity.user_id == None) | (Opportunity.user_id == current_user.id)
    )

    # Type filter
    if type_filter and type_filter != "All":
        query = query.filter(Opportunity.type == type_filter)

    # Min match filter
    if min_match is not None:
        query = query.filter(Opportunity.match_pct >= min_match)

    opportunities = query.order_by(Opportunity.match_pct.desc()).all()

    # Post-query filters (for JSON array fields and string matching)
    filtered = []
    for op in opportunities:
        # Location filter
        if location_filter and location_filter != "All":
            loc = (op.location or "").lower()
            if location_filter == "Remote" and "remote" not in loc:
                continue
            if location_filter == "Hybrid" and "hybrid" not in loc:
                continue
            if location_filter == "Onsite" and not any(x in loc for x in ["onsite", "on-site", "on site"]):
                continue

        # Skill filter
        if skill_filter and skill_filter != "All":
            skills = [s.lower() for s in (op.required_skills or [])]
            if skill_filter.lower() not in skills:
                continue

        # Text search
        if search:
            text = f"{op.title} {op.company} {op.location} {' '.join(op.required_skills or [])}".lower(
            )
            if search.lower() not in text:
                continue

        filtered.append(op)

    # Sort
    if sort_by == "title":
        filtered.sort(key=lambda o: o.title.lower())
    else:
        filtered.sort(key=lambda o: o.match_pct, reverse=True)

    return [
        OpportunityResponse(
            id=o.id, title=o.title, company=o.company,
            location=o.location, type=o.type,
            required_skills=o.required_skills or [],
            required_score=o.required_score,
            description=o.description, match_pct=o.match_pct
        ) for o in filtered
    ]


# ============================================================
# PROFILE
# ============================================================

@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_skills = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id
    ).all()

    skills_resp = [_skill_to_response(us) for us in user_skills]

    assessments = db.query(AssessmentResult).filter(
        AssessmentResult.user_id == current_user.id
    ).order_by(AssessmentResult.created_at.desc()).all()

    assessments_resp = [
        AssessmentResultResponse(
            id=r.id, assessment_name=r.assessment_name,
            score=r.score, strengths=r.strengths or [],
            improvements=r.improvements or [],
            status=r.status, created_at=r.created_at
        ) for r in assessments
    ]

    badges = db.query(Badge).filter(Badge.user_id == current_user.id).all()
    badges_resp = [
        BadgeResponse(id=b.id, title=b.title, icon=b.icon, tone=b.tone)
        for b in badges
    ]

    prefs = _ensure_preferences(db, current_user.id)

    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.created_at.desc()).limit(10).all()

    activities_resp = [
        ActivityResponse(
            id=a.id, title=a.title, detail=a.detail,
            activity_type=a.activity_type, created_at=a.created_at
        ) for a in activities
    ]

    assessments_count = len(assessments)
    verified_count = len([s for s in user_skills if s.verified])
    avg_score = sum(
        s.verified_score for s in user_skills) // max(len(user_skills), 1) if user_skills else 0

    return ProfileResponse(
        user=UserResponse(
            id=current_user.id, name=current_user.name,
            email=current_user.email, provider=current_user.provider,
            avatar=current_user.avatar, created_at=current_user.created_at
        ),
        skills=skills_resp,
        assessment_history=assessments_resp,
        badges=badges_resp,
        preferences={
            "preferred_language": prefs.preferred_language,
            "preferred_roles": prefs.preferred_roles or [],
            "preferred_work_modes": prefs.preferred_work_modes or [],
            "preferred_industries": prefs.preferred_industries or [],
            "preferred_locations": prefs.preferred_locations or [],
        },
        recent_activities=activities_resp,
        overall_skill_score=avg_score,
        assessments_completed=assessments_count,
        verified_skills_count=verified_count,
        opportunity_matches=db.query(Opportunity).filter(
            Opportunity.is_active == True,
            (Opportunity.user_id == None) | (
                Opportunity.user_id == current_user.id),
        ).count(),
    )


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.name is not None:
        if len(payload.name.strip()) < 2:
            raise HTTPException(
                status_code=400, detail="Name must be at least 2 characters")
        current_user.name = payload.name.strip()
    if payload.avatar is not None:
        current_user.avatar = payload.avatar

    db.commit()
    return get_profile(current_user=current_user, db=db)


@router.get("/profile/preferences")
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = _ensure_preferences(db, current_user.id)
    return {
        "preferred_language": prefs.preferred_language,
        "preferred_roles": prefs.preferred_roles or [],
        "preferred_work_modes": prefs.preferred_work_modes or [],
        "preferred_industries": prefs.preferred_industries or [],
        "preferred_locations": prefs.preferred_locations or [],
    }


@router.put("/profile/preferences")
def update_preferences(
    payload: PreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = _ensure_preferences(db, current_user.id)

    if payload.preferred_language is not None:
        prefs.preferred_language = payload.preferred_language
    if payload.preferred_roles is not None:
        prefs.preferred_roles = payload.preferred_roles
    if payload.preferred_work_modes is not None:
        prefs.preferred_work_modes = payload.preferred_work_modes
    if payload.preferred_industries is not None:
        prefs.preferred_industries = payload.preferred_industries
    if payload.preferred_locations is not None:
        prefs.preferred_locations = payload.preferred_locations

    db.commit()
    return {
        "preferred_language": prefs.preferred_language,
        "preferred_roles": prefs.preferred_roles or [],
        "preferred_work_modes": prefs.preferred_work_modes or [],
        "preferred_industries": prefs.preferred_industries or [],
        "preferred_locations": prefs.preferred_locations or [],
    }


# ============================================================
# BADGES
# ============================================================

@router.post("/opportunities/recommend", response_model=OpportunityResponse)
def save_opportunity_recommendation(
    payload: OpportunityRecommendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a job recommendation from the AI chat as a user-specific opportunity."""
    skill_name = payload.skill_name

    # Build required_skills: start with matched skills, ensure the verified skill is included
    required_skills = list(payload.skills_matched or [])
    if skill_name and skill_name not in required_skills:
        required_skills.insert(0, skill_name)

    # Determine a reasonable required_score based on the user's verified skill score
    required_score = 0
    if skill_name:
        user_skill = db.query(UserSkill).join(Skill).filter(
            UserSkill.user_id == current_user.id,
            Skill.name.ilike(skill_name),
            UserSkill.verified == True,
        ).first()
        if user_skill:
            required_score = max(0, user_skill.verified_score - 10)

    # Compute match_pct from the user's verified skill score
    match_pct = 70  # default
    if skill_name:
        user_skill = db.query(UserSkill).join(Skill).filter(
            UserSkill.user_id == current_user.id,
            Skill.name.ilike(skill_name),
            UserSkill.verified == True,
        ).first()
        if user_skill:
            match_pct = min(99, user_skill.verified_score + 5)

    opp = Opportunity(
        user_id=current_user.id,
        title=payload.role,
        company="Recommended for you",
        location="Based on your skills",
        type="Job",
        required_skills=required_skills,
        required_score=required_score,
        description=payload.reason or f"Recommended based on your verified {skill_name or 'skills'}",
        match_pct=match_pct,
        is_active=True,
    )
    db.add(opp)

    # Log activity
    activity = Activity(
        user_id=current_user.id,
        title="New opportunity recommended",
        detail=f"AI recommended {payload.role} based on your verified skills",
        activity_type="opportunity",
    )
    db.add(activity)
    db.commit()
    db.refresh(opp)

    return OpportunityResponse(
        id=opp.id, title=opp.title, company=opp.company,
        location=opp.location, type=opp.type,
        required_skills=opp.required_skills or [],
        required_score=opp.required_score,
        description=opp.description, match_pct=opp.match_pct,
    )


@router.get("/badges", response_model=list[BadgeResponse])
def get_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    badges = db.query(Badge).filter(Badge.user_id == current_user.id).all()

    if not badges:
        default_badges = [
            Badge(user_id=current_user.id, title="Verified Developer",
                  icon="✅", tone="success"),
            Badge(user_id=current_user.id, title="Fast Learner",
                  icon="⚡", tone="primary"),
            Badge(user_id=current_user.id, title="Assessment Champion",
                  icon="🏆", tone="warning"),
        ]
        for b in default_badges:
            db.add(b)
        db.commit()

        badges = db.query(Badge).filter(Badge.user_id == current_user.id).all()

    return [
        BadgeResponse(id=b.id, title=b.title, icon=b.icon, tone=b.tone)
        for b in badges
    ]
