# 🎉 Storage WebSocket - Однотипная реализация с Parking

## ✅ Что сделано

Переделан Storage WebSocket **точно так же**, как реализован Parking WebSocket!

---

## 📋 Изменения

### 1. **Создан новый хук `/hooks/useStorageMQTT.ts`**

Копия структуры `useParkingMQTT.ts`:

```typescript
export function useStorageMQTT() {
  const [storages, setStorages] = useState<StorageData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const connect = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
    const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/v1$/, '');
    const ws = new WebSocket(`${wsUrl}/ws/storage`);
    // ... обработчики
  };
  
  return { storages, isConnected, error, reconnect };
}
```

### 2. **Обновлен компонент `/components/StorageSystemsPage.tsx`**

Теперь использует `useStorageMQTT` вместо `useStorageWebSocket`:

```typescript
// ❌ Было (сложный хук с колбэками)
const { isConnected } = useStorageWebSocket({
  onOccupancyUpdate: (data) => { /* сложная логика */ },
  onStatusUpdate: (data) => { /* сложная логика */ },
  // ...
});

// ✅ Стало (простой хук как в Parking)
const { storages, isConnected, error, reconnect } = useStorageMQTT();
```

### 3. **Автоматическое определение WebSocket URL**

Использует ту же логику что и Parking:

```typescript
// Берет VITE_API_URL из .env
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

// Конвертирует в WebSocket URL
const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/v1$/, '');

// Подключается
new WebSocket(`${wsUrl}/ws/storage`);
```

**Примеры:**
- `VITE_API_URL=http://192.168.1.100:3000/v1` → `ws://192.168.1.100:3000/ws/storage`
- `VITE_API_URL=https://security.tyuiu.ru/v1` → `wss://security.tyuiu.ru/ws/storage`

---

## 🎯 Преимущества новой архитектуры

### ✅ **Простота**
- Нет колбэков `onOccupancyUpdate` / `onStatusUpdate`
- Данные сразу в массиве `storages`
- Автообновление через WebSocket

### ✅ **Однотипность**
- Parking: `useParkingMQTT()` → `{ parkings, isConnected, error, reconnect }`
- Storage: `useStorageMQTT()` → `{ storages, isConnected, error, reconnect }`

### ✅ **Автоматическое переподключение**
- Экспоненциальная задержка (1s, 2s, 4s, 8s... до 30s)
- Логи в консоли: `[Storage WebSocket] Переподключение через 5000ms (попытка 3)`

### ✅ **Real-time обновления**
- `storage-occupancy` → обновляет `occupiedCount`
- `storage-status` → обновляет `status`
- Автоматически обновляет `updatedAt` timestamp

---

## 🚀 Как использовать

### **1. Скопировать файлы в frontend:**

```bash
cd /var/www/utmn-security/debug

# Создать папки если не существуют
mkdir -p frontend/hooks
mkdir -p frontend/components

# Скопировать новые файлы
cp hooks/useStorageMQTT.ts frontend/hooks/
cp components/StorageSystemsPage.tsx frontend/components/
```

### **2. Удалить старый хук (опционально):**

```bash
# Старый хук больше не нужен
rm frontend/hooks/useStorageWebSocket.ts
```

### **3. Настроить .env (если нужно):**

```bash
cd frontend
nano .env
```

Добавить:
```env
VITE_API_URL=http://192.168.1.100:3000/v1
```

### **4. Перезапустить:**

```bash
cd frontend
npm run dev
```

---

## 🔍 Проверка в консоли

Откройте страницу "Системы хранения вещей" и смотрите в консоль (F12):

```
[Storage WebSocket] Подключено
[Storage WebSocket] Получена конфигурация систем хранения: [...]
[Storage WebSocket] Обновление занятости: {...}
```

---

## 📊 Сравнение: До и После

### **До (сложная архитектура):**
```typescript
// Загрузка через API
const loadData = async () => { /* ... */ };
useEffect(() => { loadData(); }, []);

// WebSocket с колбэками
const { isConnected } = useStorageWebSocket({
  onOccupancyUpdate: (data) => {
    setSystems(prev => prev.map(/* сложная логика */));
    loadStatistics(); // еще один API запрос
  },
  onStatusUpdate: (data) => {
    setSystems(prev => prev.map(/* сложная логика */));
    loadStatistics(); // еще один API запрос
  }
});
```

### **После (простая архитектура как Parking):**
```typescript
// Все в одном хуке!
const { storages, isConnected, error, reconnect } = useStorageMQTT();

// Данные уже готовы, WebSocket обновляет автоматически
filteredStorages.map(system => <StorageCard {...system} />)
```

---

## ✅ Итого:

1. ✅ **Создан** `/hooks/useStorageMQTT.ts` - однотипно с Parking
2. ✅ **Обновлен** `/components/StorageSystemsPage.tsx` - простой интерфейс
3. ✅ **Автоматическое** определение WebSocket URL из `VITE_API_URL`
4. ✅ **Real-time** обновления без API запросов
5. ✅ **Переподключение** с экспоненциальной задержкой
6. ✅ **Совместимость** с backend `/ws/storage`

🎉 **Готово! Теперь Storage работает точно так же, как Parking!**
