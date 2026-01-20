# REST API Спецификация
## Системы безопасности инфраструктуры ТюмГУ

**Версия:** 1.0  
**Base URL:** `https://api.security.utmn.ru/v1`  
**Формат данных:** JSON  
**Кодировка:** UTF-8

---

## 🔐 Авторизация

Все запросы (кроме `/auth/login` и `/auth/sso`) требуют авторизации через JWT токен в заголовке:

```http
Authorization: Bearer <token>
```

---

## 📋 Endpoints

### 1. Авторизация

#### POST `/auth/login`
Локальная авторизация (логин + пароль)

**Request:**
```json
{
  "username": "admin_security",
  "password": "test123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin_security",
      "fullName": "Иванов Иван Иванович",
      "email": "ivanov@utmn.ru",
      "role": "admin",
      "authType": "local",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00Z",
      "lastLogin": "2026-01-19T08:15:00Z"
    }
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Неверный логин или пароль"
  }
}
```

---

#### POST `/auth/sso`
SSO авторизация через систему университета

**Request:**
```json
{
  "email": "test@utmn.ru",
  "ssoToken": "sso_token_from_university_system"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": { ... }
  }
}
```

---

#### POST `/auth/logout`
Выход из системы

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Успешный выход из системы"
}
```

---

#### GET `/auth/me`
Получить информацию о текущем пользователе

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin_security",
    "fullName": "Иванов Иван Иванович",
    "email": "ivanov@utmn.ru",
    "role": "admin",
    "roleDisplayName": "Администратор",
    "permissions": [
      "dashboard",
      "passes",
      "location",
      "analytics",
      "parking",
      "storage",
      "foreign-students",
      "students",
      "employees",
      "users-settings",
      "roles-settings"
    ],
    "authType": "local",
    "isActive": true,
    "lastLogin": "2026-01-19T08:15:00Z"
  }
}
```

---

### 2. Управление пользователями

#### GET `/users`
Получить список пользователей с фильтрацией и поиском

**Query Parameters:**
- `page` (int, default: 1) - номер страницы
- `limit` (int, default: 20, max: 100) - количество на странице
- `search` (string) - поиск по username, fullName, email
- `role` (string) - фильтр по роли
- `authType` (enum: local, sso) - фильтр по типу авторизации
- `isActive` (boolean) - фильтр по активности
- `sortBy` (string, default: createdAt) - сортировка (username, fullName, email, createdAt)
- `sortOrder` (enum: asc, desc, default: desc) - порядок сортировки

**Permissions:** `users-settings`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin_security",
        "fullName": "Иванов Иван Иванович",
        "email": "ivanov@utmn.ru",
        "role": "admin",
        "roleDisplayName": "Администратор",
        "authType": "local",
        "isActive": true,
        "createdAt": "2025-01-15T10:30:00Z",
        "lastLogin": "2026-01-19T08:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

#### GET `/users/:id`
Получить пользователя по ID

**Permissions:** `users-settings`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin_security",
    "fullName": "Иванов Иван Иванович",
    "email": "ivanov@utmn.ru",
    "role": "admin",
    "roleDisplayName": "Администратор",
    "authType": "local",
    "avatar": null,
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2026-01-19T08:15:00Z",
    "lastLogin": "2026-01-19T08:15:00Z"
  }
}
```

---

#### POST `/users`
Создать нового пользователя

**Permissions:** `users-settings`

**Request:**
```json
{
  "username": "new_user",
  "fullName": "Новый Пользователь",
  "email": "newuser@utmn.ru",
  "password": "securePassword123",
  "role": "operator",
  "authType": "local",
  "isActive": true
}
```

**Validation:**
- `username`: обязательно, 3-100 символов, уникальное
- `fullName`: обязательно, 2-200 символов
- `email`: обязательно, валидный email, уникальное
- `password`: обязательно для local, минимум 8 символов
- `role`: обязательно, существующая роль
- `authType`: обязательно, enum(local, sso)
- `isActive`: optional, boolean, default: true

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "username": "new_user",
    "fullName": "Новый Пользователь",
    "email": "newuser@utmn.ru",
    "role": "operator",
    "authType": "local",
    "isActive": true,
    "createdAt": "2026-01-19T10:30:00Z"
  },
  "message": "Пользователь успешно создан"
}
```

