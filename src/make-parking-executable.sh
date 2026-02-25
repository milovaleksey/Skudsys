#!/bin/bash
# Делаем все скрипты парковок исполняемыми

echo "🔧 Настройка прав доступа для скриптов парковок..."

chmod +x parking-publish.sh
chmod +x parking-simulator.sh

echo "✅ Готово! Теперь можете запускать:"
echo ""
echo "   ./parking-publish.sh     # Публикация конфигурации парковок"
echo "   ./parking-simulator.sh   # Live симулятор (обновления каждые 5 сек)"
echo ""
