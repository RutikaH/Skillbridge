import os
import re
import json
import time
from llm_router import ModelRouter




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
IMPORTANT:

- If the user answers all 3 questions in a single message,
DO NOT ask Step 1 again.
- Immediately continue to Step 2.
- Accept short answers like:
"job, python, telugu"
- Infer missing formatting automatically.
- Never repeat Step 1 if answers are already provided.

Infer skill level internally (Beginner / Intermediate). Do NOT output the level.
STOP after asking the questions. Do not write Step 2.

---

## Step 2 — Skill Test

Give ONE simple practical coding or logic task in plain text.
- Must be solvable in 5–10 minutes
- Beginner-friendly
- Based on the user's stated skill

If the user says they are stuck or don't know how to start, give a short hint and do not move to Step 3 yet.
Only proceed to Step 3 after the user submits a concrete solution or an attempt.

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

- Always respond ONLY in the user's preferred language
- Maintain the same language throughout the conversation
- If the user changes language, adapt automatically
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

        self.sessions: dict[str, dict] = {}

    def start_session(self, session_id: str) -> str:
        """Initialize a new chat session and return the opening message."""
        self.sessions[session_id] = {"history": [], "step": 1, "language": "English"}
        return self._call_model(self.sessions[session_id])

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

    def _get_step_from_text(self, text: str) -> int | None:
        """Detect the current step number from the assistant response."""
        match = re.search(r'##\s*Step\s*(\d+)', text)
        if match:
            return int(match.group(1))
        return None

    def _user_provided_attempt(self, text: str) -> bool:
        """Return True if the user message contains a concrete attempt/value rather than a stuck response."""
        normalized = text.lower()

        stuck_patterns = [
            r"don't know",
            r"dont know",
            r"no idea",
            r"not sure",
            r"i'm stuck",
            r"im stuck",
            r"stuck",
            r"help",
            r"can't start",
            r"cannot start",
            r"no code",
            r"no solution",
            r"no project",
            r"nothing",
            r"later",
            r"skip",
        ]

        for pattern in stuck_patterns:
            if re.search(pattern, normalized):
                return False

        code_signals = [
            r'```',
            r'\bclass\b',
            r'\bdef\b',
            r'\breturn\b',
            r'\bfor\b',
            r'\bwhile\b',
            r'\bfunction\b',
            r'\bconsole\.log\b',
            r'\bSystem\.out\b',
            r'\bprintln\b',
            r'\bnew\s+\w+',
            r'\barray\b',
            r'\[\s*\]',
            r'\{\s*\}',
            r';',
        ]

        for pattern in code_signals:
            if re.search(pattern, text):
                return True

        attempt_signals = [
            r'\bsolution\b',
            r'\bcode\b',
            r'\bproject\b',
            r'\banswer\b',
            r'\battempt\b',
            r'\bimplement\b',
            r'\bbuild\b',
            r'\bcreate\b',
        ]

        if any(re.search(pattern, normalized) for pattern in attempt_signals) and len(normalized.split()) > 6:
            return True

        return False

    def _call_model(self, session: dict) -> str:
        """Call the LLM with the current session history and return response text."""
        language_instruction = f"""
        The user's preferred language is:
        {session['language']}
        Respond ONLY in this language.Never reply in English unless the selected language is English.Never translate back to English.
        Never mix English unless unavoidable technical words.
        All headings, explanations, evaluations, and project steps MUST use this language.
        """

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT + "\n\n" + language_instruction
            }
        ] + session["history"]

        start_time = time.time()
        response = ModelRouter.generate(messages)
        latency = time.time() - start_time

        print(f"\nProvider Used: {response['provider']}")
        print(f"Latency: {latency:.2f}s\n")

        return response["content"]

    def chat(self, session_id: str, message: str) -> dict:
        """Send a user message and return the agent response."""
        if session_id not in self.sessions:
            self.start_session(session_id)

        session = self.sessions[session_id]
        lower_msg = message.lower()

        if any(word in lower_msg for word in ["hindi", "हिंदी"]):
            session["language"] = "Hindi"

        elif any(word in lower_msg for word in ["telugu", "తెలుగు"]):
            session["language"] = "Telugu"

        elif any(word in lower_msg for word in ["tamil", "தமிழ்"]):
            session["language"] = "Tamil"

        elif any(word in lower_msg for word in ["spanish", "español"]):
            session["language"] = "Spanish"

        elif any(word in lower_msg for word in ["english"]):
            session["language"] = "English"

        session["history"].append({"role": "user", "content": message})

        # Count how many times the user has spoken — gates auto-chaining
        user_turn = sum(1 for m in session["history"] if m["role"] == "user")

        raw_text = self._call_model(session)
        json_data = extract_json(raw_text)
        current_step = self._get_step_from_text(raw_text)
        if current_step is not None:
            session["step"] = current_step
        extra_messages = []

        # If the user has not provided a concrete solution or attempt, do not show Step 3 evaluation.
        user_attempt = self._user_provided_attempt(message)
        if session.get("step") == 3 and isinstance(json_data, dict) and "score" in json_data and user_turn >= 2 and not user_attempt:
            session["step"] = 2
            hint_prompt = {
                "role": "user",
                "content": (
                    f"""
                    The user has not provided a concrete code solution or attempt.
                    Stay in Step 2 and give a short hint to help them get started on the task.
                    Do NOT output Step 3 evaluation, score, or JSON.
                    """
                )
            }
            session["history"].append({"role": "assistant", "content": self._strip_step_bleed(raw_text)})
            session["history"].append(hint_prompt)
            retry_text = self._call_model(session)
            session["history"].append({"role": "assistant", "content": retry_text})
            return {
                "message": retry_text,
                "json_data": None,
                "extra_messages": [],
                "session_id": session_id,
            }

        # After Step 3 evaluation — only trigger if the assistant actually completed Step 3
        if session.get("step") == 3 and isinstance(json_data, dict) and "score" in json_data and user_turn >= 2:
            clean_text = self._strip_step_bleed(raw_text)
            session["history"].append({"role": "assistant", "content": clean_text})

            session["history"].append({
                "role": "user",
                "content": (
                    f"""
                    The user's selected language is:
                    {session['language']}

                    Output Step 4 ONLY in this language.
                    Do NOT switch to English.
                    """
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
                    f"""
                    The user's selected language is:
                    {session['language']}

                    Output Step 7 ONLY in this language.
                    Do NOT switch to English.
                    """
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
