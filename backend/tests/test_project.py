from datetime import date


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

    assert (
        delete_response.json()["message"]
        == "Project deleted successfully"
    )


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


def test_manager_can_assign_admin_created_employee(
    client,
    admin_headers,
    manager_headers,
):
    employee_response = client.post(
        "/employees",
        headers=admin_headers,
        json={
            "name": "Test Employee",
            "email": "testemployee@test.com",
            "password": "Employee@123",
            "phone": "9876543210",
            "role": "TEAM_MEMBER",
        },
    )

    assert employee_response.status_code == 200

    employee_id = employee_response.json()["id"]

    project_response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Manager Project",
            "description": "Test Project",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    assert project_response.status_code == 200

    project_id = project_response.json()["id"]

    assign_response = client.post(
    "/project-employees",
    headers=manager_headers,
    json={
        "project_id": project_id,
        "employee_id": employee_id,
    },
)

    assert assign_response.status_code == 200

def test_dashboard_counts_match_project_list(
    client,
    manager_headers,
):
    project_response = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Dashboard Project",
            "description": "Test",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    assert project_response.status_code == 200

    projects_response = client.get(
        "/projects",
        headers=manager_headers,
    )

    dashboard_response = client.get(
        "/dashboard/stats",
        headers=manager_headers,
    )

    assert projects_response.status_code == 200
    assert dashboard_response.status_code == 200

    projects = projects_response.json()
    dashboard = dashboard_response.json()

    assert dashboard["total_projects"] == len(projects)

    assert dashboard["completed_projects"] == sum(
        1 for p in projects
        if p["status"] == "Completed"
    )

    assert dashboard["active_projects"] == sum(
        1 for p in projects
        if p["status"] == "In Progress"
    )

    assert dashboard["delayed_projects"] == sum(
        1 for p in projects
        if p["status"] == "Delayed"
    )

    assert dashboard["not_started_projects"] == sum(
        1 for p in projects
        if p["status"] == "Not Started"
    )