# SkillBridge AI

> **Hackathon demo** — zero to job-ready in under 4 minutes.  
> No resume needed. Just show up and type.

## What it does

A single AI agent (Gemini 1.5 Flash) guides a user through a strict 7-step flow:

| Step | What happens |
|------|-------------|
| 1 | 3 onboarding questions (opportunity, skills, language) |
| 2 | One practical skill test task |
| 3 | JSON evaluation with score + feedback |
| 4 | 2 tailored beginner projects |
| 5 | Guided build of Step 1 |
| 6 | Show-your-work summary |
| 7 | Job/internship matches |

## Tech stack

- **Frontend** — React 18 + Vite (chat UI)
- **Backend** — FastAPI + Python
- **AI** — Gemini-2.0-flash-lite (`google-generativeai`)

## Setup

### 1. Clone & get a Gemini API key

Get a free key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY

uvicorn main:app --reload
# Runs on http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) — done.

## Project structure

```
SkillBridge/
├── backend/
│   ├── agent.py          # SkillBridge AI agent (Gemini + session logic)
│   ├── main.py           # FastAPI endpoints (/start, /chat, /health)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx        # Chat shell + session management
    │   ├── App.css        # Dark theme
    │   └── components/
    │       ├── ChatBubble.jsx  # Message renderer (text + markdown)
    │       └── JsonCard.jsx    # Typed cards for eval/projects/jobs
    ├── package.json
    └── vite.config.js
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/start` | Create session → returns `session_id` + opening message |
| POST | `/chat` | `{ session_id, message }` → `{ message, json_data, session_id }` |
| GET | `/health` | Health check |

## Demo flow (3–4 min)

1. User opens the app — AI asks 3 questions
2. User types something like: *"I want a job, I know a bit of Python, English"*
3. AI gives a task: *"Write a function to reverse a string"*
4. User writes a rough answer
5. AI evaluates → shows JSON score card
6. AI shows 2 projects → user picks one step to attempt
7. AI generates build summary + job matches
