#!/bin/bash

# Скрипт настройки автозапуска CRM системы после перезагрузки сервера
# Использование: sudo ./scripts/setup-autostart.sh

set -e

echo "🚀 Настройка автозапуска CRM системы..."

# Проверка прав root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен быть запущен с правами root (sudo)" 
   exit 1
fi

# 1. Убедимся, что Docker запускается при загрузке системы
echo "📋 Настройка автозапуска Docker..."
systemctl enable docker
systemctl start docker
echo "✅ Docker настроен на автозапуск"

# 2. Создание systemd сервиса для CRM
echo "📋 Создание systemd сервиса для CRM..."

cat > /etc/systemd/system/crm-system.service << 'EOF'
[Unit]
Description=CRM System (Docker Compose)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/crm-system
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=300
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd сервис создан"

# 3. Включение и запуск сервиса
echo "📋 Включение CRM сервиса..."
systemctl daemon-reload
systemctl enable crm-system.service
echo "✅ CRM сервис включен для автозапуска"

# 4. Проверка статуса
echo ""
echo "📊 Текущий статус сервисов:"
echo ""
echo "Docker сервис:"
systemctl status docker --no-pager | head -n 5
echo ""
echo "CRM сервис:"
systemctl status crm-system --no-pager | head -n 5
echo ""

# 5. Информация
echo "✅ Настройка завершена!"
echo ""
echo "📋 Полезные команды:"
echo "   sudo systemctl status crm-system    # Проверить статус"
echo "   sudo systemctl start crm-system     # Запустить вручную"
echo "   sudo systemctl stop crm-system      # Остановить"
echo "   sudo systemctl restart crm-system   # Перезапустить"
echo "   sudo journalctl -u crm-system -f    # Посмотреть логи"
echo ""
echo "🎯 Теперь CRM система будет автоматически запускаться после перезагрузки сервера!"
echo ""
echo "💡 Рекомендуется протестировать:"
echo "   sudo reboot"
echo "   # После перезагрузки проверьте: docker ps"

