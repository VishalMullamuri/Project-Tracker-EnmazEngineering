from datetime import date

import pytest


def create_task(
    client,
    manager_headers,
    employee_user,
    db,
):
    project = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Task Project",
            "description": "Testing",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    assert project.status_code == 200

    project_id = project.json()["id"]

    from app.models.project_employee import ProjectEmployee

    db.add(
        ProjectEmployee(
            project_id=project_id,
            employee_id=employee_user.id,
        )
    )
    db.flush()

    task = client.post(
        "/tasks",
        headers=manager_headers,
        json={
            "project_id": project_id,
            "assigned_to": employee_user.user_id,
            "title": "Task 1",
            "description": "Testing Task",
            "priority": "High",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    assert task.status_code == 200

    return task.json()


def test_create_task(
    client,
    manager_headers,
    employee_user,
    db,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    assert task["title"] == "Task 1"
    assert task["status"] == "Not Started"


def test_get_all_tasks(
    client,
    manager_headers,
    employee_user,
    db,
):
    create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.get(
        "/tasks",
        headers=manager_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) > 0


def test_get_single_task(
    client,
    manager_headers,
    employee_user,
    db,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.get(
        f"/tasks/{task['id']}",
        headers=manager_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == task["id"]


def test_update_task(
    client,
    manager_headers,
    employee_user,
    db,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.put(
        f"/tasks/{task['id']}",
        headers=manager_headers,
        json={
            "title": "Updated Task",
            "description": "Updated",
            "assigned_to": task["assigned_to"],
            "status": "Completed",
            "priority": "Medium",
            "remarks": "Done",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Completed"


def test_delete_task(
    client,
    manager_headers,
    employee_user,
    db,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.delete(
        f"/tasks/{task['id']}",
        headers=manager_headers,
    )

    assert response.status_code == 200


def test_team_member_cannot_create_task(
    client,
    employee_headers,
    employee_user,
):
    response = client.post(
        "/tasks",
        headers=employee_headers,
        json={
            "project_id": 1,
            "assigned_to": employee_user.user_id,
            "title": "Unauthorized",
            "description": "Unauthorized",
            "priority": "High",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    assert response.status_code == 403


def test_get_my_work(
    client,
    manager_headers,
    employee_headers,
    employee_user,
    db,
):
    create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.get(
        "/tasks/my-work",
        headers=employee_headers,
    )

    assert response.status_code == 200


def test_team_member_can_update_own_task(
    client,
    manager_headers,
    employee_headers,
    employee_user,
    db,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.put(
        f"/tasks/{task['id']}",
        headers=employee_headers,
        json={
            "status": "Completed",
            "remarks": "Completed successfully",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Completed"
    assert response.json()["remarks"] == "Completed successfully"


def test_team_member_cannot_delete_task(
    client,
    manager_headers,
    employee_headers,
    employee_user,
    db,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.delete(
        f"/tasks/{task['id']}",
        headers=employee_headers,
    )

    assert response.status_code == 403


def test_manager_partial_update(
    client,
    manager_headers,
    employee_user,
    db,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.put(
        f"/tasks/{task['id']}",
        headers=manager_headers,
        json={
            "status": "Completed",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Completed"
    assert response.json()["title"] == task["title"]
    assert response.json()["description"] == task["description"]


def test_team_member_cannot_update_others_task(
    client,
    manager_headers,
    employee_headers,
    employee_user,
    db,
):
    from app.core.enums import UserRole
    from app.core.security import hash_password
    from app.models.employee import Employee
    from app.models.project_employee import ProjectEmployee
    from app.models.user import User

    project = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Shared Project",
            "description": "Testing",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    assert project.status_code == 200
    project_id = project.json()["id"]

    db.add(
        ProjectEmployee(
            project_id=project_id,
            employee_id=employee_user.id,
        )
    )

    other_user = User(
        name="Other Employee",
        email="other@test.com",
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
    db.flush()

    db.add(
        ProjectEmployee(
            project_id=project_id,
            employee_id=other_employee.id,
        )
    )

    db.commit()

    task = client.post(
        "/tasks",
        headers=manager_headers,
        json={
            "project_id": project_id,
            "assigned_to": other_user.id,
            "title": "Other Employee Task",
            "description": "Testing Task",
            "priority": "High",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    assert task.status_code == 200

    response = client.put(
        f"/tasks/{task.json()['id']}",
        headers=employee_headers,
        json={
            "status": "Completed",
        },
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    "field",
    [
        "assigned_to",
        "title",
        "description",
        "status",
        "priority",
        "start_date",
        "due_date",
    ],
)
def test_task_update_rejects_explicit_nulls(
    client,
    manager_headers,
    employee_user,
    db,
    field,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
        db,
    )

    response = client.put(
        f"/tasks/{task['id']}",
        headers=manager_headers,
        json={
            field: None,
        },
    )

    assert response.status_code == 422
