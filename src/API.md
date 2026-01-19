# API Документация
## Система безопасности инфраструктуры ТюмГУ

**Версия API:** v1  
**Base URL:** `https://security.utmn.ru/api/v1`  
**Формат данных:** JSON  
**Кодировка:** UTF-8

---

## Содержание

1. [Общая информация](#общая-информация)
2. [Аутентификация](#аутентификация)
3. [Авторизация](#авторизация)
4. [Отчеты о проходах](#отчеты-о-проходах)
5. [Местонахождение людей](#местонахождение-людей)
6. [Студенты](#студенты)
7. [Сотрудники](#сотрудники)
8. [Парковочная система](#парковочная-система)
9. [Аналитика](#аналитика)
10. [Система хранения вещей](#система-хранения-вещей)
11. [Иностранные студенты](#иностранные-студенты)
12. [Коды ответов](#коды-ответов)
13. [Обработка ошибок](#обработка-ошибок)

---

## Общая информация

### Формат запросов

Все запросы должны содержать заголовок:
```
Content-Type: application/json
```

Для защищенных эндпоинтов требуется JWT токен:
```
Authorization: Bearer <token>
```

### Rate Limiting

- **Лимит:** 100 запросов в минуту на IP-адрес
- **Лимит для авторизованных:** 1000 запросов в минуту на пользователя

При превышении лимита:
```json
{
  "error": "Too Many Requests",
  "message": "Превышен лимит запросов",
  "retry_after": 60
}
```

### Пагинация

Все эндпоинты, возвращающие списки, поддерживают пагинацию:

**Параметры:**
- `page` (integer, default: 1) - Номер страницы
- `limit` (integer, default: 20, max: 100) - Количество записей на странице

**Формат ответа:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## Аутентификация

### Проверка доступности API

```http
GET /health
```

**Описание:** Проверка работоспособности API

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T12:00:00Z",
  "version": "1.0.0"
}
```

---

## Авторизация

### Локальная авторизация

```http
POST /auth/login
```

**Описание:** Авторизация с использованием логина и пароля

**Тело запроса:**
```json
{
  "username": "ivanov@utmn.ru",
  "password": "SecurePassword123!"
}
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400,
  "user": {
    "id": 123,
    "username": "ivanov@utmn.ru",
    "full_name": "Иванов Иван Иванович",
    "email": "ivanov@utmn.ru",
    "role": "admin",
    "avatar": "https://security.utmn.ru/avatars/123.jpg"
  }
}
```

**Ошибка (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Неверный логин или пароль"
}
```

---

### SSO Авторизация

```http
GET /auth/sso
```

**Описание:** Инициализация авторизации через SSO UTMN

**Ответ:** Редирект на страницу SSO UTMN

---

```http
GET /auth/sso/callback
```

**Описание:** Callback эндпоинт после успешной авторизации через SSO

**Параметры запроса:**
- `code` (string, required) - Авторизационный код от SSO
- `state` (string, required) - State для защиты от CSRF

**Успешный ответ:** Редирект на frontend с токеном

---

### Обновление токена

```http
POST /auth/refresh
```

**Описание:** Обновление access token с использованием refresh token

**Тело запроса:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

---

### Выход из системы

```http
POST /auth/logout
```

**Описание:** Выход из системы (инвалидация токена)

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "message": "Вы успешно вышли из системы"
}
```

---

### Получение текущего пользователя

```http
GET /auth/me
```

**Описание:** Получение информации о текущем авторизованном пользователе

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200):**
```json
{
  "id": 123,
  "username": "ivanov@utmn.ru",
  "full_name": "Иванов Иван Иванович",
  "email": "ivanov@utmn.ru",
  "role": "admin",
  "avatar": "https://security.utmn.ru/avatars/123.jpg",
  "created_at": "2025-01-15T10:30:00Z",
  "last_login": "2026-01-19T08:15:00Z"
}
```

---

## Отчеты о проходах

### Получение списка проходов

```http
GET /passes
```

**Описание:** Получение списка всех проходов через контрольные точки

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `page` (integer, optional) - Номер страницы
- `limit` (integer, optional) - Количество записей
- `full_name` (string, optional) - Фильтр по ФИО
- `upn` (string, optional) - Фильтр по UPN
- `card_number` (string, optional) - Фильтр по номеру карты
- `checkpoint` (string, optional) - Фильтр по контрольной точке
- `date_from` (string, optional) - Дата от (ISO 8601: YYYY-MM-DD)
- `date_to` (string, optional) - Дата до (ISO 8601: YYYY-MM-DD)
- `sort_by` (string, optional) - Поле сортировки (time, full_name, checkpoint)
- `sort_order` (string, optional) - Порядок сортировки (asc, desc)

**Пример запроса:**
```
GET /passes?full_name=Иванов&date_from=2026-01-01&date_to=2026-01-19&page=1&limit=20
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "time": "2026-01-19T08:15:32Z",
      "full_name": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "card_number": "1234567890",
      "checkpoint": "Главный вход, корпус А",
      "direction": "in",
      "photo_url": "https://security.utmn.ru/photos/pass_1.jpg"
    },
    {
      "id": 2,
      "time": "2026-01-19T08:22:15Z",
      "full_name": "Петрова Мария Сергеевна",
      "upn": "petrova@study.utmn.ru",
      "card_number": "0987654321",
      "checkpoint": "Вход, корпус Б",
      "direction": "in",
      "photo_url": "https://security.utmn.ru/photos/pass_2.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 152,
    "total_pages": 8
  }
}
```

---

### Получение информации о конкретном проходе

```http
GET /passes/:id
```

**Описание:** Получение детальной информации о конкретном проходе

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "time": "2026-01-19T08:15:32Z",
    "full_name": "Иванов Иван Иванович",
    "upn": "ivanov@utmn.ru",
    "card_number": "1234567890",
    "checkpoint": "Главный вход, корпус А",
    "direction": "in",
    "photo_url": "https://security.utmn.ru/photos/pass_1.jpg",
    "user": {
      "id": 123,
      "role": "employee",
      "department": "Институт математики и компьютерных наук",
      "position": "Профессор"
    },
    "device": {
      "id": "TURNSTILE_001",
      "name": "Турникет главного входа А",
      "location": "Корпус А, 1 этаж"
    }
  }
}
```

---

### Статистика по проходам

```http
GET /passes/statistics
```

**Описание:** Получение статистики по проходам

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до
- `group_by` (string, optional) - Группировка (hour, day, week, month, checkpoint)

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "total_passes": 15234,
    "unique_users": 1842,
    "by_direction": {
      "in": 7620,
      "out": 7614
    },
    "by_checkpoint": [
      {
        "checkpoint": "Главный вход, корпус А",
        "count": 5234
      },
      {
        "checkpoint": "Вход, корпус Б",
        "count": 3421
      },
      {
        "checkpoint": "Общежитие №1",
        "count": 2156
      }
    ],
    "by_hour": [
      { "hour": "08:00", "count": 1234 },
      { "hour": "09:00", "count": 1456 },
      { "hour": "10:00", "count": 987 }
    ]
  }
}
```

---

### Экспорт проходов

```http
POST /passes/export
```

**Описание:** Экспорт данных о проходах в формате Excel или CSV

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "format": "xlsx",
  "filters": {
    "full_name": "Иванов",
    "date_from": "2026-01-01",
    "date_to": "2026-01-19"
  }
}
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "download_url": "https://security.utmn.ru/exports/passes_20260119_123456.xlsx",
  "expires_at": "2026-01-19T14:00:00Z"
}
```

---

## Местонахождение людей

### Поиск местонахождения

```http
GET /location/search
```

**Описание:** Поиск текущего местонахождения людей

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `query` (string, required) - ФИО или UPN для поиска (минимум 3 символа)
- `limit` (integer, optional) - Количество результатов (default: 10)

**Пример запроса:**
```
GET /location/search?query=Иванов
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 123,
      "full_name": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "role": "employee",
      "last_checkpoint": "Главный вход, корпус А",
      "last_seen": "2026-01-19T08:15:32Z",
      "direction": "in",
      "current_location": "Корпус А",
      "status": "inside"
    },
    {
      "user_id": 456,
      "full_name": "Иванова Мария Петровна",
      "upn": "ivanova@study.utmn.ru",
      "role": "student",
      "last_checkpoint": "Библиотека",
      "last_seen": "2026-01-19T09:30:12Z",
      "direction": "in",
      "current_location": "Библиотека",
      "status": "inside"
    }
  ]
}
```

---

### Получение истории перемещений

```http
GET /location/:userId/history
```

**Описание:** Получение истории перемещений конкретного пользователя

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до
- `limit` (integer, optional) - Количество записей

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "full_name": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru"
    },
    "history": [
      {
        "id": 1,
        "checkpoint": "Главный вход, корпус А",
        "time": "2026-01-19T08:15:32Z",
        "direction": "in"
      },
      {
        "id": 2,
        "checkpoint": "Библиотека",
        "time": "2026-01-19T10:30:15Z",
        "direction": "in"
      },
      {
        "id": 3,
        "checkpoint": "Библиотека",
        "time": "2026-01-19T12:45:22Z",
        "direction": "out"
      }
    ]
  }
}
```

---

### Список людей в здании

```http
GET /location/inside
```

**Описание:** Получение списка всех людей, находящихся в зданиях университета

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `building` (string, optional) - Фильтр по корпусу (А, Б, В и т.д.)
- `role` (string, optional) - Фильтр по роли (student, employee)
- `page` (integer, optional) - Номер страницы
- `limit` (integer, optional) - Количество записей

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 123,
      "full_name": "Иванов Иван Иванович",
      "role": "employee",
      "current_location": "Корпус А",
      "last_checkpoint": "Главный вход, корпус А",
      "entered_at": "2026-01-19T08:15:32Z",
      "duration": "4h 30m"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 342,
    "total_pages": 18
  },
  "summary": {
    "total_inside": 342,
    "students": 285,
    "employees": 57
  }
}
```

---

## Студенты

### Получение списка студентов

```http
GET /students
```

**Описание:** Получение списка студентов с информацией о проходах

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `page` (integer, optional) - Номер страницы
- `limit` (integer, optional) - Количество записей
- `full_name` (string, optional) - Фильтр по ФИО
- `upn` (string, optional) - Фильтр по UPN
- `course` (integer, optional) - Фильтр по курсу (1-5)
- `group` (string, optional) - Фильтр по группе
- `faculty` (string, optional) - Фильтр по факультету
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": "STU2023001",
      "full_name": "Петрова Мария Сергеевна",
      "upn": "petrova@study.utmn.ru",
      "email": "petrova@study.utmn.ru",
      "card_number": "0987654321",
      "course": 3,
      "group": "МАТ-31",
      "faculty": "Институт математики и компьютерных наук",
      "last_pass": {
        "time": "2026-01-19T08:22:15Z",
        "checkpoint": "Вход, корпус Б"
      },
      "total_passes": 156,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1842,
    "total_pages": 93
  }
}
```

---

### Получение информации о студенте

```http
GET /students/:id
```

**Описание:** Получение детальной информации о конкретном студенте

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": "STU2023001",
    "full_name": "Петрова Мария Сергеевна",
    "upn": "petrova@study.utmn.ru",
    "email": "petrova@study.utmn.ru",
    "phone": "+7 (912) 345-67-89",
    "card_number": "0987654321",
    "course": 3,
    "group": "МАТ-31",
    "faculty": "Институт математики и компьютерных наук",
    "enrollment_date": "2023-09-01",
    "status": "active",
    "statistics": {
      "total_passes": 156,
      "avg_entry_time": "08:30",
      "avg_exit_time": "17:15",
      "days_present_this_month": 15,
      "last_pass": {
        "time": "2026-01-19T08:22:15Z",
        "checkpoint": "Вход, корпус Б",
        "direction": "in"
      }
    },
    "recent_passes": [
      {
        "id": 234,
        "time": "2026-01-19T08:22:15Z",
        "checkpoint": "Вход, корпус Б",
        "direction": "in"
      }
    ]
  }
}
```

---

### Статистика по студентам

```http
GET /students/statistics
```

**Описание:** Получение общей статистики по студентам

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "total_students": 1842,
    "active_students": 1756,
    "by_course": [
      { "course": 1, "count": 485 },
      { "course": 2, "count": 442 },
      { "course": 3, "count": 398 },
      { "course": 4, "count": 331 },
      { "course": 5, "count": 100 }
    ],
    "by_faculty": [
      {
        "faculty": "Институт математики и компьютерных наук",
        "count": 456
      },
      {
        "faculty": "Институт социально-гуманитарных наук",
        "count": 389
      }
    ],
    "attendance": {
      "today": 1234,
      "this_week": 1689,
      "this_month": 1756
    }
  }
}
```

---

## Сотрудники

### Получение списка сотрудников

```http
GET /employees
```

**Описание:** Получение списка сотрудников с информацией о проходах

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `page` (integer, optional) - Номер страницы
- `limit` (integer, optional) - Количество записей
- `full_name` (string, optional) - Фильтр по ФИО
- `upn` (string, optional) - Фильтр по UPN
- `position` (string, optional) - Фильтр по должности
- `department` (string, optional) - Фильтр по отделу
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": "EMP2020123",
      "full_name": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "email": "ivanov@utmn.ru",
      "card_number": "1234567890",
      "position": "Профессор",
      "department": "Институт математики и компьютерных наук",
      "last_pass": {
        "time": "2026-01-19T08:15:32Z",
        "checkpoint": "Главный вход, корпус А"
      },
      "total_passes": 234,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 456,
    "total_pages": 23
  }
}
```

