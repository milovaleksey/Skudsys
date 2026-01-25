# Руководство для разработчиков

## Быстрый старт для разработки

### Требования
- Node.js 18+
- npm 9+
- MySQL 8.0+
- Git

### Установка локально

```bash
# 1. Клонировать
git clone <repo> && cd utmn-security

# 2. Установить зависимости
npm install
cd backend && npm install && cd ..

# 3. Создать базу данных
mysql -u root -p
CREATE DATABASE utmn_security;
EXIT;
mysql -u root -p utmn_security < database/schema.sql

# 4. Настроить backend/.env
cp backend/.env.example backend/.env
nano backend/.env
```

**backend/.env:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ваш_пароль
DB_NAME=utmn_security
JWT_SECRET=ваш_секрет_минимум_32_символа
PORT=3001
NODE_ENV=development
```

```bash
# 5. Запустить backend
cd backend && npm start

# 6. В новом терминале запустить frontend
npm run dev
```

Открыть: http://localhost:5173

## Структура проекта

```
/
├── components/          # React компоненты
│   ├── ui/             # Shadcn UI компоненты
│   ├── DashboardBuilder.tsx
│   ├── LoginPage.tsx
│   ├── MainPage.tsx
│   └── ...
├── contexts/           # React Context (AuthContext)
├── lib/               # Утилиты и API клиент
├── styles/            # CSS стили (Tailwind)
├── backend/           # Node.js Backend
│   ├── src/
│   │   ├── controllers/   # Контроллеры API
│   │   ├── routes/        # Маршруты API
│   │   ├── middleware/    # Middleware (auth, rate limiter)
│   │   ├── config/        # Конфигурация (DB)
│   │   └── server.js      # Точка входа
│   └── package.json
├── database/          # SQL схемы и миграции
│   └── schema.sql
├── nginx/             # Конфигурации Nginx
├── scripts/           # Утилитарные скрипты
└── package.json
```

## API клиент (Frontend)

Файл: `/lib/api.ts`

```typescript
// Пример использования
import { apiClient } from '@/lib/api';

// GET запрос
const users = await apiClient('/api/users');

// POST запрос
const newUser = await apiClient('/api/users', {
  method: 'POST',
  body: JSON.stringify({ username: 'test', role: 'operator' })
});
```

## Backend API

### Создание нового endpoint

**1. Создать контроллер** (`backend/src/controllers/example.controller.js`):

```javascript
const db = require('../config/database');

