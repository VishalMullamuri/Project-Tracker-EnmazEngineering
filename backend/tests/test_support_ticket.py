
import pytest


def create_ticket(client, headers, department_id, **overrides):
    payload = {
        "title": "Test Support Ticket",
        "description": "Created by automated tests",
        "category": "Technical Issue",
        "priority": "MEDIUM",
        "department_id": department_id,
    }
    payload.update(overrides)

    return client.post(
        "/support-tickets",
        headers=headers,
        json=payload,
    )


@pytest.fixture
def department(db):
    from app.models.department import Department

    item = Department(
        name="Support Test Department",
        is_active=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@pytest.fixture
def inactive_department(db):
    from app.models.department import Department

    item = Department(
        name="Inactive Support Department",
        is_active=False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@pytest.fixture
def employee_in_department(db, employee_user, department):
    from app.models.employee_department import EmployeeDepartment

    db.add(
        EmployeeDepartment(
            employee_id=employee_user.id,
            department_id=department.id,
        )
    )
    db.commit()
    return employee_user


@pytest.fixture
def created_ticket(client, employee_headers, department):
    response = create_ticket(
        client,
        employee_headers,
        department.id,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_ticket(client, employee_headers, department):
    response = create_ticket(
        client,
        employee_headers,
        department.id,
    )

    assert response.status_code == 201, response.text
    data = response.json()
    assert data["title"] == "Test Support Ticket"
    assert data["status"] == "OPEN"
    assert data["priority"] == "MEDIUM"
    assert data["department_id"] == department.id
    assert data["ticket_number"].startswith("ST-")


def test_create_ticket_without_authentication(client, department):
    response = client.post(
        "/support-tickets",
        json={
            "title": "Unauthenticated Ticket",
            "description": "Should not be created",
            "department_id": department.id,
        },
    )

    assert response.status_code in (401, 403)


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"title": "AB", "description": "Description", "department_id": 1},
        {"title": "Valid title", "description": "", "department_id": 1},
        {
            "title": "Valid title",
            "description": "Description",
            "priority": "INVALID",
            "department_id": 1,
        },
    ],
)
def test_invalid_ticket_payload(client, employee_headers, payload):
    response = client.post(
        "/support-tickets",
        headers=employee_headers,
        json=payload,
    )

    assert response.status_code == 422


def test_create_ticket_for_nonexistent_department(
    client,
    employee_headers,
):
    response = create_ticket(
        client,
        employee_headers,
        999999,
    )

    assert response.status_code == 404


def test_create_ticket_for_inactive_department(
    client,
    employee_headers,
    inactive_department,
):
    response = create_ticket(
        client,
        employee_headers,
        inactive_department.id,
    )

    assert response.status_code == 404


def test_list_tickets(client, employee_headers, created_ticket):
    response = client.get(
        "/support-tickets",
        headers=employee_headers,
    )

    assert response.status_code == 200
    assert any(
        item["id"] == created_ticket["id"]
        for item in response.json()
    )


def test_list_tickets_filter_by_status(
    client,
    employee_headers,
    created_ticket,
):
    response = client.get(
        "/support-tickets?status=OPEN",
        headers=employee_headers,
    )

    assert response.status_code == 200
    assert all(item["status"] == "OPEN" for item in response.json())


def test_list_tickets_filter_by_department(
    client,
    employee_headers,
    department,
    created_ticket,
):
    response = client.get(
        f"/support-tickets?department_id={department.id}",
        headers=employee_headers,
    )

    assert response.status_code == 200
    assert all(
        item["department_id"] == department.id
        for item in response.json()
    )


