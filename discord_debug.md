# Discord Integration Debug Guide

## Диагностика проблем Discord интеграции

### 1. Проверка настроек Discord Application

Зайдите в Discord Developer Portal: https://discord.com/developers/applications

**OAuth2 настройки:**
- Client ID: `1394322457694961698`
- Redirect URIs должны включать:
  ```
  https://apipolice.test.yuuri.online/api/v1/auth/discord/callback
  http://localhost:8000/api/v1/auth/discord/callback
  ```
- Scopes: `identify guilds`

### 2. Проверка настроек Discord Bot

**Обязательные настройки бота:**
1. Bot должен быть добавлен на сервер с ID: `1362354154432888993`
2. В разделе "Bot" включить **Privileged Gateway Intents**:
   - ✅ **SERVER MEMBERS INTENT** (обязательно!)
   - ✅ **MESSAGE CONTENT INTENT** (рекомендуется)

3. Права бота на сервере (минимальные):
   - Read Messages/View Channels
   - Read Message History

### 3. Проверка ролей на Discord сервере

**Обязательные роли с точными ID:**
- Администратор сайта: `1394325091734523994`
- Полицейский: `1394325151788830780`

**Как проверить ID ролей:**
1. Включить Developer Mode в Discord (User Settings → Advanced → Developer Mode)
2. ПКМ на роль → Copy ID

### 4. Тестирование интеграции

**Проверочные запросы:**

```bash
# 1. Проверить доступность Discord API
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
  https://discord.com/api/v10/guilds/1362354154432888993

# 2. Проверить участника сервера
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
  https://discord.com/api/v10/guilds/1362354154432888993/members/USER_ID

# 3. Проверить роли сервера
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
  https://discord.com/api/v10/guilds/1362354154432888993/roles
```

### 5. Логи для диагностики

**В коде уже есть отладочные сообщения. Проверьте логи на:**

```bash
# Проверить логи бэкенда
docker logs policeRP_backend

# Или через make
make logs-backend

# Искать строки с "DEBUG:"
docker logs policeRP_backend 2>&1 | grep DEBUG
```

### 6. Частые ошибки

**401/403 ошибки при авторизации:**
- Неверный Client Secret
- Неверный redirect URI
- Бот не добавлен на сервер

**"Missing Access" ошибки:**
- Не включен SERVER MEMBERS INTENT
- Бот не имеет прав на сервере

**Роли не определяются:**
- Неверные ID ролей в .env
- Пользователь не имеет нужных ролей
- Роли изменились после создания конфига

### 7. Проверочный чек-лист

- [ ] Discord Application создано
- [ ] Client ID и Secret правильные
- [ ] Redirect URI содержит продакшн домен
- [ ] Bot токен действительный
- [ ] Bot добавлен на сервер
- [ ] SERVER MEMBERS INTENT включен
- [ ] ID ролей актуальные
- [ ] Пользователь имеет нужную роль на сервере
- [ ] Сервер ID правильный

### 8. Команды для проверки

```bash
# Проверить переменные окружения в контейнере
docker exec policeRP_backend env | grep DISCORD

# Перезапустить бэкенд после изменения настроек
docker-compose restart backend

# Проверить подключение к Discord API
docker exec policeRP_backend python -c "
import asyncio
from app.clients.discord import discord_client
from app.core.config import settings

async def test():
    try:
        roles = await discord_client.get_guild_roles(settings.DISCORD_GUILD_ID, settings.DISCORD_BOT_TOKEN)
        print('Roles:', roles)
    except Exception as e:
        print('Error:', e)

asyncio.run(test())
"
```