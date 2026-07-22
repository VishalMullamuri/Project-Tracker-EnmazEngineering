from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
)

# Validate required configuration
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set."
    )

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set."
    )

if not ALGORITHM:
    raise RuntimeError(
        "ALGORITHM environment variable is not set."
    )