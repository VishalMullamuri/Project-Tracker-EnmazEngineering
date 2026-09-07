from datetime import date

from app.core.enums import UserRole


def test_create_project(
    client,
    manager_headers,
):
    response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Project Alpha",
            "description": "Testing Project",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["project_name"] == "Project Alpha"
    assert data["status"] == "Not Started"
    assert data["progress"] == 0


def test_get_all_projects(
    client,
    manager_headers,
):
    response = client.get(
        "/projects",
        headers=manager_headers,
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_single_project(
    client,
    manager_headers,
):
    create_response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Project Alpha",
            "description": "Testing Project",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    project_id = create_response.json()["id"]

    response = client.get(
        f"/projects/{project_id}",
        headers=manager_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == project_id


def test_update_project(
    client,
    manager_headers,
):
    create_response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Project Alpha",
            "description": "Testing Project",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    project_id = create_response.json()["id"]

    response = client.put(
        f"/projects/{project_id}",
        headers=manager_headers,
        json={
            "project_name": "Updated Project",
            "description": "Updated Description",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["project_name"] == "Updated Project"


def test_delete_project(
    client,
    manager_headers,
):
    response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Delete Project",
            "description": "Delete",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    project_id = response.json()["id"]

    delete_response = client.delete(
        f"/projects/{project_id}",
        headers=manager_headers,
    )

    assert delete_response.status_code == 200

    assert delete_response.json()["message"] == "Project deleted successfully"


def test_team_member_cannot_create_project(
    client,
    employee_headers,
):
    response = client.post(
        "/projects",
        headers=employee_headers,
        json={
            "project_name": "Unauthorized",
            "description": "Unauthorized",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    assert response.status_code == 403


def test_dashboard_counts_match_project_list(
    client,
    manager_headers,
    employee_user,
):
    project = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Dashboard Project",
            "description": "Test",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    project_id = project.json()["id"]

    client.post(
        "/project-employees",
        headers=manager_headers,
        json={
            "project_id": project_id,
            "employee_id": employee_user.id,
        },
    )

    client.post(
        "/tasks",
        headers=manager_headers,
        json={
            "project_id": project_id,
            "assigned_to": employee_user.user_id,
            "title": "Task",
            "description": "Task",
            "priority": "High",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    client.put(
        "/tasks/1",
        headers=manager_headers,
        json={
            "status": "Completed",
        },
    )

    projects = client.get(
        "/projects",
        headers=manager_headers,
    )

    dashboard = client.get(
        "/dashboard/stats",
        headers=manager_headers,
    )

    assert projects.status_code == 200
    assert dashboard.status_code == 200

    project_list = projects.json()
    stats = dashboard.json()

    assert stats["total_projects"] == len(project_list)
    assert stats["completed_projects"] == sum(
        p["status"] == "Completed" for p in project_list
    )
    assert stats["active_projects"] == sum(
        p["status"] == "In Progress" for p in project_list
    )
    assert stats["delayed_projects"] == sum(
        p["status"] == "Delayed" for p in project_list
    )
    assert stats["not_started_projects"] == sum(
        p["status"] == "Not Started" for p in project_list
    )

def test_create_project_with_nonexistent_employee_returns_404(
    client,
    manager_headers,
):
    response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Invalid Employee Project",
            "description": "Testing invalid employee",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "employee_ids": [999999],
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"


def test_create_project_with_inactive_employee_returns_404(
    client,
    manager_headers,
    employee_user,
    db,
):
    employee_user.is_active = False
    db.commit()

    response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Inactive Employee Project",
            "description": "Testing inactive employee",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "employee_ids": [employee_user.id],
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"


def test_create_project_with_inactive_user_returns_404(
    client,
    manager_headers,
    employee_user,
    db,
):
    employee_user.user.is_active = False
    db.commit()

    response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Inactive User Project",
            "description": "Testing inactive user",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "employee_ids": [employee_user.id],
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"


def test_create_project_with_non_team_member_returns_400(
    client,
    manager_headers,
    employee_user,
    db,
):
    employee_user.user.role = UserRole.MANAGER
    db.commit()

    response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Invalid Role Project",
            "description": "Testing invalid employee role",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "employee_ids": [employee_user.id],
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Only team members can be assigned to projects"
    )