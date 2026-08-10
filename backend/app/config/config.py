import os

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY must be set and >= 32 chars")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

if ALGORITHM not in {"HS256", "HS384", "HS512"}:
    raise RuntimeError(f"Unsupported ALGORITHM: {ALGORITHM}")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
