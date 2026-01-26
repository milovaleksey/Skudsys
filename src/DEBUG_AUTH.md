# 🔍 Отладка проблемы с авторизацией

## Проблема
После авторизации при запросе к `/users` или `/roles` получаем ошибку:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Токен авторизации не предоставлен"
  }
}
```

## ✅ Что добавлено

### Frontend (`/lib/api.ts`)
```javascript
console.log('API Request:', {
  endpoint: `${this.baseUrl}${endpoint}`,
  method: options.method || 'GET',
  hasToken: !!token,
  headers: headers
});
```

### Backend (`/backend/src/middleware/auth.js`)
```javascript
console.log('Auth middleware:', {
  url: req.url,
  method: req.method,
  authHeader: authHeader,
  headers: req.headers
});
```

---

## 🧪 Тестирование

### 1. Откройте приложение в браузере

Откройте DevTools (F12) → Console

### 2. Залогиньтесь

Username: `admin`  
Password: `Admin2025`

### 3. Проверьте что происходит при логине

В Console должно быть:
```
API Request: {
  endpoint: "/v1/auth/login",
  method: "POST",
  hasToken: false,
  headers: { ... }
}
```

После успешного логина проверьте localStorage:
```javascript
// В Console
localStorage.getItem('auth_token')
```

Должен вернуть JWT токен (длинная строка).

### 4. Перейдите на страницу пользователей

Настройки → Пользователи

В Console должно быть:
```
API Request: {
  endpoint: "/v1/users",
  method: "GET",
  hasToken: true,  // ← Должно быть true!
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJ..."  // ← Токен должен быть
  }
}
```

### 5. Проверьте логи backend

На сервере:
```bash
sudo journalctl -u utmn-security -f --no-pager
```

Должно быть:
```
Auth middleware: {
  url: '/users',
  method: 'GET',
  authHeader: 'Bearer eyJ...',
  headers: { ... }
}
```

---

## 🔎 Возможные причины

### Причина 1: Токен не сохраняется
**Симптом:** `hasToken: false` в логах frontend  
**Решение:** Проверить что `TokenManager.setToken()` вызывается после логина

### Причина 2: CORS блокирует заголовки
**Симптом:** Заголовок Authorization не виден в логах backend  
**Решение:** Проверить CORS middleware на backend

### Причина 3: Запрос идет на неправильный URL
**Симптом:** 404 или запрос идет не через proxy  
**Решение:** Проверить `VITE_API_BASE_URL` и Nginx конфигурацию

### Причина 4: Разные домены для frontend и backend
**Симптом:** Cookies/localStorage не доступны  
**Решение:** Убедиться что frontend и backend на одном домене через Nginx

---

## 🛠️ Решения

### Решение 1: Проверить сохранение токена

В `AuthContext.tsx` после логина:
```typescript
if (response.success && response.data) {
  console.log('Saving token:', response.data.token);
  TokenManager.setToken(response.data.token);
  TokenManager.setRefreshToken(response.data.refreshToken);
  
  // Проверка
  console.log('Token saved:', TokenManager.getToken());
  setUser(response.data.user as User);
}
```

### Решение 2: Проверить CORS на backend

В `/backend/src/app.js` должно быть:
```javascript
app.use(cors({
  origin: true,  // Или конкретный origin
  credentials: true,
  exposedHeaders: ['Authorization']
}));
```

### Решение 3: Проверить базовый URL

В Console:
```javascript
// Должно быть '' (пустая строка) при использовании через Nginx
import.meta.env.VITE_API_BASE_URL
```

### Решение 4: Проверить что запросы проксируются

В Network tab DevTools:
- Запрос должен идти на `/v1/users`
- Не должно быть `http://localhost:3000/v1/users`

---

## 📋 Checklist

- [ ] `hasToken: true` в логах frontend при запросе к `/users`
- [ ] `authHeader: 'Bearer ...'` в логах backend
- [ ] Токен сохранен в `localStorage.getItem('auth_token')`
- [ ] Запросы идут на `/v1/*` а не `http://localhost:3000/v1/*`
- [ ] CORS настроен правильно
- [ ] Nginx проксирует `/v1/*` на backend:3000

---

## 🚀 Следующие действия

1. ✅ Соберите и разверните с новым логированием
2. ✅ Залогиньтесь и перейдите на страницу пользователей
3. ✅ Сделайте скриншот логов из Console
4. ✅ Проверьте логи backend
5. ✅ Определите на каком этапе теряется токен

---

**Дата:** 25.01.2026  
**Статус:** 🔍 Отладка