---

### Получение информации о сотруднике

```http
GET /employees/:id
```

**Описание:** Получение детальной информации о конкретном сотруднике

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_id": "EMP2020123",
    "full_name": "Иванов Иван Иванович",
    "upn": "ivanov@utmn.ru",
    "email": "ivanov@utmn.ru",
    "phone": "+7 (3452) 12-34-56",
    "card_number": "1234567890",
    "position": "Профессор",
    "department": "Институт математики и компьютерных наук",
    "hire_date": "2015-09-01",
    "status": "active",
    "statistics": {
      "total_passes": 234,
      "avg_entry_time": "08:45",
      "avg_exit_time": "18:30",
      "days_present_this_month": 18,
      "last_pass": {
        "time": "2026-01-19T08:15:32Z",
        "checkpoint": "Главный вход, корпус А",
        "direction": "in"
      }
    },
    "recent_passes": [
      {
        "id": 123,
        "time": "2026-01-19T08:15:32Z",
        "checkpoint": "Главный вход, корпус А",
        "direction": "in"
      }
    ]
  }
}
```

---

### Статистика по сотрудникам

```http
GET /employees/statistics
```

**Описание:** Получение общей статистики по сотрудникам

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "total_employees": 456,
    "active_employees": 423,
    "by_department": [
      {
        "department": "Институт математики и компьютерных наук",
        "count": 87
      },
      {
        "department": "Институт социально-гуманитарных наук",
        "count": 76
      }
    ],
    "by_position": [
      { "position": "Профессор", "count": 45 },
      { "position": "Доцент", "count": 89 },
      { "position": "Старший преподаватель", "count": 123 },
      { "position": "Ассистент", "count": 67 }
    ],
    "attendance": {
      "today": 345,
      "this_week": 398,
      "this_month": 423
    }
  }
}
```

