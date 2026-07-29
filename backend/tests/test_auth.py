import pytest


def test_login_success(client, admin_user):
    response = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "ADMIN"


def test_login_invalid_password(client, admin_user):
    response = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_invalid_email(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "unknown@test.com",
            "password": "Admin@123",
        },
    )

    assert response.status_code == 401


def test_get_current_user(client, admin_headers, admin_user):
    response = client.get(
        "/auth/me",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == "admin@test.com"
    assert data["role"] == "ADMIN"


def test_get_current_user_without_token(client):
    response = client.get("/auth/me")

    assert response.status_code in [401, 403]


def test_change_password(
    client,
    admin_headers,
    admin_user,
):
    response = client.put(
        "/auth/change-password",
        headers=admin_headers,
        json={
            "current_password": "Admin@123",
            "new_password": "NewAdmin@123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["first_login"] is False


def test_token_invalid_after_password_change(
    client,
    admin_user,
):
    login = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123",
        },
    )

    token = login.json()["access_token"]

    response = client.put(
        "/auth/change-password",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "current_password": "Admin@123",
            "new_password": "NewAdmin@123",
        },
    )

    assert response.status_code == 200

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 401


def test_old_password_no_longer_works(
    client,
    admin_headers,
    admin_user,
):
    response = client.put(
        "/auth/change-password",
        headers=admin_headers,
        json={
            "current_password": "Admin@123",
            "new_password": "NewAdmin@123",
        },
    )

    assert response.status_code == 200

    response = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123",
        },
    )

    assert response.status_code == 401


def test_new_password_works(
    client,
    admin_headers,
    admin_user,
):
    response = client.put(
        "/auth/change-password",
        headers=admin_headers,
        json={
            "current_password": "Admin@123",
            "new_password": "NewAdmin@123",
        },
    )

    assert response.status_code == 200

    response = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "NewAdmin@123",
        },
    )

    assert response.status_code == 200

def test_token_for_deleted_user(
    client,
    db,
    admin_user,
):
    login_response = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    admin_user.is_active = False
    admin_user.token_version += 1
    db.commit()

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 401

def test_weak_password_rejected(
    client,
    admin_headers,
    admin_user,
):
    response = client.put(
        "/auth/change-password",
        headers=admin_headers,
        json={
            "current_password": "Admin@123",
            "new_password": "Weak123",
        },
    )

    assert response.status_code == 422