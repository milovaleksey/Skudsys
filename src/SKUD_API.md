# SKUD API Documentation

## Обзор

API для работы с базой данных СКУД (Система Контроля и Управления Доступом).  
Предоставляет доступ к данным о проходах, местоположении людей, информации о студентах и сотрудниках.

## Конфигурация

Добавьте в `.env` файл backend:

```bash
# Основная база данных (управление пользователями, ролями)
DB_HOST=localhost
DB_PORT=3306
DB_USER=utmn_user
DB_PASSWORD=your_password
DB_NAME=utmn_security

# База данных СКУД (данные о проходах, студентах, сотрудниках)
# Если не указаны, используются настройки из основной базы
SKUD_DB_HOST=localhost
SKUD_DB_PORT=3306
SKUD_DB_USER=utmn_user
SKUD_DB_PASSWORD=your_password
SKUD_DB_NAME=utmn_security
SKUD_DB_CONNECTION_LIMIT=10
```

## Endpoints

### 1. Поиск по идентификатору

Поиск сотрудников и студентов по номеру карты, ФИО, email.

```
GET /v1/skud/search?query={searchQuery}
GET /api/skud/search?query={searchQuery}
```

**Параметры:**
- `query` (required) - Поисковый запрос (номер карты, ФИО, email)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "identifier": "123.456789",
      "identifierType": "employee",
      "fullName": "Иванов Иван Иванович",
      "email": "ivanov@utmn.ru",
      "position": "Доцент кафедры информатики",
      "department": "Институт математики и компьютерных наук",
      "cardNumber": "1234567890123",
      "lastSeen": "2026-02-28 14:30:15",
      "location": "Главный вход, корпус А",
      "status": "active"
    }
  ],
  "count": 1
}
```

**Права доступа:** `identifier-search`

---

### 2. Журнал проходов

Получение журнала проходов с фильтрацией.

```
GET /v1/skud/passes
GET /api/skud/passes
```

**Параметры:**
- `startDate` (optional) - Дата начала периода (YYYY-MM-DD HH:mm:ss)
- `endDate` (optional) - Дата окончания периода (YYYY-MM-DD HH:mm:ss)
- `personType` (optional) - Тип персоны: `student`, `employee`, `guest`
- `accessPointId` (optional) - ID точки доступа
- `direction` (optional) - Направление: `in`, `out`
- `limit` (optional, default: 100) - Количество записей
- `offset` (optional, default: 0) - Смещение для пагинации

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "personType": "employee",
      "personName": "Иванов Иван Иванович",
      "cardNumber": "1234567890123",
      "direction": "in",
      "accessTime": "2026-02-28 09:15:42",
      "accessPointName": "Главный вход",
      "accessPointLocation": "Корпус А, 1 этаж",
      "building": "Корпус А"
    }
  ],
  "total": 523
}
```

**Права доступа:** `passes`

---

### 3. Местоположение человека

Поиск последнего местоположения человека по ФИО или номеру карты.

```
GET /v1/skud/location?query={searchQuery}
GET /api/skud/location?query={searchQuery}
```

**Параметры:**
- `query` (required) - Поисковый запрос (ФИО, номер карты)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "personType": "employee",
    "personName": "Иванов Иван Иванович",
    "cardNumber": "1234567890123",
    "direction": "in",
    "lastAccessTime": "2026-02-28 14:30:15",
    "accessPointName": "Главный вход",
    "accessPointLocation": "Корпус А, 1 этаж",
    "building": "Корпус А",
    "accessPointType": "entrance",
    "currentStatus": "Находится внутри"
  }
}
```

**Права доступа:** `location`

---

### 4. Список точек доступа

Получение списка активных точек доступа.

```
GET /v1/skud/access-points
GET /api/skud/access-points
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Главный вход",
      "location": "Корпус А, 1 этаж",
      "type": "entrance",
      "building": "Корпус А",
      "isActive": true
    }
  ]
}
```

**Права доступа:** `passes`

---

## Структура базы данных

### Таблица: employees
```sql
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(200),
    position VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Таблица: students
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    faculty VARCHAR(200),
    course INT,
    group_number VARCHAR(50),
    is_foreign BOOLEAN NOT NULL DEFAULT FALSE,
    country VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Таблица: access_logs
```sql
CREATE TABLE access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    access_point_id INT NOT NULL,
    person_type ENUM('student', 'employee', 'guest') NOT NULL,
    person_id INT,
    person_name VARCHAR(200),
    card_number VARCHAR(50),
    direction ENUM('in', 'out') NOT NULL,
    access_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (access_point_id) REFERENCES access_points(id)
);
```

### Таблица: access_points
```sql
CREATE TABLE access_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(500) NOT NULL,
    type ENUM('entrance', 'exit', 'internal') NOT NULL,
    building VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Использование в Frontend

```typescript
import { skudApi } from '../lib/api';

// Поиск по идентификатору
const response = await skudApi.searchByIdentifier('123.456789');
if (response.success) {
  console.log(response.data);
}

// Получение журнала проходов
const passes = await skudApi.getPassesReport({
  startDate: '2026-02-01 00:00:00',
  endDate: '2026-02-28 23:59:59',
  personType: 'employee',
  limit: 50
});

// Поиск местоположения
const location = await skudApi.getPersonLocation('Иванов');

// Список точек доступа
const points = await skudApi.getAccessPoints();
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверные параметры запроса |
| 401 | Требуется авторизация |
| 403 | Недостаточно прав доступа |
| 500 | Внутренняя ошибка сервера |

---

## Примечания

1. **Два подключения к базе данных:**
   - Основная БД (`database.js`) - пользователи, роли, сессии
   - СКУД БД (`skudDatabase.js`) - проходы, студенты, сотрудники

2. **Производительность:**
   - Используются индексы на всех полях поиска
   - Window functions для оптимизации запросов последних проходов
   - Connection pooling с лимитом 10 подключений

3. **Безопасность:**
   - Все endpoint требуют аутентификации
   - Проверка прав доступа через middleware
   - Параметризованные запросы для защиты от SQL injection

4. **Кодировка:**
   - UTF-8 (utf8mb4) для поддержки кириллицы и эмодзи