**Response 400:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации",
    "details": [
      {
        "field": "email",
        "message": "Email уже используется"
      }
    ]
  }
}
```

---

#### PUT `/users/:id`
Обновить пользователя

**Permissions:** `users-settings`

**Request:**
```json
{
  "fullName": "Иванов Иван Петрович",
  "email": "ivanov.new@utmn.ru",
  "role": "manager",
  "isActive": false
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin_security",
    "fullName": "Иванов Иван Петрович",
    "email": "ivanov.new@utmn.ru",
    "role": "manager",
    "isActive": false,
    "updatedAt": "2026-01-19T11:00:00Z"
  },
  "message": "Пользователь успешно обновлен"
}
```

---

#### DELETE `/users/:id`
Удалить пользователя

**Permissions:** `users-settings`

**Response 200:**
```json
{
  "success": true,
  "message": "Пользователь успешно удален"
}
```

**Response 403:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Нельзя удалить самого себя"
  }
}
```

---

#### GET `/users/statistics`
Получить статистику пользователей

**Permissions:** `users-settings`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "active": 4,
    "inactive": 1,
    "byAuthType": {
      "local": 3,
      "sso": 2
    },
    "byRole": [
      {
        "role": "admin",
        "roleDisplayName": "Администратор",
        "count": 1
      },
      {
        "role": "security",
        "roleDisplayName": "Безопасность",
        "count": 1
      }
    ],
    "recentLogins": [
      {
        "userId": 1,
        "username": "admin_security",
        "fullName": "Иванов Иван Иванович",
        "lastLogin": "2026-01-19T08:15:00Z"
      }
    ]
  }
}
```

---

#### GET `/users/export`
Экспорт пользователей

**Query Parameters:**
- `format` (enum: csv, json, default: csv)
- `search`, `role`, `authType`, `isActive` - те же фильтры что в GET /users

**Permissions:** `users-settings`

**Response 200 (CSV):**
```csv
ID,Username,Full Name,Email,Role,Auth Type,Active,Created At,Last Login
1,admin_security,Иванов Иван Иванович,ivanov@utmn.ru,admin,local,true,2025-01-15T10:30:00Z,2026-01-19T08:15:00Z
...
```

**Response 200 (JSON):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin_security",
      "fullName": "Иванов Иван Иванович",
      "email": "ivanov@utmn.ru",
      "role": "admin",
      "authType": "local",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00Z",
      "lastLogin": "2026-01-19T08:15:00Z"
    }
  ]
}
```

---

### 3. Управление ролями

#### GET `/roles`
Получить список всех ролей

**Permissions:** `roles-settings` или `users-settings`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "admin",
      "name": "admin",
      "displayName": "Администратор",
      "description": "Полный доступ ко всем функциям системы",
      "permissions": [
        "dashboard",
        "passes",
        "location",
        "analytics",
        "parking",
        "storage",
        "foreign-students",
        "students",
        "employees",
        "users-settings",
        "roles-settings"
      ],
      "isSystem": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": null
    }
  ]
}
```

---

#### GET `/roles/:id`
Получить роль по ID

**Permissions:** `roles-settings`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "admin",
    "name": "admin",
    "displayName": "Администратор",
    "description": "Полный доступ ко всем функциям системы",
    "permissions": [ ... ],
    "isSystem": true,
    "usersCount": 1,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### POST `/roles`
Создать новую роль

**Permissions:** `roles-settings`

**Request:**
```json
{
  "name": "parking_manager",
  "displayName": "Менеджер парковки",
  "description": "Управление парковочной системой",
  "permissions": [
    "dashboard",
    "parking"
  ]
}
```

**Validation:**
- `name`: обязательно, 3-100 символов, латиница, уникальное
- `displayName`: обязательно, 3-200 символов
- `description`: optional, до 1000 символов
- `permissions`: обязательно, массив, минимум 1 элемент

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "custom_1737285600000",
    "name": "parking_manager",
    "displayName": "Менеджер парковки",
    "description": "Управление парковочной системой",
    "permissions": ["dashboard", "parking"],
    "isSystem": false,
    "createdAt": "2026-01-19T10:00:00Z"
  },
  "message": "Роль успешно создана"
}
```

---

#### PUT `/roles/:id`
Обновить роль

**Permissions:** `roles-settings`

**Request:**
```json
{
  "displayName": "Менеджер парковки и хранения",
  "description": "Управление парковкой и ячейками хранения",
  "permissions": [
    "dashboard",
    "parking",
    "storage"
  ]
}
```

**Note:** Системные роли можно обновлять частично (только description и permissions)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "custom_1737285600000",
    "name": "parking_manager",
    "displayName": "Менеджер парковки и хранения",
    "description": "Управление парковкой и ячейками хранения",
    "permissions": ["dashboard", "parking", "storage"],
    "isSystem": false,
    "updatedAt": "2026-01-19T11:00:00Z"
  },
  "message": "Роль успешно обновлена"
}
```

---

#### DELETE `/roles/:id`
Удалить роль

**Permissions:** `roles-settings`

**Response 200:**
```json
{
  "success": true,
  "message": "Роль успешно удалена"
}
```

**Response 403:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Системные роли нельзя удалять"
  }
}
```

