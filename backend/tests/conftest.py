import os

import pytest
from sqlalchemy.engine.url import make_url

if "GITHUB_ACTIONS" in os.environ:
    os.environ["TEST_DATABASE_URL"] = (
        "postgresql://postgres:postgres@localhost:5432/project_tracker_test"
    )

from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("TEST_DATABASE_URL")

if not url or not make_url(url).database.endswith("_test"):
    pytest.exit("TEST_DATABASE_URL must be set and name a *_test database")

os.environ["DATABASE_URL"] = url

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.rate_limit import limiter
from app.core.security import hash_password
from app.database.database import get_db
from app.main import app
from app.models.employee import Employee
from app.models.user import User, UserRole

TEST_DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

from alembic.config import Config

from alembic import command


@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    yield


@pytest.fixture()
def db():

    connection = engine.connect()

    transaction = connection.begin()

    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()

    transaction.rollback()

    connection.close()


@pytest.fixture()
def client(db):

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    limiter.enabled = False

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    limiter.enabled = True


@pytest.fixture()
def admin_user(db):

    admin = User(
        name="Admin",
        email="admin@test.com",
        password=hash_password("Admin@123"),
        role=UserRole.ADMIN,
        is_active=True,
        first_login=False,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return admin


@pytest.fixture()
def manager_user(db):

    manager = User(
        name="Manager",
        email="manager@test.com",
        password=hash_password("Manager@123"),
        role=UserRole.MANAGER,
        is_active=True,
        first_login=False,
    )

    db.add(manager)
    db.commit()
    db.refresh(manager)

    return manager


@pytest.fixture()
def employee_user(db, admin_user):

    user = User(
        name="Employee",
        email="employee@test.com",
        password=hash_password("Employee@123"),
        role=UserRole.TEAM_MEMBER,
        is_active=True,
        first_login=False,
    )

    db.add(user)
    db.flush()

    employee = Employee(
        name=user.name,
        email=user.email,
        phone="9876543210",
        user_id=user.id,
        created_by=admin_user.id,
        is_active=True,
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)
    db.refresh(user)

    employee.user = user

    return employee


@pytest.fixture()
def admin_token(client, admin_user):

    response = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123",
        },
    )

    return response.json()["access_token"]


@pytest.fixture()
def manager_token(client, manager_user):

    response = client.post(
        "/auth/login",
        json={
            "email": "manager@test.com",
            "password": "Manager@123",
        },
    )

    return response.json()["access_token"]


@pytest.fixture()
def employee_token(client, employee_user):

    response = client.post(
        "/auth/login",
        json={
            "email": "employee@test.com",
            "password": "Employee@123",
        },
    )

    return response.json()["access_token"]


@pytest.fixture()
def admin_headers(admin_token):

    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def manager_headers(manager_token):

    return {"Authorization": f"Bearer {manager_token}"}


@pytest.fixture()
def employee_headers(employee_token):

    return {"Authorization": f"Bearer {employee_token}"}
