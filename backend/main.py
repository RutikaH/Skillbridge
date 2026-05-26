from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

from agent import SkillBridgeAgent
from auth import router as auth_router
from database import Base, engine
from jwt_utils import get_current_user
from models import User

app = FastAPI(title="SkillBridge AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
agent = SkillBridgeAgent()


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
    return {"status": "ok"}


app.include_router(auth_router)