---

## Парковочная система

### Получение списка парковочных мест

```http
GET /parking/spots
```

**Описание:** Получение списка всех парковочных мест

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `location` (string, optional) - Фильтр по локации парковки
- `status` (string, optional) - Фильтр по статусу (free, occupied, reserved)
- `page` (integer, optional) - Номер страницы
- `limit` (integer, optional) - Количество записей

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "spot_number": "A-101",
      "location": "Парковка корпуса А",
      "floor": 1,
      "status": "occupied",
      "occupied_by": {
        "user_id": 123,
        "full_name": "Иванов Иван Иванович",
        "car_number": "Т123УМ 72"
      },
      "occupied_at": "2026-01-19T08:15:00Z",
      "reserved_until": null
    },
    {
      "id": 2,
      "spot_number": "A-102",
      "location": "Парковка корпуса А",
      "floor": 1,
      "status": "free",
      "occupied_by": null,
      "occupied_at": null,
      "reserved_until": null
    },
    {
      "id": 3,
      "spot_number": "A-103",
      "location": "Парковка корпуса А",
      "floor": 1,
      "status": "reserved",
      "occupied_by": null,
      "occupied_at": null,
      "reserved_until": "2026-01-19T18:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "total_pages": 6
  },
  "summary": {
    "total": 120,
    "free": 45,
    "occupied": 68,
    "reserved": 7
  }
}
```

---

### Получение информации о парковочном месте

```http
GET /parking/spots/:id
```

**Описание:** Получение детальной информации о конкретном парковочном месте

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "spot_number": "A-101",
    "location": "Парковка корпуса А",
    "floor": 1,
    "status": "occupied",
    "type": "standard",
    "features": ["крытая", "камера"],
    "occupied_by": {
      "user_id": 123,
      "full_name": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "car_number": "Т123УМ 72",
      "car_model": "Toyota Camry"
    },
    "occupied_at": "2026-01-19T08:15:00Z",
    "duration": "4h 30m",
    "history": [
      {
        "user_id": 123,
        "full_name": "Иванов Иван Иванович",
        "occupied_at": "2026-01-19T08:15:00Z",
        "left_at": null
      }
    ]
  }
}
```

