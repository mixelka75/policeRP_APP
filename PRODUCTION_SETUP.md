# Руководство по развертыванию в продакшене

Данное руководство поможет вам развернуть приложение PoliceRP в продакшене с использованием nginx в качестве обратного прокси и certbot для SSL сертификатов.

## Предварительные требования

- Ubuntu/Debian сервер с root доступом
- Домены, настроенные на ваш сервер:
  - `police.test.yuuri.online` (фронтенд)
  - `apipolice.test.yuuri.online` (backend API)

## 1. Установка Docker и Docker Compose

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить зависимости
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release -y

# Добавить GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавить репозиторий Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновить индекс пакетов
sudo apt update

# Установить Docker Engine
sudo apt install docker-ce docker-ce-cli containerd.io -y

# Запустить и добавить в автозагрузку
sudo systemctl start docker
sudo systemctl enable docker

# Добавить пользователя в группу docker (необязательно, но удобно)
sudo usermod -aG docker $USER

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверить установку
docker --version
docker-compose --version
```

**Важно:** После добавления пользователя в группу docker, перезайдите в систему или выполните `newgrp docker`.

## 2. Установка Nginx

```bash
# Обновить список пакетов
sudo apt update

# Установить nginx
sudo apt install nginx -y

# Запустить и добавить в автозагрузку
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверить статус
sudo systemctl status nginx
```

## 2. Установка Certbot

```bash
# Установить snapd если не установлен
sudo apt install snapd -y

# Установить certbot через snap
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Создать символическую ссылку
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

## 3. Настройка Nginx

**Важно:** Сначала нужно настроить временную конфигурацию без SSL, так как сертификаты еще не созданы.

```bash
# Удалить стандартную конфигурацию nginx
sudo rm /etc/nginx/sites-enabled/default

# Скопировать временную конфигурацию без SSL
sudo cp nginx-temp.conf /etc/nginx/sites-available/policeRP-temp
sudo ln -s /etc/nginx/sites-available/policeRP-temp /etc/nginx/sites-enabled/

# Проверить конфигурацию nginx
sudo nginx -t

# Перезагрузить nginx
sudo systemctl reload nginx
```

## 4. Получение SSL сертификатов

```bash
# Получить сертификат для домена фронтенда
sudo certbot --nginx -d police.test.yuuri.online

# Получить сертификат для домена бэкенда
sudo certbot --nginx -d apipolice.test.yuuri.online
```

При запросе:
- Введите ваш email для уведомлений о продлении
- Согласитесь с условиями использования (введите 'Y')
- Выберите, делиться ли email с EFF (необязательно)
- Выберите опцию 2 для перенаправления HTTP на HTTPS

**После получения сертификатов замените на полную конфигурацию:**

```bash
# Удалить временную конфигурацию
sudo rm /etc/nginx/sites-enabled/policeRP-temp

# Установить полную конфигурацию с SSL
sudo cp nginx.conf /etc/nginx/sites-available/policeRP
sudo ln -s /etc/nginx/sites-available/policeRP /etc/nginx/sites-enabled/

# Проверить конфигурацию с SSL
sudo nginx -t

# Перезагрузить nginx
sudo systemctl reload nginx
```

## 5. Настройка автоматического продления

```bash
# Тестировать автоматическое продление
sudo certbot renew --dry-run

# Проверить, настроена ли cron задача
sudo crontab -l

# Если нет, добавить cron задачу для автоматического продления
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 6. Запуск сервисов приложения

```bash
# Перейти в директорию проекта
cd /path/to/policeRP_APP

# Обновить переменные окружения для продакшена
# Отредактировать backend/.env.docker и frontend/.env

# Запустить сервисы с Docker Compose
make up

# Или вручную:
docker-compose up -d
```

## 7. Проверка настройки

```bash
# Проверить статус nginx
sudo systemctl status nginx

# Проверить конфигурацию nginx
sudo nginx -t

# Проверить SSL сертификаты
sudo certbot certificates