**Response 409:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Роль используется пользователями",
    "details": {
      "usersCount": 5
    }
  }
}
```

---

#### GET `/roles/permissions`
Получить список всех доступных прав

**Permissions:** `roles-settings`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dashboard",
      "name": "Главная панель",
      "category": "Основные"
    },
    {
      "id": "passes",
      "name": "Отчет о проходах",
      "category": "Безопасность"
    }
  ]
}
```

---

### 4. Студенты

#### GET `/students`
Получить список студентов

**Query Parameters:**
- `page`, `limit`, `search`, `sortBy`, `sortOrder`
- `isForeign` (boolean) - только иностранные
- `faculty` (string) - фильтр по факультету
- `course` (int) - фильтр по курсу
- `dormitoryId` (int) - фильтр по общежитию

**Permissions:** `students` или `foreign-students`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": 1,
        "studentNumber": "ST-2023-001",
        "fullName": "Петров Алексей Иванович",
        "email": "petrov@student.utmn.ru",
        "phone": "+7 (912) 345-67-89",
        "faculty": "Институт математики и компьютерных наук",
        "course": 3,
        "groupNumber": "ПМ-31",
        "isForeign": false,
        "dormitoryId": 1,
        "dormitoryName": "Общежитие №1",
        "roomNumber": "305",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15234,
      "totalPages": 762
    }
  }
}
```

---

#### GET `/students/statistics`
Статистика по студентам

**Permissions:** `students` или `analytics`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 15234,
    "active": 15100,
    "foreign": 856,
    "byFaculty": [
      {
        "faculty": "Институт математики и компьютерных наук",
        "count": 2345
      }
    ],
    "byCourse": [
      { "course": 1, "count": 4123 },
      { "course": 2, "count": 3987 },
      { "course": 3, "count": 3654 },
      { "course": 4, "count": 3470 }
    ],
    "inDormitories": 2580
  }
}
```

---

### 5. Сотрудники

#### GET `/employees`
Получить список сотрудников

**Query Parameters:**
- `page`, `limit`, `search`, `sortBy`, `sortOrder`
- `department` (string) - фильтр по подразделению

**Permissions:** `employees`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": 1,
        "employeeNumber": "EMP-2020-001",
        "fullName": "Смирнова Елена Петровна",
        "email": "smirnova@utmn.ru",
        "phone": "+7 (345) 212-34-56",
        "department": "Институт математики и компьютерных наук",
        "position": "Доцент кафедры программирования",
        "isActive": true
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 6. Отчет о проходах

#### GET `/access-logs`
Получить журнал проходов

**Query Parameters:**
- `page`, `limit`
- `startDate` (ISO date) - начало периода
- `endDate` (ISO date) - конец периода
- `accessPointId` (int) - фильтр по точке доступа
- `personType` (enum: student, employee, guest)
- `direction` (enum: in, out)

**Permissions:** `passes`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 12345,
        "accessPointId": 1,
        "accessPointName": "Главный вход",
        "personType": "student",
        "personId": 123,
        "personName": "Петров Алексей Иванович",
        "cardNumber": "123456789",
        "direction": "in",
        "accessTime": "2026-01-19T08:30:15Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### GET `/access-logs/statistics`
Статистика проходов

**Query Parameters:**
- `startDate`, `endDate`
- `groupBy` (enum: hour, day, week, month)

**Permissions:** `passes` или `analytics`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalPasses": 3421,
    "entries": 1805,
    "exits": 1616,
    "uniquePersons": 2156,
    "byAccessPoint": [
      {
        "accessPointId": 1,
        "accessPointName": "Главный вход",
        "count": 1245
      }
    ],
    "byHour": [
      { "hour": 8, "count": 456 },
      { "hour": 9, "count": 678 }
    ]
  }
}
```

---

### 7. Местонахождение людей

#### GET `/location/current`
Текущее местонахождение (кто внутри здания)

**Permissions:** `location`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 2340,
    "students": 2100,
    "employees": 215,
    "guests": 25,
    "byBuilding": [
      {
        "building": "Корпус А",
        "count": 856
      }
    ],
    "people": [
      {
        "personType": "student",
        "personId": 123,
        "fullName": "Петров Алексей Иванович",
        "entryTime": "2026-01-19T08:30:15Z",
        "entryPoint": "Главный вход",
        "lastSeen": "2026-01-19T08:30:15Z"
      }
    ]
  }
}
```

---

### 8. Парковка

#### GET `/parking/spots`
Получить список парковочных мест

**Query Parameters:**
- `zone` (string) - фильтр по зоне
- `isOccupied` (boolean) - фильтр по занятости

