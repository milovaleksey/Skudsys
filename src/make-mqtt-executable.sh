#!/bin/bash
# Делаем все MQTT скрипты исполняемыми

echo "🔧 Настройка прав доступа для MQTT скриптов..."

chmod +x mqtt-publish-config.sh
chmod +x mqtt-publish-extended.sh
chmod +x mqtt-simulator.sh

echo "✅ Готово! Теперь можете запускать:"
echo ""
echo "   ./mqtt-publish-config.sh       # Простая конфигурация (8 карточек)"
echo "   ./mqtt-publish-extended.sh     # Расширенная (18 карточек)"
echo "   ./mqtt-simulator.sh            # Live симулятор"
echo ""
