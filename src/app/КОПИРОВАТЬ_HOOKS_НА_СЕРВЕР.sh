#!/bin/bash

# ════════════════════════════════════════════════════════════════
#  Копирование hooks в frontend папку (для monorepo структуры)
# ════════════════════════════════════════════════════════════════

echo "🔧 Копирование hooks в /frontend/hooks/"
echo ""

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Определяем базовую директорию
BASE_DIR="/var/www/utmn-security/debug"

# Создаём директорию hooks в frontend
echo "📁 Создаём директорию: ${BASE_DIR}/frontend/hooks/"
mkdir -p "${BASE_DIR}/frontend/hooks"

# Список hooks файлов для копирования
HOOKS=(
  "useAnalyticsMQTT.ts"
  "useForeignStudentsMQTT.ts"
  "useMQTT.ts"
  "useParkingMQTT.ts"
  "useStorageMQTT.ts"
  "useStorageWebSocket.ts"
)

echo ""
echo "📦 Копируем hooks файлы..."
echo ""

# Копируем каждый hook
for hook in "${HOOKS[@]}"; do
  SOURCE="/hooks/${hook}"
  DEST="${BASE_DIR}/frontend/hooks/${hook}"
  
  if [ -f "${SOURCE}" ]; then
    cp "${SOURCE}" "${DEST}"
    echo -e "${GREEN}✅${NC} Скопировано: ${hook}"
  else
    echo -e "${YELLOW}⚠️${NC}  Не найдено: ${SOURCE}"
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Готово!${NC}"
echo ""
echo "Hooks скопированы в: ${BASE_DIR}/frontend/hooks/"
echo ""
echo "Теперь импорты будут работать:"
echo "  import { useMQTTWebSocket } from '../hooks/useMQTT';"
echo ""
echo "════════════════════════════════════════════════════════════════"
