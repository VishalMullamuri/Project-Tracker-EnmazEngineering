def test_team_member_employee_response_contains_only_allowed_fields(
    client,
    employee_headers,
    employee_user,
):
    response = client.get(
        "/employees",
        headers=employee_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1

    for employee in data:
        assert set(employee.keys()) == {"id", "name"}


def test_team_member_can_get_own_employee_response(
    client,
    employee_headers,
    employee_user,
):
    response = client.get(
        f"/employees/{employee_user.id}",
        headers=employee_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert set(data.keys()) == {"id", "name"}


def test_admin_employee_response_contains_full_fields(
    client,
    admin_headers,
    employee_user,
):
    response = client.get(
        "/employees",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1

    for employee in data:
        assert set(employee.keys()) == {
            "id",
            "user_id",
            "name",
            "email",
            "phone",
        }