---

### Статистика по парковке

```http
GET /parking/statistics
```

**Описание:** Получение статистики по парковочной системе

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "total_spots": 120,
    "by_status": {
      "free": 45,
      "occupied": 68,
      "reserved": 7
    },
    "by_location": [
      {
        "location": "Парковка корпуса А",
        "total": 50,
        "free": 18,
        "occupied": 30,
        "reserved": 2
      },
      {
        "location": "Парковка корпуса Б",
        "total": 40,
        "free": 15,
        "occupied": 23,
        "reserved": 2
      }
    ],
    "occupancy_rate": 56.7,
    "avg_duration": "6h 45m",
    "peak_hours": [
      { "hour": "09:00", "occupancy": 95 },
      { "hour": "10:00", "occupancy": 98 }
    ]
  }
}
```

---

### Резервирование парковочного места

```http
POST /parking/reserve
```

**Описание:** Резервирование парковочного места

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "spot_id": 2,
  "user_id": 123,
  "reserved_until": "2026-01-19T18:00:00Z",
  "car_number": "Т123УМ 72"
}
```

**Успешный ответ (201):**
```json
{
  "success": true,
  "message": "Парковочное место успешно зарезервировано",
  "data": {
    "reservation_id": 456,
    "spot_number": "A-102",
    "reserved_until": "2026-01-19T18:00:00Z"
  }
}
```

