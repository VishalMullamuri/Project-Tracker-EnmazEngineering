
from app.core.enums import UserRole
from app.core.security import hash_password
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
    response = client.post(
        "/daily-worksheets",
        headers=employee_headers,
        json={
            "worksheet_date": WORKSHEET_DATE,
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


def test_create_duplicate_daily_worksheet_returns_conflict(
    client,
    employee_headers,
):
    payload = {
        "worksheet_date": WORKSHEET_DATE,
        "tasks": [],
    }

    first_response = client.post(
        "/daily-worksheets",
        headers=employee_headers,
        json=payload,
    )

    assert first_response.status_code == 200

    second_response = client.post(
        "/daily-worksheets",
        headers=employee_headers,
        json=payload,
    )

    assert second_response.status_code == 409


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
    db.commit()
    db.refresh(other_user)

    response = client.get(
        "/daily-worksheets",
        headers=employee_headers,
        params={
            "date": WORKSHEET_DATE,
            "employee_id": other_user.id,
        },
    )

    assert response.status_code == 403


def test_employee_cannot_update_another_employee_worksheet(
    client,
    db,
    employee_headers,
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
    db.commit()
    db.refresh(other_user)

    response = client.put(
        "/daily-worksheets",
        headers=employee_headers,
        params={
            "date": WORKSHEET_DATE,
            "employee_id": other_user.id,
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

    assert response.status_code == 403


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