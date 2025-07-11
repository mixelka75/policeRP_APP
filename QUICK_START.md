# 📋 Документация изменений API для фронтенда

## 🔄 Изменения в схеме паспорта

### Новые поля в объекте Passport

```typescript
interface Passport {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  age: number;
  gender: "male" | "female";
  
  // ✨ НОВЫЕ ПОЛЯ:
  city: string;                    // Город проживания
  violations_count: number;        // Количество нарушений (автоподсчет)
  entry_date: string;             // Дата входа в город (ISO format)
  is_emergency: boolean;          // ЧС статус
  
  created_at: string;
  updated_at: string;
}
```

### Изменения в PassportCreate

```typescript
interface PassportCreate {
  first_name: string;
  last_name: string;
  nickname: string;
  age: number;
  gender: "male" | "female";
  city: string;  // ✨ НОВОЕ ОБЯЗАТЕЛЬНОЕ ПОЛЕ
  
  // violations_count, entry_date, is_emergency устанавливаются автоматически
}
```

### Изменения в PassportUpdate

```typescript
interface PassportUpdate {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  age?: number;
  gender?: "male" | "female";
  city?: string;  // ✨ НОВОЕ ПОЛЕ
  
  // is_emergency обновляется отдельным endpoint
}
```

## 🚨 Новый функционал ЧС

### Новая схема для работы с ЧС

```typescript
interface PassportEmergencyUpdate {
  is_emergency: boolean;
  reason?: string;  // Причина добавления/удаления из ЧС
}

interface PassportEmergencyResponse {
  id: number;
  nickname: string;
  is_emergency: boolean;
  message: string;  // Человеческое сообщение для UI
}
```

### API Endpoints для ЧС

#### 1. Добавить/убрать из ЧС
```http
POST /api/v1/passports/{passport_id}/emergency
Content-Type: application/json
Authorization: Bearer {token}

{
  "is_emergency": true,
  "reason": "Нарушение общественного порядка"
}
```

**Ответ:**
```json
{
  "id": 123,
  "nickname": "player123",
  "is_emergency": true,
  "message": "Житель player123 ДОБАВЛЕН В ЧС"
}
```

#### 2. Получить список паспортов в ЧС
```http
GET /api/v1/passports/emergency?skip=0&limit=100
Authorization: Bearer {token}
```

**Ответ:** массив объектов `Passport` с `is_emergency: true`

## 📊 Обновленные API endpoints

### 1. Получение паспортов (обновленный)
```http
GET /api/v1/passports?skip=0&limit=100&search=nick&city=London&emergency_only=true
```

**Новые параметры:**
- `city` - фильтр по городу
- `emergency_only` - показать только паспорта в ЧС

### 2. Создание паспорта (обновленный)
```http
POST /api/v1/passports
Content-Type: application/json

{
  "first_name": "Иван",
  "last_name": "Петров",
  "nickname": "ivan_petrov",
  "age": 25,
  "gender": "male",
  "city": "Москва"  // ✨ НОВОЕ ОБЯЗАТЕЛЬНОЕ ПОЛЕ
}
```

**Ответ содержит новые поля:**
```json
{
  "id": 123,
  "first_name": "Иван",
  "last_name": "Петров",
  "nickname": "ivan_petrov",
  "age": 25,
  "gender": "male",
  "city": "Москва",
  "violations_count": 0,
  "entry_date": "2025-07-11T10:30:00Z",
  "is_emergency": false,
  "created_at": "2025-07-11T10:30:00Z",
  "updated_at": "2025-07-11T10:30:00Z"
}
```

Это все изменения, которые нужно внести во фронтенд для поддержки новой функциональности!