---

### Освобождение парковочного места

```http
POST /parking/release
```

**Описание:** Освобождение занятого парковочного места

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "spot_id": 1,
  "left_at": "2026-01-19T17:30:00Z"
}
```

**Успешный ответ (200):**
```json
{
  "success": true,
  "message": "Парковочное место освобождено",
  "data": {
    "spot_number": "A-101",
    "duration": "9h 15m",
    "cost": 0
  }
}
```

---

## Аналитика

### Общая аналитика

```http
GET /analytics/overview
```

**Описание:** Получение общей аналитики по системе

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `date_from` (string, optional) - Дата от
- `date_to` (string, optional) - Дата до

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "passes": {
      "total": 15234,
      "today": 1234,
      "this_week": 8456,
      "growth_rate": 5.2
    },
    "users": {
      "total": 2298,
      "students": 1842,
      "employees": 456,
      "active_today": 1567
    },
    "parking": {
      "total_spots": 120,
      "occupied": 68,
      "occupancy_rate": 56.7
    },
    "peak_hours": [
      { "hour": "08:00", "passes": 456 },
      { "hour": "09:00", "passes": 678 },
      { "hour": "17:00", "passes": 543 }
    ],
    "top_checkpoints": [
      { "checkpoint": "Главный вход, корпус А", "passes": 5234 },
      { "checkpoint": "Вход, корпус Б", "passes": 3421 }
    ]
  }
}
```

