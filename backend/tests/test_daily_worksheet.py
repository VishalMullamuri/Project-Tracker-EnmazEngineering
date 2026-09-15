# backend/tests/test_daily_worksheet.py

from app.core.enums import UserRole
from app.core.security import hash_password
from app.models.employee import Employee
from app.models.user import User

WORKSHEET_DATE = "2026-09-09"


def test_get_daily_worksheet_requires_authentication(client):
    response = client.get(
        "/daily-worksheets",
        params={"date": WORKSHEET_DATE},
    )

    assert response.status_code == 401


def test_get_daily_worksheet_for_current_employee(
    client,
    employee_headers,
):
    response = client.get(
        "/daily-worksheets",
        headers=employee_headers,
        params={"date": WORKSHEET_DATE},
    )

    assert response.status_code == 200


def test_create_daily_worksheet(
    client,
    employee_headers,
):
    response = client.put(
        "/daily-worksheets",
        params={"date": WORKSHEET_DATE},
        headers=employee_headers,
        json={
            "tasks": [
                {
                    "title": "Complete daily work",
                    "description": "Finish assigned work",
                    "status": "Not Started",
                    "remarks": None,
                }
            ],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["worksheet_date"] == WORKSHEET_DATE
    assert len(data["tasks"]) == 1
    assert data["tasks"][0]["title"] == "Complete daily work"


def test_update_existing_daily_worksheet_is_allowed(
    client,
    employee_headers,
):
    payload = {
        "tasks": [],
    }

    first_response = client.put(
        "/daily-worksheets",
        params={"date": WORKSHEET_DATE},
        headers=employee_headers,
        json=payload,
    )

    assert first_response.status_code == 200

    second_response = client.put(
        "/daily-worksheets",
        params={"date": WORKSHEET_DATE},
        headers=employee_headers,
        json=payload,
    )

    assert second_response.status_code == 200


def test_employee_cannot_view_another_employee_worksheet(
    client,
    db,
    employee_headers,
    employee_user,
):
    other_user = User(
        name="Other Employee",
        email="other-daily-worksheet@test.com",
        password=hash_password("OtherEmployee@123"),
        role=UserRole.TEAM_MEMBER,
        is_active=True,
        first_login=False,
    )

    db.add(other_user)
    db.flush()

    other_employee = Employee(
        name=other_user.name,
        email=other_user.email,
        phone="9999999999",
        user_id=other_user.id,
        created_by=employee_user.user_id,
        is_active=True,
    )

    db.add(other_employee)
    db.commit()
    db.refresh(other_employee)

    response = client.get(
        "/daily-worksheets",
        headers=employee_headers,
        params={
            "date": WORKSHEET_DATE,
            "employee_id": other_employee.id,
        },
    )

    assert response.status_code == 404


def test_employee_cannot_update_another_employee_worksheet(
    client,
    db,
    employee_headers,
    employee_user,
):
    other_user = User(
        name="Other Employee",
        email="other-update-daily@test.com",
        password=hash_password("OtherEmployee@123"),
        role=UserRole.TEAM_MEMBER,
        is_active=True,
        first_login=False,
    )

    db.add(other_user)
    db.flush()

    other_employee = Employee(
        name=other_user.name,
        email=other_user.email,
        phone="9999999999",
        user_id=other_user.id,
        created_by=employee_user.user_id,
        is_active=True,
    )

    db.add(other_employee)
    db.commit()
    db.refresh(other_employee)

    response = client.put(
        "/daily-worksheets",
        headers=employee_headers,
        params={
            "date": WORKSHEET_DATE,
            "employee_id": other_employee.id,
        },
        json={
            "tasks": [
                {
                    "title": "Unauthorized task",
                    "description": None,
                    "status": "Not Started",
                    "remarks": None,
                }
            ]
        },
    )

    assert response.status_code == 404


def test_employee_can_update_own_daily_worksheet(
    client,
    employee_headers,
):
    response = client.put(
        "/daily-worksheets",
        headers=employee_headers,
        params={"date": WORKSHEET_DATE},
        json={
            "tasks": [
                {
                    "title": "Updated daily task",
                    "description": "Updated description",
                    "status": "In Progress",
                    "remarks": "Working on it",
                }
            ]
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["worksheet_date"] == WORKSHEET_DATE
    assert len(data["tasks"]) == 1
    assert data["tasks"][0]["title"] == "Updated daily task"
    assert data["tasks"][0]["status"] == "In Progress"


def test_delete_daily_worksheet_task_requires_authentication(
    client,
):
    response = client.delete(
        "/daily-worksheets/tasks/999999",
    )

    assert response.status_code == 401


def test_delete_nonexistent_daily_worksheet_task(
    client,
    employee_headers,
):
    response = client.delete(
        "/daily-worksheets/tasks/999999",
        headers=employee_headers,
    )

    assert response.status_code == 404