exports.getItems = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM items');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, value } = req.body;
    const [result] = await db.query(
      'INSERT INTO items (name, value) VALUES (?, ?)',
      [name, value]
    );
    res.status(201).json({ id: result.insertId, name, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**2. Создать роут** (`backend/src/routes/example.routes.js`):

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const controller = require('../controllers/example.controller');

// GET /api/items - требует авторизации
router.get('/', authenticate, controller.getItems);

// POST /api/items - требует права 'create-items'
router.post('/', 
  authenticate, 
  checkPermission('create-items'),
  controller.createItem
);

module.exports = router;
```

**3. Зарегистрировать в server.js**:

```javascript
const exampleRoutes = require('./routes/example.routes');
app.use('/api/items', exampleRoutes);
```

## Работа с базой данных

### Выполнение запросов

```javascript
const db = require('../config/database');

// SELECT с параметрами
const [users] = await db.query(
  'SELECT * FROM users WHERE role = ?',
  [role]
);

// INSERT
const [result] = await db.query(
  'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
  [username, hashedPassword, role]
);
const userId = result.insertId;

// UPDATE
await db.query(
  'UPDATE users SET role = ? WHERE id = ?',
  [newRole, userId]
);

// DELETE
await db.query('DELETE FROM users WHERE id = ?', [userId]);

// Транзакции
const connection = await db.getConnection();
await connection.beginTransaction();
try {
  await connection.query('INSERT INTO ...');
  await connection.query('UPDATE ...');
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## Аутентификация и авторизация

### Middleware

**authenticate** - проверка JWT токена:
```javascript
router.get('/protected', authenticate, controller.method);
```

**checkPermission** - проверка прав доступа:
```javascript
router.post('/admin', 
  authenticate, 
  checkPermission('admin-access'),
  controller.method
);
```

### Генерация токена

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { 
    userId: user.id, 
    username: user.username,
    role: user.role 
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

## Frontend компоненты

### Создание новой страницы

**1. Создать компонент** (`/components/NewPage.tsx`):

```tsx
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function NewPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await apiClient('/api/items');
      setData(result);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Новая страница</h2>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="grid gap-4">
          {data.map(item => (
            <Card key={item.id} className="p-4">
              <h3>{item.name}</h3>
              <p>{item.value}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**2. Добавить в MainPage.tsx**:

```tsx
import { NewPage } from './NewPage';

// В массив menuItems:
{
  id: 'new-page',
  label: 'Новая страница',
  icon: FileText,
  permission: 'view-new-page',
}

// В рендер:
{activePage === 'new-page' && <NewPage />}
```

## Система прав доступа

### Добавление нового права

**1. Добавить в базу данных**:

```sql
INSERT INTO permissions (name, description) 
VALUES ('view-new-page', 'Доступ к новой странице');

-- Назначить роли
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'view-new-page';
```

**2. Использовать в коде**:

Frontend (AuthContext):
```tsx
const canView = hasPermission('view-new-page');
```

Backend:
```javascript
router.get('/', 
  authenticate, 
  checkPermission('view-new-page'),
  controller.method
);
```

## Стилизация (Tailwind CSS)

### Использование фирменного цвета #00aeef

```tsx
// Текст
<h1 className="text-[#00aeef]">Заголовок</h1>

// Фон
<div className="bg-[#00aeef]">Контент</div>

// Через style (для динамических элементов)
<div style={{ color: '#00aeef' }}>Текст</div>
```

### Глобальные стили

Файл: `/styles/globals.css`

```css
@import "tailwindcss";

/* Кастомные CSS переменные */
:root {
  --primary-color: #00aeef;
}
```

## Отладка

### Backend логи

```javascript
console.log('Debug:', data);
console.error('Error:', error);
```

```bash
# Просмотр в реальном времени
cd backend && npm start
```

### Frontend отладка

```typescript
console.log('Component state:', state);
```

Использовать React DevTools в браузере.

### MySQL запросы

```javascript
// Включить логирование запросов
const db = require('../config/database');
db.on('query', (query) => {
  console.log('Query:', query.sql);
});
```

## Тестирование

### Backend API

```bash
# Установить
npm install --save-dev jest supertest

# Создать test/api.test.js
```

```javascript
const request = require('supertest');
const app = require('../src/server');

describe('GET /api/users', () => {
  it('должен вернуть список пользователей', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

## Деплой на production

### Сборка frontend

```bash
npm run build
# Результат в dist/
```

### Запуск backend в production

```bash
cd backend
NODE_ENV=production npm start
```

### Systemd сервис

Файл: `/etc/systemd/system/utmn-security.service`

```ini
[Unit]
Description=UTMN Security System Backend
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/utmn-security/backend
ExecStart=/usr/bin/node /opt/utmn-security/backend/src/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable utmn-security
sudo systemctl start utmn-security
sudo systemctl status utmn-security
```

## Полезные команды

```bash
# Проверка кода
npm run lint

# Форматирование
npm run format

# Сборка
npm run build

# Локальная разработка
npm run dev

# Backend
cd backend && npm start

# Проверка базы
mysql -u root -p utmn_security

# Просмотр логов
sudo journalctl -u utmn-security -f

# Перезапуск
sudo systemctl restart utmn-security
sudo systemctl restart nginx
```

## Частые проблемы

### CORS ошибки

В `backend/src/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### JWT токен не работает

Проверить:
- Правильность JWT_SECRET в .env
- Наличие токена в localStorage
- Формат заголовка Authorization

### База данных не подключается

```bash
# Проверить MySQL
sudo systemctl status mysql

# Проверить credentials в .env
cat backend/.env

# Проверить доступ
mysql -u root -p -e "SHOW DATABASES;"
```

---

**Для дополнительной информации см. README.md**