---

### Аналитика посещаемости

```http
GET /analytics/attendance
```

**Описание:** Аналитика посещаемости по дням, неделям, месяцам

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `date_from` (string, required) - Дата от
- `date_to` (string, required) - Дата до
- `group_by` (string, optional) - Группировка (day, week, month)
- `user_type` (string, optional) - Тип пользователей (student, employee, all)

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2026-01-01",
      "to": "2026-01-19"
    },
    "attendance": [
      {
        "date": "2026-01-19",
        "total": 1567,
        "students": 1234,
        "employees": 333,
        "unique_users": 1456
      },
      {
        "date": "2026-01-18",
        "total": 1489,
        "students": 1167,
        "employees": 322,
        "unique_users": 1389
      }
    ],
    "average": {
      "daily": 1523,
      "weekly": 10661
    }
  }
}
```

---

## Система хранения вещей

### Получение списка ячеек хранения

```http
GET /storage/lockers
```

**Описание:** Получение списка ячеек для хранения вещей

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `location` (string, optional) - Фильтр по локации
- `status` (string, optional) - Фильтр по статусу (free, occupied)
- `size` (string, optional) - Размер ячейки (small, medium, large)

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "locker_number": "L-001",
      "location": "Корпус А, 1 этаж",
      "size": "medium",
      "status": "occupied",
      "occupied_by": {
        "user_id": 123,
        "full_name": "Иванов Иван Иванович"
      },
      "occupied_at": "2026-01-19T08:15:00Z"
    }
  ],
  "summary": {
    "total": 200,
    "free": 87,
    "occupied": 113
  }
}
```

---

## Иностранные студенты

### Получение списка иностранных студентов

```http
GET /foreign-students
```

