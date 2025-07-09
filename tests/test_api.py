"""
Тесты для API РП сервера
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Добавляем backend директорию в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Тест корневого эндпоинта"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "РП Сервер API"
    assert data["status"] == "running"


def test_health_check():
    """Тест проверки здоровья сервиса"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_login_success():
    """Тест успешной авторизации"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"


def test_login_failure():
    """Тест неудачной авторизации"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "wrong_password"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_unauthorized_access():
    """Тест доступа без авторизации"""
    response = client.get("/api/v1/passports/")
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Not authenticated"


def test_passports_with_auth():
    """Тест доступа к паспортам с авторизацией"""
    # Получаем токен
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Тестируем доступ к паспортам
    response = client.get(
        "/api/v1/passports/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_passport():
    """Тест создания паспорта"""
    # Получаем токен
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Создаем паспорт
    passport_data = {
        "first_name": "Иван",
        "last_name": "Петров",
        "nickname": "ivan_test",
        "age": 25,
        "gender": "male"
    }
    
    response = client.post(
        "/api/v1/passports/",
        json=passport_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Проверяем результат
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Иван"
    assert data["last_name"] == "Петров"
    assert data["nickname"] == "ivan_test"
    assert data["age"] == 25
    assert data["gender"] == "male"


def test_create_fine():
    """Тест создания штрафа"""
    # Получаем токен
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Сначала создаем паспорт
    passport_data = {
        "first_name": "Петр",
        "last_name": "Иванов",
        "nickname": "petr_test",
        "age": 30,
        "gender": "male"
    }
    
    passport_response = client.post(
        "/api/v1/passports/",
        json=passport_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    passport_id = passport_response.json()["id"]
    
    # Создаем штраф
    fine_data = {
        "passport_id": passport_id,
        "article": "Превышение скорости",
        "amount": 5000,
        "description": "Превышение на 20 км/ч"
    }
    
    response = client.post(
        "/api/v1/fines/",
        json=fine_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Проверяем результат
    assert response.status_code == 200
    data = response.json()
    assert data["passport_id"] == passport_id
    assert data["article"] == "Превышение скорости"
    assert data["amount"] == 5000


def test_get_user_info():
    """Тест получения информации о текущем пользователе"""
    # Получаем токен
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Получаем информацию о пользователе
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"
    assert data["is_active"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])