def test_get_ticket(client, employee_headers, created_ticket):
    response = client.get(
        f"/support-tickets/{created_ticket['id']}",
        headers=employee_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == created_ticket["id"]


def test_get_nonexistent_ticket(client, employee_headers):
    response = client.get(
        "/support-tickets/999999",
        headers=employee_headers,
    )

    assert response.status_code == 404


def test_create_ticket_logs_activity(
    client,
    employee_headers,
    department,
    created_ticket,
):
    response = client.get(
        f"/support-tickets/{created_ticket['id']}/history",
        headers=employee_headers,
    )

    assert response.status_code == 200
    assert any(
        item["action"] == "CREATED"
        for item in response.json()
    )


def test_add_comment(
    client,
    employee_headers,
    created_ticket,
):
    response = client.post(
        f"/support-tickets/{created_ticket['id']}/comments",
        headers=employee_headers,
        json={"comment": "Automated test comment"},
    )

    assert response.status_code == 201, response.text
    assert response.json()["comment"] == "Automated test comment"


def test_add_whitespace_comment_rejected(
    client,
    employee_headers,
    created_ticket,
):
    response = client.post(
        f"/support-tickets/{created_ticket['id']}/comments",
        headers=employee_headers,
        json={"comment": "   "},
    )

    assert response.status_code == 422


def test_list_comments(
    client,
    employee_headers,
    created_ticket,
):
    ticket_id = created_ticket["id"]

    created = client.post(
        f"/support-tickets/{ticket_id}/comments",
        headers=employee_headers,
        json={"comment": "Comment for list test"},
    )
    assert created.status_code == 201

    response = client.get(
        f"/support-tickets/{ticket_id}/comments",
        headers=employee_headers,
    )

    assert response.status_code == 200
    assert any(
        item["comment"] == "Comment for list test"
        for item in response.json()
    )


def test_comment_logs_activity(
    client,
    employee_headers,
    created_ticket,
):
    ticket_id = created_ticket["id"]

    response = client.post(
        f"/support-tickets/{ticket_id}/comments",
        headers=employee_headers,
        json={"comment": "Activity log test"},
    )
    assert response.status_code == 201

    history = client.get(
        f"/support-tickets/{ticket_id}/history",
        headers=employee_headers,
    )

    assert history.status_code == 200
    assert any(
        item["action"] == "COMMENTED"
        for item in history.json()
    )


def test_update_ticket_status(
    client,
    employee_headers,
    employee_in_department,
    created_ticket,
):
    response = client.patch(
        f"/support-tickets/{created_ticket['id']}/status",
        headers=employee_headers,
        json={"status": "IN_PROGRESS"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "IN_PROGRESS"


def test_resolve_ticket(
    client,
    employee_headers,
    employee_in_department,
    created_ticket,
):
    response = client.patch(
        f"/support-tickets/{created_ticket['id']}/status",
        headers=employee_headers,
        json={
            "status": "RESOLVED",
            "resolution_note": "Issue resolved by test",
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "RESOLVED"
    assert response.json()["resolution_note"] == "Issue resolved by test"
    assert response.json()["resolved_at"] is not None


def test_cannot_close_unresolved_ticket(
    client,
    employee_headers,
    employee_in_department,
    created_ticket,
):
    response = client.patch(
        f"/support-tickets/{created_ticket['id']}/status",
        headers=employee_headers,
        json={"status": "CLOSED"},
    )

    assert response.status_code == 400


def test_assignment_requires_department_membership(
    client,
    employee_headers,
    created_ticket,
):
    response = client.patch(
        f"/support-tickets/{created_ticket['id']}/assignment",
        headers=employee_headers,
        json={"assigned_to": 999999},
    )

    assert response.status_code == 403


def test_admin_can_assign_ticket_to_department_member(
    client,
    db,
    admin_headers,
    admin_user,
    department,
    created_ticket,
):
    from app.models.employee import Employee
    from app.models.employee_department import EmployeeDepartment

    user_employee = Employee(
        name="Admin Employee Profile",
        email="admin-employee-profile@test.com",
        phone="9876543211",
        user_id=admin_user.id,
        created_by=admin_user.id,
        is_active=True,
    )
    db.add(user_employee)
    db.flush()

    db.add(
        EmployeeDepartment(
            employee_id=user_employee.id,
            department_id=department.id,
        )
    )
    db.commit()

    response = client.patch(
        f"/support-tickets/{created_ticket['id']}/assignment",
        headers=admin_headers,
        json={"assigned_to": user_employee.id},
    )

    assert response.status_code == 200, response.text
    assert response.json()["assigned_to"] == user_employee.id


def test_delete_ticket(
    client,
    employee_headers,
    created_ticket,
):
    response = client.delete(
        f"/support-tickets/{created_ticket['id']}",
        headers=employee_headers,
    )

    assert response.status_code == 204


def test_deleted_ticket_cannot_be_retrieved(
    client,
    employee_headers,
    created_ticket,
):
    ticket_id = created_ticket["id"]

    deleted = client.delete(
        f"/support-tickets/{ticket_id}",
        headers=employee_headers,
    )
    assert deleted.status_code == 204

    response = client.get(
        f"/support-tickets/{ticket_id}",
        headers=employee_headers,
    )

    assert response.status_code == 404


def test_deleted_ticket_is_not_listed(
    client,
    employee_headers,
    created_ticket,
):
    ticket_id = created_ticket["id"]

    deleted = client.delete(
        f"/support-tickets/{ticket_id}",
        headers=employee_headers,
    )
    assert deleted.status_code == 204

    response = client.get(
        "/support-tickets",
        headers=employee_headers,
    )

    assert response.status_code == 200
    assert all(item["id"] != ticket_id for item in response.json())


def test_deleting_ticket_logs_activity(
    client,
    db,
    employee_headers,
    employee_user,
    department,
):
    from app.models.employee_department import EmployeeDepartment

    db.add(
        EmployeeDepartment(
            employee_id=employee_user.id,
            department_id=department.id,
        )
    )
    db.commit()

    created = create_ticket(
        client,
        employee_headers,
        department.id,
    )
    assert created.status_code == 201

    ticket_id = created.json()["id"]

    deleted = client.delete(
        f"/support-tickets/{ticket_id}",
        headers=employee_headers,
    )
    assert deleted.status_code == 204