# Проверить контейнеры приложения
docker ps

# Тестировать эндпоинты
curl -I https://police.test.yuuri.online
curl -I https://apipolice.test.yuuri.online/api/v1/
```

## 8. Настройка файрвола

```bash
# Разрешить HTTP и HTTPS трафик
sudo ufw allow 'Nginx Full'

# Разрешить SSH (если еще не разрешен)
sudo ufw allow ssh

# Включить файрвол
sudo ufw enable

# Проверить статус
sudo ufw status
```

## 9. Мониторинг и логи

```bash
# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи приложения
make logs
make logs-backend
make logs-frontend

# Статус SSL сертификатов
sudo certbot certificates
```

## Конфигурация окружения

### Backend (.env.docker)
Обновите следующие переменные для продакшена:

```env
# URL API для фронтенда
FRONTEND_URL=https://police.test.yuuri.online

# CORS origins
CORS_ORIGINS=["https://police.test.yuuri.online"]

# Discord OAuth redirect URI
DISCORD_REDIRECT_URI=https://apipolice.test.yuuri.online/api/v1/auth/discord/callback
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://apipolice.test.yuuri.online/api/v1
```

## Устранение неполадок

### Проблемы с Nginx
```bash
# Проверить синтаксис конфигурации nginx
sudo nginx -t

# Перезагрузить конфигурацию nginx
sudo systemctl reload nginx

# Перезапустить nginx
sudo systemctl restart nginx
```

### Проблемы с SSL сертификатами
```bash
# Проверить истечение сертификатов
sudo certbot certificates

# Вручную продлить сертификаты
sudo certbot renew

# Тестировать SSL конфигурацию
openssl s_client -connect police.test.yuuri.online:443
```

#### Ошибка: "не может загрузить сертификат"

Если получаете ошибку "cannot load certificate", это означает, что сертификаты еще не созданы. Выполните:

```bash
# Удалить текущую конфигурацию с SSL
sudo rm /etc/nginx/sites-enabled/policeRP

# Скопировать временную конфигурацию без SSL
sudo cp nginx-temp.conf /etc/nginx/sites-available/policeRP-temp
sudo ln -s /etc/nginx/sites-available/policeRP-temp /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить nginx
sudo systemctl reload nginx

# Получить сертификаты
sudo certbot --nginx -d police.test.yuuri.online
sudo certbot --nginx -d apipolice.test.yuuri.online

# После получения сертификатов, заменить на полную конфигурацию
sudo rm /etc/nginx/sites-enabled/policeRP-temp
sudo cp nginx.conf /etc/nginx/sites-available/policeRP
sudo ln -s /etc/nginx/sites-available/policeRP /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Проблемы с приложением
```bash
# Проверить логи контейнеров
docker logs policeRP_backend
docker logs policeRP_frontend

# Перезапустить контейнеры
docker-compose restart

# Проверить подключение к базе данных
docker exec -it policeRP_backend python -c "from app.database import engine; print(engine.execute('SELECT 1').fetchone())"
```

## Рекомендации по безопасности

1. **Поддерживайте систему в актуальном состоянии**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Настройте fail2ban** (необязательно, но рекомендуется):
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

3. **Регулярные резервные копии**:
   - Резервные копии базы данных
   - Резервные копии данных приложения
   - Резервные копии SSL сертификатов

4. **Регулярно мониторьте логи**:
   - Логи доступа/ошибок Nginx
   - Логи приложения
   - Системные логи

## Обслуживание

### Регулярные задачи
- Проверять истечение SSL сертификатов ежемесячно
- Обновлять системные пакеты ежемесячно
- Мониторить дисковое пространство и производительность
- Просматривать логи приложения на наличие ошибок
- Делать резервные копии базы данных еженедельно

### Обновления
1. Получить последние изменения кода
2. Пересобрать Docker образы: `make build`
3. Обновить схему базы данных: `docker exec policeRP_backend alembic upgrade head`
4. Перезапустить сервисы: `make down && make up`
5. Протестировать функциональность