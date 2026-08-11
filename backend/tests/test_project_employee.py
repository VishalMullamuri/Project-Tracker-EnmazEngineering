from datetime import date
from unittest.mock import patch


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

    with patch("app.api.project_employee.logger.warning") as mock_warning:
        assign_response = client.post(
            "/project-employees",
            headers=manager_headers,
            json={
                "project_id": project_id,
                "employee_id": employee_id,
            },
        )

    assert assign_response.status_code == 200

    mock_warning.assert_called_once()
    assert "Project employee assigned:" in mock_warning.call_args.args[0]
