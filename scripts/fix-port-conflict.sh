#!/bin/bash

# Скрипт для автоматического исправления конфликта портов при деплое
# Использование: ./scripts/fix-port-conflict.sh

set -e  # Выход при ошибке

echo "🔍 Проверяем занятые порты..."
if command -v lsof &> /dev/null; then
    lsof -i :80 2>/dev/null || echo "✅ Порт 80 свободен"
    lsof -i :443 2>/dev/null || echo "✅ Порт 443 свободен"
else
    echo "⚠️ lsof не найден, пропускаем проверку портов"
fi

echo ""
echo "🛑 Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo "🛑 Принудительная остановка CRM контейнеров..."
docker stop crm-nginx crm-backend crm-frontend crm-redis crm-postgres 2>/dev/null || true
docker rm crm-nginx crm-backend crm-frontend crm-redis 2>/dev/null || true

echo ""
echo "🧹 Удаляем старые/остановленные контейнеры..."
docker container prune -f

echo ""
echo "🧹 Очищаем неиспользуемые образы..."
docker image prune -f

echo ""
echo "🧹 Очищаем неиспользуемые сети..."
docker network prune -f

echo ""
echo "🔓 Освобождаем порты 80 и 443..."
if command -v fuser &> /dev/null; then
    fuser -k 80/tcp 2>/dev/null || echo "✅ Порт 80 уже свободен"
    fuser -k 443/tcp 2>/dev/null || echo "✅ Порт 443 уже свободен"
else
    echo "⚠️ fuser не найден, пропускаем принудительное освобождение портов"
fi

echo ""
echo "📋 Список оставшихся контейнеров:"
docker ps -a

echo ""
echo "📋 Список образов:"
docker images | head -n 10

echo ""
echo "💾 Использование диска:"
df -h / | head -n 2

echo ""
echo "✅ Очистка завершена! Теперь можно запустить деплой:"
echo "   docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "   или через CI/CD (git push)"

