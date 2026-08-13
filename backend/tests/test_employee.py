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
            "role",
        }

def test_recreating_deleted_employee_creates_new_account(
    client,
    admin_headers,
    employee_user,
):
    old_employee_id = employee_user.id
    old_user_id = employee_user.user_id
    email = employee_user.email

    delete_response = client.delete(
        f"/employees/{old_employee_id}",
        headers=admin_headers,
    )

    assert delete_response.status_code == 200

    create_response = client.post(
        "/employees",
        headers=admin_headers,
        json={
            "name": "Brand New Person",
            "email": email,
            "phone": "9876543210",
            "password": "temporary-password-123",
            "role": "TEAM_MEMBER",
        },
    )

    assert create_response.status_code == 200

    data = create_response.json()

    assert data["id"] != old_employee_id
    assert data["user_id"] != old_user_id
    assert data["name"] == "Brand New Person"
    assert data["email"] == email
    assert data["phone"] == "9876543210"
    assert data["role"] == "TEAM_MEMBER"