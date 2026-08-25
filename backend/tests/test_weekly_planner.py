from app.core.enums import UserRole
from app.core.security import hash_password
from app.models.employee import Employee
from app.models.user import User

WEEK_START = "2026-08-24"


def create_weekly_task(
    client,
    headers,
    employee_id,
    task="Test Weekly Planner Task",
    status="Not Started",
    remarks="Testing",
    week_start=WEEK_START,
):
    return client.post(
        "/weekly-planner",
        headers=headers,
        json={
            "task": task,
            "employee_id": employee_id,
            "week_start": week_start,
            "status": status,
            "remarks": remarks,
        },
    )


# ============================================================
# GET /weekly-planner
# ============================================================


def test_get_weekly_planner_admin(
    client,
    admin_headers,
    employee_user,
):
    response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
    )

    assert response.status_code == 200

    response = client.get(
        "/weekly-planner",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["task"] == "Test Weekly Planner Task"
    assert data[0]["employee_id"] == employee_user.id
    assert data[0]["employee_name"] == "Employee"


def test_get_weekly_planner_manager(
    client,
    manager_headers,
    employee_user,
):
    response = create_weekly_task(
        client,
        manager_headers,
        employee_user.id,
    )

    assert response.status_code == 200

    response = client.get(
        "/weekly-planner",
        headers=manager_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["employee_id"] == employee_user.id


def test_get_weekly_planner_team_member_only_sees_own_tasks(
    client,
    db,
    admin_user,
    employee_user,
    admin_headers,
    employee_headers,
):
    # Create a second team member.
    second_user = User(
        name="Employee Two",
        email="employee2@test.com",
        password=hash_password("Employee2@123"),
        role=UserRole.TEAM_MEMBER,
        is_active=True,
        first_login=False,
    )

    db.add(second_user)
    db.flush()

    second_employee = Employee(
        name=second_user.name,
        email=second_user.email,
        phone="9876543211",
        user_id=second_user.id,
        created_by=admin_user.id,
        is_active=True,
    )

    db.add(second_employee)
    db.commit()
    db.refresh(second_employee)

    # Create one task for Employee 1.
    response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Employee One Task",
    )

    assert response.status_code == 200

    # Create one task for Employee 2.
    response = create_weekly_task(
        client,
        admin_headers,
        second_employee.id,
        task="Employee Two Task",
    )

    assert response.status_code == 200

    # Employee 1 should only see Employee 1's task.
    response = client.get(
        "/weekly-planner",
        headers=employee_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["task"] == "Employee One Task"
    assert data[0]["employee_id"] == employee_user.id


def test_get_weekly_planner_requires_authentication(
    client,
):
    response = client.get("/weekly-planner")

    assert response.status_code == 401


# ============================================================
# GET /weekly-planner/{task_id}
# ============================================================


def test_get_single_weekly_planner_task(
    client,
    admin_headers,
    employee_user,
):
    create_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    response = client.get(
        f"/weekly-planner/{task_id}",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == task_id
    assert data["employee_id"] == employee_user.id


def test_get_nonexistent_weekly_planner_task(
    client,
    admin_headers,
):
    response = client.get(
        "/weekly-planner/999999",
        headers=admin_headers,
    )

    assert response.status_code == 404


# ============================================================
# POST /weekly-planner
# ============================================================


def test_admin_can_create_weekly_planner_task(
    client,
    admin_headers,
    employee_user,
):
    response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Admin Created Task",
        status="In Progress",
        remarks="Created by admin",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["task"] == "Admin Created Task"
    assert data["employee_id"] == employee_user.id
    assert data["employee_name"] == "Employee"
    assert data["week_start"] == WEEK_START
    assert data["status"] == "In Progress"
    assert data["remarks"] == "Created by admin"


def test_manager_can_create_weekly_planner_task(
    client,
    manager_headers,
    employee_user,
):
    response = create_weekly_task(
        client,
        manager_headers,
        employee_user.id,
        task="Manager Created Task",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["task"] == "Manager Created Task"
    assert data["employee_id"] == employee_user.id


def test_admin_and_manager_have_same_create_permission(
    client,
    admin_headers,
    manager_headers,
    employee_user,
):
    admin_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Admin Permission Test",
    )

    manager_response = create_weekly_task(
        client,
        manager_headers,
        employee_user.id,
        task="Manager Permission Test",
    )

    assert admin_response.status_code == 200
    assert manager_response.status_code == 200


def test_team_member_cannot_create_weekly_planner_task(
    client,
    employee_headers,
    employee_user,
):
    response = create_weekly_task(
        client,
        employee_headers,
        employee_user.id,
        task="Unauthorized Create",
    )

    assert response.status_code == 403

    assert response.json()["detail"] == (
        "Only admins and managers can modify the weekly planner"
    )


def test_create_weekly_planner_invalid_employee(
    client,
    admin_headers,
):
    response = create_weekly_task(
        client,
        admin_headers,
        employee_id=999999,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"


def test_create_weekly_planner_empty_task(
    client,
    admin_headers,
    employee_user,
):
    response = client.post(
        "/weekly-planner",
        headers=admin_headers,
        json={
            "task": "   ",
            "employee_id": employee_user.id,
            "week_start": WEEK_START,
            "status": "Not Started",
            "remarks": None,
        },
    )

    assert response.status_code == 422


# ============================================================
# PUT /weekly-planner/{task_id}
# ============================================================


def test_admin_can_update_weekly_planner_task(
    client,
    admin_headers,
    employee_user,
):
    create_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    response = client.put(
        f"/weekly-planner/{task_id}",
        headers=admin_headers,
        json={
            "status": "Completed",
            "remarks": "Completed by admin",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == task_id
    assert data["status"] == "Completed"
    assert data["remarks"] == "Completed by admin"


def test_manager_can_update_weekly_planner_task(
    client,
    manager_headers,
    admin_headers,
    employee_user,
):
    create_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    response = client.put(
        f"/weekly-planner/{task_id}",
        headers=manager_headers,
        json={
            "status": "In Progress",
            "remarks": "Updated by manager",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "In Progress"
    assert data["remarks"] == "Updated by manager"


def test_admin_and_manager_have_same_update_permission(
    client,
    admin_headers,
    manager_headers,
    employee_user,
):
    # Admin creates task.
    admin_create = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Permission Test",
    )

    assert admin_create.status_code == 200

    task_id = admin_create.json()["id"]

    # Manager can update it.
    manager_update = client.put(
        f"/weekly-planner/{task_id}",
        headers=manager_headers,
        json={
            "status": "Completed",
        },
    )

    assert manager_update.status_code == 200

    # Admin can update it again.
    admin_update = client.put(
        f"/weekly-planner/{task_id}",
        headers=admin_headers,
        json={
            "status": "Delayed",
        },
    )

    assert admin_update.status_code == 200


def test_team_member_cannot_update_weekly_planner_task(
    client,
    admin_headers,
    employee_headers,
    employee_user,
):
    create_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    response = client.put(
        f"/weekly-planner/{task_id}",
        headers=employee_headers,
        json={
            "status": "Completed",
        },
    )

    assert response.status_code == 403

    assert response.json()["detail"] == (
        "Only admins and managers can modify the weekly planner"
    )


def test_update_nonexistent_weekly_planner_task(
    client,
    admin_headers,
):
    response = client.put(
        "/weekly-planner/999999",
        headers=admin_headers,
        json={
            "status": "Completed",
        },
    )

    assert response.status_code == 404


# ============================================================
# DELETE /weekly-planner/{task_id}
# ============================================================


def test_admin_can_delete_weekly_planner_task(
    client,
    admin_headers,
    employee_user,
):
    create_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    response = client.delete(
        f"/weekly-planner/{task_id}",
        headers=admin_headers,
    )

    assert response.status_code == 200

    assert response.json()["message"] == ("Weekly planner task deleted successfully")

    get_response = client.get(
        f"/weekly-planner/{task_id}",
        headers=admin_headers,
    )

    assert get_response.status_code == 404


def test_manager_can_delete_weekly_planner_task(
    client,
    manager_headers,
    employee_user,
):
    create_response = create_weekly_task(
        client,
        manager_headers,
        employee_user.id,
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    response = client.delete(
        f"/weekly-planner/{task_id}",
        headers=manager_headers,
    )

    assert response.status_code == 200

    assert response.json()["message"] == ("Weekly planner task deleted successfully")


def test_admin_and_manager_have_same_delete_permission(
    client,
    admin_headers,
    manager_headers,
    employee_user,
):
    # Admin creates.
    create_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Delete Permission Test",
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    # Manager deletes.
    manager_delete = client.delete(
        f"/weekly-planner/{task_id}",
        headers=manager_headers,
    )

    assert manager_delete.status_code == 200

    # Create another task.
    create_response = create_weekly_task(
        client,
        manager_headers,
        employee_user.id,
        task="Delete Permission Test 2",
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    # Admin deletes.
    admin_delete = client.delete(
        f"/weekly-planner/{task_id}",
        headers=admin_headers,
    )

    assert admin_delete.status_code == 200


def test_team_member_cannot_delete_weekly_planner_task(
    client,
    admin_headers,
    employee_headers,
    employee_user,
):
    create_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
    )

    assert create_response.status_code == 200

    task_id = create_response.json()["id"]

    response = client.delete(
        f"/weekly-planner/{task_id}",
        headers=employee_headers,
    )

    assert response.status_code == 403

    assert response.json()["detail"] == (
        "Only admins and managers can modify the weekly planner"
    )


def test_delete_nonexistent_weekly_planner_task(
    client,
    admin_headers,
):
    response = client.delete(
        "/weekly-planner/999999",
        headers=admin_headers,
    )

    assert response.status_code == 404


# ============================================================
# FILTERING
# ============================================================


def test_weekly_planner_week_filter(
    client,
    admin_headers,
    employee_user,
):
    current_week_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Current Week Task",
        week_start="2026-08-24",
    )

    assert current_week_response.status_code == 200

    previous_week_response = create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Previous Week Task",
        week_start="2026-08-17",
    )

    assert previous_week_response.status_code == 200

    response = client.get(
        "/weekly-planner",
        headers=admin_headers,
        params={
            "week_start": "2026-08-24",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["task"] == "Current Week Task"


def test_weekly_planner_status_filter(
    client,
    admin_headers,
    employee_user,
):
    create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Completed Task",
        status="Completed",
    )

    create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="In Progress Task",
        status="In Progress",
    )

    response = client.get(
        "/weekly-planner",
        headers=admin_headers,
        params={
            "status": "Completed",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["task"] == "Completed Task"
    assert data[0]["status"] == "Completed"


def test_weekly_planner_employee_filter(
    client,
    db,
    admin_user,
    admin_headers,
    employee_user,
):
    second_user = User(
        name="Employee Two",
        email="employee2@test.com",
        password=hash_password("Employee2@123"),
        role=UserRole.TEAM_MEMBER,
        is_active=True,
        first_login=False,
    )

    db.add(second_user)
    db.flush()

    second_employee = Employee(
        name="Employee Two",
        email="employee2@test.com",
        phone="9876543211",
        user_id=second_user.id,
        created_by=admin_user.id,
        is_active=True,
    )

    db.add(second_employee)
    db.commit()
    db.refresh(second_employee)

    create_weekly_task(
        client,
        admin_headers,
        employee_user.id,
        task="Employee One Task",
    )

    create_weekly_task(
        client,
        admin_headers,
        second_employee.id,
        task="Employee Two Task",
    )

    response = client.get(
        "/weekly-planner",
        headers=admin_headers,
        params={
            "employee_id": employee_user.id,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["task"] == "Employee One Task"
    assert data[0]["employee_id"] == employee_user.id
