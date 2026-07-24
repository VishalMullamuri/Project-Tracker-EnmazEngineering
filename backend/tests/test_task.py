from datetime import date


def create_task(client, manager_headers, employee_user):

    project = client.post(
        "/projects",
        headers=manager_headers,
        json={
            "project_name": "Task Project",
            "description": "Testing",
            "status": "Not Started",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
        },
    )

    project_id = project.json()["id"]

    task = client.post(
        "/tasks",
        headers=manager_headers,
        json={
            "project_id": project_id,
            "assigned_to": employee_user.id,
            "title": "Task 1",
            "description": "Testing Task",
            "priority": "High",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    return task.json()


def test_create_task(client, manager_headers, employee_user):

    task = create_task(
        client,
        manager_headers,
        employee_user,
    )

    assert task["title"] == "Task 1"
    assert task["status"] == "Pending"


def test_get_all_tasks(client, manager_headers, employee_user):

    create_task(
        client,
        manager_headers,
        employee_user,
    )

    response = client.get(
        "/tasks",
        headers=manager_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) > 0


def test_get_single_task(client, manager_headers, employee_user):

    task = create_task(
        client,
        manager_headers,
        employee_user,
    )

    response = client.get(
        f"/tasks/{task['id']}",
        headers=manager_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == task["id"]


def test_update_task(client, manager_headers, employee_user):

    task = create_task(
        client,
        manager_headers,
        employee_user,
    )

    response = client.put(
        f"/tasks/{task['id']}",
        headers=manager_headers,
        json={
            "title": "Updated Task",
            "description": "Updated",
            "assigned_to": employee_user.id,
            "status": "Completed",
            "priority": "Medium",
            "remarks": "Done",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Completed"


def test_delete_task(client, manager_headers, employee_user):

    task = create_task(
        client,
        manager_headers,
        employee_user,
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
            "assigned_to": employee_user.id,
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
):

    create_task(
        client,
        manager_headers,
        employee_user,
    )

    response = client.get(
        "/tasks/my-work",
        headers=employee_headers,
    )

    assert response.status_code == 200

def test_team_member_cannot_update_other_users_task(
    client,
    manager_headers,
    employee_headers,
    employee_user,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
    )

    response = client.put(
        f"/tasks/{task['id']}",
        headers=employee_headers,
        json={
            "title": "Hack",
            "description": "Hack",
            "assigned_to": employee_user.id,
            "status": "Completed",
            "priority": "High",
            "remarks": "Hack",
            "start_date": str(date.today()),
            "due_date": str(date.today()),
        },
    )

    assert response.status_code == 403


def test_team_member_cannot_delete_task(
    client,
    manager_headers,
    employee_headers,
    employee_user,
):
    task = create_task(
        client,
        manager_headers,
        employee_user,
    )

    response = client.delete(
        f"/tasks/{task['id']}",
        headers=employee_headers,
    )

    assert response.status_code == 403