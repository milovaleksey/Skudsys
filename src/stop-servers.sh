#!/bin/bash

# =====================================================
# Скрипт для остановки backend и frontend серверов
# =====================================================

echo "Остановка серверов..."

# Остановка по сохранённым PID
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "✅ Backend остановлен (PID: $BACKEND_PID)"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "✅ Frontend остановлен (PID: $FRONTEND_PID)"
    fi
    rm -f .frontend.pid
fi

# Дополнительная очистка - убиваем все процессы на портах 3000 и 5173
pkill -f "node.*server.js" 2>/dev/null && echo "✅ Backend процессы очищены"
pkill -f "vite" 2>/dev/null && echo "✅ Frontend процессы очищены"

echo "Готово!"
