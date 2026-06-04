import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skillbridge.db")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "60"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
GOOGLE_AUTH_URI = os.getenv(
    "GOOGLE_AUTH_URI", "https://accounts.google.com/o/oauth2/v2/auth")
GOOGLE_TOKEN_URI = os.getenv(
    "GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token")
GOOGLE_USERINFO_URI = os.getenv(
    "GOOGLE_USERINFO_URI", "https://www.googleapis.com/oauth2/v1/userinfo")
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(
    ",") if os.getenv("CORS_ORIGINS") else []
