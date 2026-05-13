import os
import re
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

SYSTEM_PROMPT = """You are SkillBridge AI — a multilingual skill assessment agent.

CRITICAL OUTPUT RULES:
- NEVER respond with raw JSON as your message text.
- ONLY use ```json code blocks for structured data.
- Begin each response with the current step heading (## Step N — Name).
- STOP IMMEDIATELY after your step is complete. Do NOT write the next step's heading. Do NOT preview the next step. The system handles chaining automatically.
- Keep every response short and clear.

==================================================
WORKFLOW
==================================================

## Step 1 — Understanding You

Ask these 3 questions in plain text (not JSON):
1. What type of opportunity are you looking for? (Job / Internship / Freelance)
2. What skills or technologies do you currently know?
3. What is your preferred language?

Infer skill level internally (Beginner / Intermediate). Do NOT output the level.
STOP after asking the questions. Do not write Step 2.

---

## Step 2 — Skill Test

Give ONE simple practical coding or logic task in plain text.
- Must be solvable in 5–10 minutes
- Beginner-friendly
- Based on the user's stated skill

End with: "Please share your solution when ready."
STOP after this. Do not write Step 3.

---

## Step 3 — Skill Evaluation

Write 1–2 plain text sentences summarising what the user did well and what to improve.

Then output the evaluation JSON block:
```json
{
  "score": 7,
  "strengths": ["clear logic", "correct output"],
  "improvements": ["add error handling", "use meaningful variable names"]
}
```

STOP immediately after the closing ``` of the JSON block. Do NOT write Step 4. Do NOT write anything after the JSON.

---

## Step 4 — Choose a Project

Write exactly: "Here are 2 projects based on your skills. Pick one to build:"

Then output the projects JSON block:
```json
[
  {
    "title": "Project Name",
    "description": "One sentence description.",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "real_world_use": "One sentence real-world use case."
  },
  {
    "title": "Project Name",
    "description": "One sentence description.",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "real_world_use": "One sentence real-world use case."
  }
]
```

Then write: "Which project would you like to build? (1 or 2)"
STOP after this. Do not write Step 5.

---

## Step 5 — Guided Build

In plain text, ask the user to complete ONLY the first step of their chosen project.
- Give hints if they're stuck
- Accept partial answers
- Keep it short

STOP after this. Do not write Step 6.

---

## Step 6 — Show Your Work

Write 1–2 plain text sentences acknowledging what the user built.

Then output the build summary JSON block:
```json
{
  "project": "Project title",
  "what_user_did": "Short description of what was built.",
  "skills_shown": ["skill1", "skill2"],
  "confidence_score": "High"
}
```

STOP immediately after the closing ``` of the JSON block. Do NOT write Step 7. Do NOT write anything after the JSON.

---

## Step 7 — Job Opportunities

Write exactly: "Based on your skills, here are some opportunities to explore:"

Then output the job matches JSON block:
```json
[
  {
    "role": "Job Title",
    "reason": "Why this fits the user.",
    "skills_matched": ["skill1", "skill2"],
    "search_link": "https://www.linkedin.com/jobs/search/?keywords=Job+Title"
  }
]
```

Generate 2–3 roles. Use real searchable links from LinkedIn, Indeed, Internshala, or Wellfound.
STOP after the JSON block.

==================================================
RULES
==================================================

- Always respond in the user's preferred language
- Never output raw JSON outside of ```json blocks
- Never skip steps
- Never hallucinate
- No long paragraphs
- Keep total interaction under 4 minutes"""

INITIAL_MESSAGE = """Hi! I'm **SkillBridge AI** 👋

I'll help you go from zero to job-ready — no resume needed!

Let's start with **3 quick questions**:

1. What kind of opportunity are you looking for?
   → Job / Internship / Freelance

2. What skills do you currently know?
   → (Vague is fine — e.g., "I know a bit of Python" or "I've done some HTML")

3. What is your preferred language?
   → English / Hindi / Spanish / etc.

Feel free to answer all three in one message!"""


