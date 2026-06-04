import sys
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

from agent import SkillBridgeAgent
from auth import router as auth_router
from routes import router as api_router
from config import CORS_ORIGINS, JWT_SECRET_KEY
from database import Base, engine, get_db
from jwt_utils import get_current_user
from llm_router import get_provider_info
from models import User, Skill, Opportunity

if not JWT_SECRET_KEY:
    print("FATAL: JWT_SECRET_KEY environment variable is not set. Refusing to start.", file=sys.stderr)
    sys.exit(1)

app = FastAPI(title="SkillBridge AI", version="1.0.0")

if not CORS_ORIGINS:
    print("WARNING: CORS_ORIGINS is not set. CORS requests will be blocked.", file=sys.stderr)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
agent = SkillBridgeAgent()


def seed_default_data():
    """Seed the database with default skills and opportunities."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        # Seed default skills if none exist
        if db.query(Skill).count() == 0:
            default_skills = [
                "Python", "JavaScript", "TypeScript", "React", "Node.js",
                "SQL", "HTML/CSS", "Data Analysis", "Machine Learning",
                "Git/GitHub", "Problem Solving", "UI/UX", "FastAPI",
                "Django", "Flask", "C++", "Java", "Go", "Rust",
                "AWS", "Docker", "Kubernetes", "State Management",
                "APIs", "Testing", "Communication", "Attention to Detail",
                "Data Structures", "Prototyping", "Business Analysis",
            ]
            for name in default_skills:
                db.add(Skill(name=name))
            db.commit()

        # Seed default opportunities if none exist
        if db.query(Opportunity).count() == 0:
            default_opps = [
                Opportunity(
                    title="Frontend Developer Intern", company="NovaWorks",
                    location="Bengaluru", type="Internship",
                    required_skills=["React", "JavaScript", "HTML/CSS"],
                    required_score=60, match_pct=86,
                    description="Build accessible, high-performance UI components. Collaborate with design and engineering to ship features weekly."
                ),
                Opportunity(
                    title="React Developer Intern", company="PulseStack",
                    location="Remote", type="Internship",
                    required_skills=[
                        "React", "TypeScript", "State Management"],
                    required_score=62, match_pct=82,
                    description="Work on dashboards and forms, implement reusable components, and improve app performance with profiling-driven work."
                ),
                Opportunity(
                    title="Full Stack Developer Intern", company="KiteCloud",
                    location="Hyderabad", type="Internship",
                    required_skills=["JavaScript", "SQL", "Node.js"],
                    required_score=65, match_pct=79,
                    description="Ship end-to-end features with REST APIs, validate inputs, and write tests for critical flows."
                ),
                Opportunity(
                    title="Python Backend Intern", company="DataForge Labs",
                    location="Remote", type="Internship",
                    required_skills=["Python", "FastAPI", "APIs"],
                    required_score=64, match_pct=84,
                    description="Develop backend endpoints, design schemas, and improve evaluation pipelines. Focus on correctness and maintainability."
                ),
                Opportunity(
                    title="Data Analyst (Entry Level)", company="Pulse Analytics",
                    location="Remote", type="Job",
                    required_skills=["SQL", "Data Analysis", "Python"],
                    required_score=58, match_pct=77,
                    description="Create actionable insights from product and operational data. Build repeatable reports and dashboards."
                ),
                Opportunity(
                    title="AI/ML Intern", company="AstraMind",
                    location="Chennai", type="Internship",
                    required_skills=["Machine Learning",
                                     "Python", "Problem Solving"],
                    required_score=70, match_pct=81,
                    description="Prototype lightweight ML features, evaluate model performance, and assist in experimentation with real-world datasets."
                ),
                Opportunity(
                    title="UI/UX Design Intern", company="DesignSpring",
                    location="Hybrid (Bengaluru)", type="Internship",
                    required_skills=["UI/UX", "Prototyping", "Communication"],
                    required_score=55, match_pct=75,
                    description="Design flows and prototypes, run quick usability tests, and collaborate with engineers to implement polished experiences."
                ),
                Opportunity(
                    title="Junior Software Engineer", company="ByteHarbor",
                    location="Remote", type="Job",
                    required_skills=["JavaScript",
                                     "Data Structures", "Git/GitHub"],
                    required_score=60, match_pct=78,
                    description="Assist with feature development, code reviews, and production debugging. Learn strong engineering practices from day one."
                ),
                Opportunity(
                    title="Business Analyst Intern", company="LedgerWise",
                    location="Hybrid (Delhi)", type="Internship",
                    required_skills=["Business Analysis",
                                     "Communication", "Data Analysis"],
                    required_score=52, match_pct=74,
                    description="Gather requirements, map user journeys, and translate needs into actionable plans with analytics-backed decisions."
                ),
            ]
            for opp in default_opps:
                db.add(opp)
            db.commit()

        print("Database seeded with default data successfully.")
    except Exception as e:
        print(f"Seed error (non-fatal): {e}")
    finally:
        db.close()


# Seed data on startup
seed_default_data()


class ChatRequest(BaseModel):
    session_id: str
    message: str
    language: str = "English"


@app.post("/start")
def start_session(language: str = "English", current_user: User = Depends(get_current_user)):
    """Create a new session and return the opening message."""
    session_id = str(uuid.uuid4())
    message = agent.start_session(session_id)
    agent.sessions[session_id]["language"] = language
    return {"session_id": session_id, "message": message}


@app.post("/chat")
def chat(req: ChatRequest, current_user: User = Depends(get_current_user)):
    """Send a message and receive a response from SkillBridge AI."""
    try:
        if req.session_id in agent.sessions:
            agent.sessions[req.session_id]["language"] = req.language
        result = agent.chat(req.session_id, req.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    """Liveness probe.

    Includes the currently active LLM provider so operators / monitoring
    tools can confirm at runtime whether the service is running in
    OpenAI-primary, Groq-only, OpenAI+Groq, or no-provider mode.
    """
    return {
        "status": "ok",
        "llm": get_provider_info(),
    }


app.include_router(auth_router)
app.include_router(api_router)