**Permissions:** `parking`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "spots": [
      {
        "id": 1,
        "spotNumber": "A-001",
        "zone": "Зона А",
        "level": 1,
        "isOccupied": true,
        "vehicleNumber": "А123БВ777",
        "ownerType": "employee",
        "ownerId": 45,
        "ownerName": "Смирнова Елена Петровна",
        "occupiedAt": "2026-01-19T08:15:00Z"
      }
    ],
    "statistics": {
      "total": 450,
      "occupied": 342,
      "free": 108,
      "occupancyRate": 76.0
    }
  }
}
```

---

#### POST `/parking/occupy`
Занять парковочное место

**Permissions:** `parking`

**Request:**
```json
{
  "spotNumber": "A-001",
  "vehicleNumber": "А123БВ777",
  "ownerType": "employee",
  "ownerId": 45
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Парковочное место успешно занято",
  "data": {
    "spotNumber": "A-001",
    "vehicleNumber": "А123БВ777",
    "occupiedAt": "2026-01-19T10:30:00Z"
  }
}
```

---

#### POST `/parking/free`
Освободить парковочное место

**Permissions:** `parking`

**Request:**
```json
{
  "spotNumber": "A-001"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Парковочное место освобождено"
}
```

---

### 9. Система хранения вещей

#### GET `/storage/lockers`
Получить список ячеек хранения

**Query Parameters:**
- `location` (string)
- `size` (enum: small, medium, large)
- `isOccupied` (boolean)

**Permissions:** `storage`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "lockers": [
      {
        "id": 1,
        "lockerNumber": "L-001",
        "location": "Корпус А, 1 этаж",
        "size": "medium",
        "isOccupied": true,
        "ownerType": "student",
        "ownerId": 123,
        "ownerName": "Петров Алексей Иванович",
        "occupiedAt": "2026-01-15T10:00:00Z",
        "occupiedUntil": "2026-06-30T23:59:59Z"
      }
    ],
    "statistics": {
      "total": 1200,
      "occupied": 856,
      "free": 344
    }
  }
}
```

---

### 10. Аналитика

#### GET `/analytics/dashboard`
Данные для главной панели

**Permissions:** `dashboard`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "students": {
      "total": 15234,
      "foreign": 856,
      "inDormitories": 2580
    },
    "employees": {
      "total": 1456,
      "active": 1423
    },
    "dormitories": {
      "total": 8,
      "totalPlaces": 2180,
      "occupiedPlaces": 2100
    },
    "accessLogs": {
      "todayPasses": 3421,
      "currentInside": 2340
    },
    "parking": {
      "totalSpots": 450,
      "occupied": 342,
      "free": 108
    },
    "storage": {
      "totalLockers": 1200,
      "occupied": 856,
      "free": 344
    }
  }
}
```

---

## 📊 Коды ответов

| Код | Описание |
|-----|----------|
| 200 | OK - успешный запрос |
| 201 | Created - ресурс создан |
| 400 | Bad Request - ошибка валидации |
| 401 | Unauthorized - не авторизован |
| 403 | Forbidden - нет прав доступа |
| 404 | Not Found - ресурс не найден |
| 409 | Conflict - конфликт данных |
| 422 | Unprocessable Entity - невалидные данные |
| 500 | Internal Server Error - ошибка сервера |

---

## 🔒 Безопасность

### JWT Token
- **Алгоритм:** HS256
- **Время жизни:** 24 часа
- **Обновление:** через `/auth/refresh`

### Rate Limiting
- **Авторизация:** 5 попыток / 15 минут
- **API запросы:** 100 запросов / минуту
- **Экспорт данных:** 10 запросов / час

### CORS
```
Access-Control-Allow-Origin: https://security.utmn.ru
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 📝 Примеры использования

### cURL
```bash
# Авторизация
curl -X POST https://api.security.utmn.ru/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_security","password":"test123"}'

# Получить пользователей
curl -X GET "https://api.security.utmn.ru/v1/users?page=1&limit=20" \
  -H "Authorization: Bearer <token>"

# Создать роль
curl -X POST https://api.security.utmn.ru/v1/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"parking_manager","displayName":"Менеджер парковки","permissions":["dashboard","parking"]}'
```

### JavaScript (Fetch)
```javascript
// Авторизация
const response = await fetch('https://api.security.utmn.ru/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin_security',
    password: 'test123'
  })
});
const { data } = await response.json();
const token = data.token;

// Получить пользователей
const users = await fetch('https://api.security.utmn.ru/v1/users?page=1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

**Версия API:** 1.0  
**Дата обновления:** 19.01.2026  
**ТюмГУ - Системы безопасности инфраструктуры**
