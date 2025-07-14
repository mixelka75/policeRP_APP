#!/usr/bin/env python3
"""
Скрипт настройки RP Server Backend с Discord авторизацией
"""

import os
import secrets
import sys
from pathlib import Path


def generate_secret_key():
    """Генерация безопасного SECRET_KEY"""
    return secrets.token_urlsafe(64)


def create_env_file():
    """Создание .env файла из шаблона"""
    env_example = Path(".env.example")
    env_file = Path(".env")

    if not env_example.exists():
        print("❌ Файл .env.example не найден!")
        return False

    if env_file.exists():
        overwrite = input("🔍 Файл .env уже существует. Перезаписать? (y/N): ")
        if overwrite.lower() != 'y':
            print("⏭️  Пропускаем создание .env файла")
            return True

    # Читаем шаблон
    content = env_example.read_text()

    # Заменяем секретный ключ
    secret_key = generate_secret_key()
    content = content.replace(
        "super-secret-key-change-in-production-please-use-long-random-string",
        secret_key
    )

    # Записываем файл
    env_file.write_text(content)
    print("✅ Файл .env создан")
    return True


def collect_discord_config():
    """Сбор конфигурации Discord"""
    print("\n🎮 Настройка Discord OAuth2")
    print("=" * 50)

    discord_config = {}

    # Client ID
    client_id = input("Discord Client ID: ").strip()
    if not client_id:
        print("❌ Discord Client ID обязателен!")
        return None
    discord_config['DISCORD_CLIENT_ID'] = client_id

    # Client Secret
    client_secret = input("Discord Client Secret: ").strip()
    if not client_secret:
        print("❌ Discord Client Secret обязателен!")
        return None
    discord_config['DISCORD_CLIENT_SECRET'] = client_secret

    # Guild ID
    guild_id = input("Discord Guild ID (ID вашего сервера): ").strip()
    if not guild_id:
        print("❌ Discord Guild ID обязателен!")
        return None
    discord_config['DISCORD_GUILD_ID'] = guild_id

    # Role names
    police_role = input("Название роли полицейского [Полицейский]: ").strip()
    discord_config['DISCORD_POLICE_ROLE_NAME'] = police_role or "Полицейский"

    admin_role = input("Название роли администратора [Администратор сайта]: ").strip()
    discord_config['DISCORD_ADMIN_ROLE_NAME'] = admin_role or "Администратор сайта"

    # Redirect URI
    redirect_uri = input("Discord Redirect URI [http://localhost:8000/api/v1/auth/discord/callback]: ").strip()
    discord_config['DISCORD_REDIRECT_URI'] = redirect_uri or "http://localhost:8000/api/v1/auth/discord/callback"

    return discord_config


def collect_spworlds_config():
    """Сбор конфигурации SP-Worlds"""
    print("\n🌐 Настройка SP-Worlds API")
    print("=" * 50)

    use_spworlds = input("Использовать SP-Worlds интеграцию? (Y/n): ").strip()
    if use_spworlds.lower() == 'n':
        return {}

    spworlds_config = {}

    # Map ID
    map_id = input("SP-Worlds Map ID: ").strip()
    if map_id:
        spworlds_config['SPWORLDS_MAP_ID'] = map_id

    # Map Token
    map_token = input("SP-Worlds Map Token: ").strip()
    if map_token:
        spworlds_config['SPWORLDS_MAP_TOKEN'] = map_token

    # API URL
    api_url = input("SP-Worlds API URL [https://api.spworlds.ru]: ").strip()
    spworlds_config['SPWORLDS_API_URL'] = api_url or "https://api.spworlds.ru"

    return spworlds_config


def collect_app_config():
    """Сбор конфигурации приложения"""
    print("\n⚙️  Настройка приложения")
    print("=" * 50)

    app_config = {}

    # Frontend URL
    frontend_url = input("Frontend URL [http://localhost:3000]: ").strip()
    app_config['FRONTEND_URL'] = frontend_url or "http://localhost:3000"

    # Role check interval
    role_interval = input("Интервал проверки ролей в минутах [30]: ").strip()
    try:
        interval = int(role_interval) if role_interval else 30
        app_config['ROLE_CHECK_INTERVAL'] = str(interval)
    except ValueError:
        app_config['ROLE_CHECK_INTERVAL'] = "30"

    # Environment
    environment = input("Окружение (development/production) [development]: ").strip()
    app_config['ENVIRONMENT'] = environment or "development"

    # Debug
    debug = input("Включить режим отладки? (Y/n): ").strip()
    app_config['DEBUG'] = "true" if debug.lower() != 'n' else "false"

    return app_config


def update_env_file(discord_config, spworlds_config, app_config):
    """Обновление .env файла с настройками"""
    env_file = Path(".env")

    if not env_file.exists():
        print("❌ Файл .env не найден!")
        return False

    content = env_file.read_text()

    # Обновляем конфигурацию
    all_config = {**discord_config, **spworlds_config, **app_config}

    for key, value in all_config.items():
        # Ищем строку с этой переменной
        lines = content.split('\n')
        updated = False

        for i, line in enumerate(lines):
            if line.startswith(f"{key}="):
                lines[i] = f"{key}={value}"
                updated = True
                break

        if not updated:
            # Добавляем новую переменную
            lines.append(f"{key}={value}")

        content = '\n'.join(lines)

    # Записываем обновленный файл
    env_file.write_text(content)
    print("✅ Файл .env обновлен")
    return True


def show_next_steps():
    """Показать следующие шаги"""
    print("\n🎉 Настройка завершена!")
    print("=" * 50)
    print("📋 Следующие шаги:")
    print()
    print("1. Проверьте файл .env и убедитесь, что все настройки корректны")
    print("2. Установите зависимости:")
    print("   pip install -r requirements.txt")
    print()
    print("3. Выполните миграции базы данных:")
    print("   python -m alembic upgrade head")
    print()
    print("4. Запустите сервер:")
    print("   python -m uvicorn app.main:app --reload")
    print()
    print("5. Откройте в браузере:")
    print("   - API документация: http://localhost:8000/docs")
    print("   - Статус сервера: http://localhost:8000/health")
    print("   - Discord авторизация: http://localhost:8000/api/v1/auth/discord/login")
    print()
    print("📚 Документация: README_DISCORD_AUTH.md")
    print()


def main():
    """Основная функция"""
    print("🚀 Настройка RP Server Backend с Discord авторизацией")
    print("=" * 60)

    # Проверяем, что мы в правильной директории
    if not Path("app").exists() or not Path("requirements.txt").exists():
        print("❌ Запустите скрипт из корневой папки backend!")
        sys.exit(1)

    # Создаем .env файл
    if not create_env_file():
        sys.exit(1)

    print("\n📝 Сейчас мы настроим основные параметры приложения")
    print("💡 Вы можете оставить поля пустыми для значений по умолчанию")

    # Собираем конфигурацию
    discord_config = collect_discord_config()
    if not discord_config:
        print("❌ Конфигурация Discord обязательна!")
        sys.exit(1)

    spworlds_config = collect_spworlds_config()
    app_config = collect_app_config()

    # Обновляем .env файл
    if not update_env_file(discord_config, spworlds_config, app_config):
        sys.exit(1)

    # Показываем следующие шаги
    show_next_steps()


if __name__ == "__main__":
    main()