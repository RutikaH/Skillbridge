# SkillBridge AI

> **Hackathon project** — go from zero to job-ready.
> No resume needed. Just show up and type.

---

## Project Overview

SkillBridge replaces the resume-first hiring bottleneck with a **skills-first assessment engine**. Instead of judging candidates by degrees or work history, it evaluates their actual abilities through an AI-powered conversational interview.

**How it works:**
1. User signs up / logs in (email or Google)
2. AI chatbot asks 3 onboarding questions (target opportunity, known skills, language)
3. User completes a practical coding/logic/skill task
4. AI evaluates the answer and assigns a **verified skill score** (0–100)
5. Platform shows 2 tailored beginner projects to build
6. AI generates a build summary + **personalized job/internship matches**
7. All results are saved to a **skill passport** (profile) that proves capability

**Target users:** students, career changers, and entry-level candidates who want to validate their skills, build practical projects, and discover matching opportunities.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Assessment Chatbot** | 7-step guided conversation with real-time evaluation |
| **Skill Verification** | Scores (0–100) mapped to levels: Beginner → Expert |
| **Job Matching** | Curated internships and entry-level roles |
| **Google OAuth** | One-click signup alongside email/password |
| **JWT Auth** | Secure, token-based sessions |
| **Dark Theme UI** | Full React chat interface with markdown rendering |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 5, React Router 6, Framer Motion |
| **Backend** | FastAPI (Python), Uvicorn |
| **AI / LLM** | OpenAI GPT-4o (primary) + Groq Llama 3.1 8B Instant (fallback) |
| **Database** | SQLite (SQLAlchemy ORM) |
| **Auth** | JWT (HS256) + Argon2 password hashing |
| **Deployment** | Render Blueprint (backend + static frontend) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│          React Frontend (Vite SPA)           │
│  /login  /signup  /dashboard  /skills       │
│  /assessments  /opportunities  /profile     │
└─────────────────────┬───────────────────────┘
                      │  fetch() + Bearer JWT
                      ▼
┌─────────────────────────────────────────────┐
│       FastAPI Backend (Uvicorn)              │
│  /auth/*   /api/*   /start   /chat   /health│
└─────────────────────┬───────────────────────┘
                      │  SQLAlchemy ORM
                      ▼
┌─────────────────────────────────────────────┐
│         SQLite Database                       │
│  users  ·  skills  ·  user_skills           │
│  assessment_results  ·  opportunities       │
└─────────────────────────────────────────────┘
                      ▲
                      │  OpenAI / Groq API
                ┌─────┴─────┐
                │ LLM Router│
                └───────────┘
```

---


---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- A **Groq API key** (free tier) or OpenAI key

> **Cheapest path:** Use Groq only (leave `OPENAI_API_KEY` empty).

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Add your GROQ_API_KEY
uvicorn main:app --reload        # http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

---

## Deployment

Deployed via **Render Blueprint** (`render.yaml`):

- **Backend** — Python web service on Render, auto-installs dependencies and starts with Uvicorn.
- **Frontend** — Static site built with Vite and published from `dist/`.
- **Env vars** — JWT secret is auto-generated on deploy; LLM keys, CORS origins, and frontend URL are set manually in the Render dashboard.
- **Optional persistent disk** — Add a 1 GB disk to `/data` for SQLite persistence across redeploys.

One-click deploy: push this repo to GitHub and connect it on Render as a Blueprint.

---

## Future Improvements

| Area | Next Steps |
|------|-----------|
| **Matching engine** | Compute dynamic skill-to-opportunity matches instead of static percentages. |
| **LLM persistence** | Move assessment sessions from in-memory to Redis / DB for restart safety. |
| **Analytics** | Add time-series tracking of skill growth and assessment streaks. |
| **Resume export** | Generate a SkillBridge "skill passport" PDF from profile data. |


---

## Live Demo

🌐 Frontend: https://skillbridge-1-hgu8.onrender.com

---

