from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


ADMIN_NAME = "Admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin@123"


def seed_admin():
    db: Session = SessionLocal()

    try:
        existing_admin = (
            db.query(User)
            .filter(User.role == UserRole.ADMIN)
            .first()
        )

        if existing_admin:
            print("Seed skipped: an admin user already exists.")
            return

        admin = User(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password=hash_password(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
            first_login=False,
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()