def extract_json(text: str):
    """Extract JSON from a markdown code block or raw JSON in text."""
    # Try ```json ... ``` block first
    match = re.search(r'```(?:json)?\s*([\[{][\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try raw JSON object or array (greedy from first { or [)
    match = re.search(r'(\[[\s\S]*\]|\{[\s\S]*\})', text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    return None


class SkillBridgeAgent:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment variables.")
        self.client = Groq(api_key=api_key)
        self.sessions: dict[str, dict] = {}

    def start_session(self, session_id: str) -> str:
        """Initialize a new chat session and return the opening message."""
        self.sessions[session_id] = {"history": [], "step": 1}
        return INITIAL_MESSAGE

    def _strip_code_blocks(self, text: str) -> str:
        """Remove all fenced code blocks and raw JSON from text, leaving only human-readable content."""
        # Strip fenced code blocks (```json ... ``` or ``` ... ```)
        text = re.sub(r'```(?:json)?[\s\S]*?```', '', text)
        # Strip raw JSON arrays or objects the AI forgot to fence (starts with [ or { on a line)
        text = re.sub(r'(?m)^[\[{][\s\S]*', '', text)
        # Collapse multiple blank lines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    def _strip_step_bleed(self, text: str) -> str:
        """Remove any content after the last closing ``` that belongs to the next step."""
        # Find last occurrence of closing ``` and cut anything after it
        last_fence = text.rfind('```')
        if last_fence != -1:
            after = text[last_fence + 3:].strip()
            # If content after the last fence contains a next-step heading, drop it
            if re.search(r'##\s*Step\s*\d', after):
                return text[:last_fence + 3].rstrip()
        # Also strip any trailing ## Step N heading that has no JSON before it
        trimmed = re.sub(r'\n+##\s*Step\s*\d[\s\S]*$', '', text).rstrip()
        return trimmed

    def _call_model(self, session: dict) -> str:
        """Call the LLM with the current session history and return response text."""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + session["history"]
        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
        )
        return response.choices[0].message.content

    def chat(self, session_id: str, message: str) -> dict:
        """Send a user message and return the agent response."""
        if session_id not in self.sessions:
            self.start_session(session_id)

        session = self.sessions[session_id]

        session["history"].append({"role": "user", "content": message})

        # Count how many times the user has spoken — gates auto-chaining
        user_turn = sum(1 for m in session["history"] if m["role"] == "user")

        raw_text = self._call_model(session)
        json_data = extract_json(raw_text)
        extra_messages = []

        # After Step 3 evaluation — only trigger if user has sent at least 2 messages
        # (1st = step 1 answers, 2nd = skill test answer)
        if isinstance(json_data, dict) and "score" in json_data and user_turn >= 2:
            clean_text = self._strip_step_bleed(raw_text)
            session["history"].append({"role": "assistant", "content": clean_text})

            session["history"].append({
                "role": "user",
                "content": (
                    "Now output Step 4 ONLY. "
                    "Start with the heading '## Step 4 — Choose a Project', "
                    "then output the ```json block with exactly 2 projects (title, description, steps array, real_world_use). "
                    "Output NOTHING else — no intro sentence, no question, no text before or after the JSON block."
                )
            })
            t2 = self._call_model(session)
            session["history"].append({"role": "assistant", "content": t2})
            extra_messages.append({
                "message": "",
                "json_data": extract_json(t2)
            })

            return {
                "message": clean_text,
                "json_data": json_data,
                "extra_messages": extra_messages,
                "session_id": session_id,
            }

        # After Step 6 build summary — only trigger if user has sent at least 4 messages
        elif isinstance(json_data, dict) and "what_user_did" in json_data and user_turn >= 4:
            clean_text = self._strip_step_bleed(raw_text)
            session["history"].append({"role": "assistant", "content": clean_text})

            session["history"].append({
                "role": "user",
                "content": (
                    "Now output Step 7 ONLY. "
                    "Start with the heading '## Step 7 — Job Opportunities', "
                    "then output the ```json block with 2-3 job matches (role, reason, skills_matched array, search_link). "
                    "Output NOTHING else — no intro sentence, no text before or after the JSON block."
                )
            })
            t2 = self._call_model(session)
            session["history"].append({"role": "assistant", "content": t2})
            extra_messages.append({
                "message": "",
                "json_data": extract_json(t2)
            })

            return {
                "message": clean_text,
                "json_data": json_data,
                "extra_messages": extra_messages,
                "session_id": session_id,
            }

        # All other steps — strip any bleed before storing
        else:
            clean_text = self._strip_step_bleed(raw_text)
            session["history"].append({"role": "assistant", "content": clean_text})

            return {
                "message": clean_text,
                "json_data": json_data,
                "extra_messages": [],
                "session_id": session_id,
            }
