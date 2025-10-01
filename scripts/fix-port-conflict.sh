#!/bin/bash

# Скрипт для исправления конфликта портов при деплое

echo "🔍 Проверяем занятые порты..."
sudo lsof -i :80
sudo lsof -i :443

echo ""
echo "🛑 Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down

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
echo "🧹 Очищаем неиспользуемые volumes (ОСТОРОЖНО! Не удаляем volumes с данными)..."
# НЕ используем docker volume prune, чтобы не удалить БД

echo ""
echo "📋 Список оставшихся контейнеров:"
docker ps -a

echo ""
echo "📋 Список оставшихся образов:"
docker images

echo ""
echo "✅ Очистка завершена! Теперь можно запустить деплой."

