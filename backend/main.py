from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from agent import SkillBridgeAgent

app = FastAPI(title="SkillBridge AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = SkillBridgeAgent()


class ChatRequest(BaseModel):
    session_id: str
    message: str
    language: str = "English"


@app.post("/start")
def start_session():
    """Create a new session and return the opening message."""
    session_id = str(uuid.uuid4())
    message = agent.start_session(session_id)
    agent.sessions[session_id]["language"] = language="English"
    return {"session_id": session_id, "message": message}


@app.post("/chat")
def chat(req: ChatRequest):
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