**Описание:** Получение списка иностранных студентов

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `page` (integer, optional) - Номер страницы
- `limit` (integer, optional) - Количество записей
- `country` (string, optional) - Фильтр по стране
- `visa_status` (string, optional) - Фильтр по статусу визы

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "full_name": "Zhang Wei",
      "upn": "zhang@study.utmn.ru",
      "country": "China",
      "course": 2,
      "group": "ЭК-21",
      "visa_status": "valid",
      "visa_expires": "2027-08-15",
      "registration_address": "Общежитие №3, комната 205",
      "last_pass": {
        "time": "2026-01-19T09:15:00Z",
        "checkpoint": "Общежитие №3"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

---

## Коды ответов

| Код | Описание |
|-----|----------|
| 200 | OK - Успешный запрос |
| 201 | Created - Ресурс успешно создан |
| 204 | No Content - Успешный запрос без возвращаемого содержимого |
| 400 | Bad Request - Некорректный запрос |
| 401 | Unauthorized - Не авторизован |
| 403 | Forbidden - Доступ запрещен |
| 404 | Not Found - Ресурс не найден |
| 422 | Unprocessable Entity - Ошибка валидации |
| 429 | Too Many Requests - Превышен лимит запросов |
| 500 | Internal Server Error - Внутренняя ошибка сервера |
| 503 | Service Unavailable - Сервис недоступен |

---

## Обработка ошибок

Все ошибки возвращаются в стандартном формате:

```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Описание ошибки на русском языке",
  "details": {
    "field": "Детали ошибки (опционально)"
  },
  "timestamp": "2026-01-19T12:00:00Z",
  "request_id": "req_abc123xyz"
}
```

### Примеры ошибок

**400 Bad Request:**
```json
{
  "success": false,
  "error": "BadRequest",
  "message": "Некорректные параметры запроса",
  "details": {
    "date_from": "Неверный формат даты. Используйте YYYY-MM-DD"
  },
  "timestamp": "2026-01-19T12:00:00Z",
  "request_id": "req_abc123xyz"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Требуется авторизация",
  "timestamp": "2026-01-19T12:00:00Z",
  "request_id": "req_abc123xyz"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Недостаточно прав для выполнения операции",
  "timestamp": "2026-01-19T12:00:00Z",
  "request_id": "req_abc123xyz"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "NotFound",
  "message": "Запрашиваемый ресурс не найден",
  "timestamp": "2026-01-19T12:00:00Z",
  "request_id": "req_abc123xyz"
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Ошибка валидации данных",
  "details": {
    "full_name": "Поле обязательно для заполнения",
    "card_number": "Номер карты должен содержать 10 цифр"
  },
  "timestamp": "2026-01-19T12:00:00Z",
  "request_id": "req_abc123xyz"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "InternalServerError",
  "message": "Внутренняя ошибка сервера. Попробуйте позже",
  "timestamp": "2026-01-19T12:00:00Z",
  "request_id": "req_abc123xyz"
}
```

---

## Webhook уведомления

Система поддерживает webhook уведомления для отправки событий на внешние сервисы.

### Настройка webhook

```http
POST /webhooks
```

**Тело запроса:**
```json
{
  "url": "https://your-service.com/webhook",
  "events": ["pass.created", "parking.occupied", "alert.triggered"],
  "secret": "your_webhook_secret"
}
```

### События

- `pass.created` - Новый проход зарегистрирован
- `pass.suspicious` - Подозрительный проход
- `parking.occupied` - Парковочное место занято
- `parking.freed` - Парковочное место освобождено
- `alert.triggered` - Сработала тревога
- `user.created` - Новый пользователь создан

### Формат webhook payload

```json
{
  "event": "pass.created",
  "timestamp": "2026-01-19T12:00:00Z",
  "data": {
    "pass_id": 12345,
    "user_id": 123,
    "checkpoint": "Главный вход, корпус А",
    "time": "2026-01-19T12:00:00Z"
  },
  "signature": "sha256_signature_here"
}
```

---

## Версионирование

API использует версионирование через URL:
- Текущая версия: `v1`
- Base URL: `https://security.utmn.ru/api/v1`

При выходе новой версии старая будет поддерживаться минимум 6 месяцев.

---

## Лимиты и квоты

| Категория | Лимит |
|-----------|-------|
| Запросы в минуту (неавторизованные) | 100 |
| Запросы в минуту (авторизованные) | 1000 |
| Максимальный размер запроса | 10 MB |
| Максимальный limit в пагинации | 100 |
| Время жизни JWT токена | 24 часа |
| Время жизни refresh токена | 30 дней |

---

## Поддержка и контакты

**Техническая поддержка API:**
- Email: api-support@utmn.ru
- Документация: https://security.utmn.ru/api/docs
- Статус API: https://status.utmn.ru

**Сообщить об ошибке:**
- GitHub Issues: https://github.com/utmn/security-api/issues

---

© 2026 Тюменский государственный университет. Все права защищены.
