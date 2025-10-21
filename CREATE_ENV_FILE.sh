#!/bin/bash

# ===============================================
# Скрипт для создания .env.local файла
# ===============================================
# Автоматически создаёт .env.local с проверенными свободными портами

set -e

echo "🔍 Проверка свободных портов..."

# Проверяем порты
check_port() {
    nc -z localhost $1 2>/dev/null && echo "❌ Порт $1 занят" || echo "✅ Порт $1 свободен"
}

echo ""
echo "Next.js порт:"
check_port 3100

echo ""
echo "Supabase порты:"
check_port 54321
check_port 54322
check_port 54323
check_port 54324
check_port 54325
check_port 54326

echo ""
echo "📝 Создаю .env.local файл..."

cat > .env.local << 'EOF'
# ===============================================
# LOCAL DEVELOPMENT ENVIRONMENT
# ===============================================
# Автоматически сгенерирован с проверенными свободными портами
# Next.js: 3100, Supabase: 54321-54326

# ===============================================
# APPLICATION
# ===============================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3100

# ===============================================
# SUPABASE LOCAL
# ===============================================
# После запуска 'supabase start' обновите эти значения из 'supabase status'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Service role key (local default)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# JWT Secret
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# ===============================================
# MARKETING & ANALYTICS (Optional)
# ===============================================
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_FB_PIXEL_ID=
FB_CONVERSION_ACCESS_TOKEN=
NEXT_PUBLIC_GOOGLE_ADS_ID=
GOOGLE_ADS_CONVERSION_LABEL=

# ===============================================
# CRM INTEGRATIONS (Optional)
# ===============================================
CRM_WEBHOOK_SECRET=local-dev-webhook-secret

# ===============================================
# CRON & SECURITY
# ===============================================
CRON_SECRET=local-dev-cron-secret
RATE_LIMIT_RPM=1000

# ===============================================
# FEATURE FLAGS
# ===============================================
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_CSV_EXPORT=true
NEXT_PUBLIC_ENABLE_AI_INSIGHTS=false

# ===============================================
# SECURITY
# ===============================================
ALLOWED_ORIGINS=http://localhost:3100,http://localhost:3000
EOF

echo "✅ Файл .env.local создан!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Запустите: supabase start"
echo "2. Скопируйте credentials из вывода команды в .env.local (если нужно обновить)"
echo "3. Запустите: npm run dev"
echo "4. Откройте: http://localhost:3100"
echo ""
echo "📚 Подробнее: см. PORTS_CONFIG.md"

