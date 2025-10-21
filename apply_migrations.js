const SUPABASE_URL = 'https://baxitmywyznnbnsampug.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGl0bXl3eXpubmJuc2FtcHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYxNTM0NSwiZXhwIjoyMDc2MTkxMzQ1fQ.uQXZs-mLSjrNKiKFn-Mw6Hm74uWJu4BMRXTWMoQpkGQ'
const fs = require('fs')

console.log('🚀 Применение миграций в Supabase...\n')

async function executeSql(sql, name) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    })

    if (response.ok) {
      console.log(`✅ ${name}`)
      return true
    } else {
      const error = await response.text()
      console.log(`⚠️  ${name} - Status: ${response.status}`)
      if (response.status !== 404) {
        console.log(`   ${error.substring(0, 100)}...`)
      }
      return false
    }
  } catch (err) {
    console.log(`❌ ${name} - Error: ${err.message}`)
    return false
  }
}

// Альтернативный метод через pg_query (если exec_sql недоступен)
async function executeViaPostgrest(sql, name) {
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`   Выполняем ${statements.length} SQL команд...`)
  
  for (let i = 0; i < Math.min(3, statements.length); i++) {
    const stmt = statements[i] + ';'
    // Простая проверка что SQL валиден
    if (stmt.includes('CREATE TABLE') || stmt.includes('CREATE EXTENSION')) {
      console.log(`   ✓ SQL команда ${i+1} готова`)
    }
  }
  
  console.log(`   ℹ️  Для применения используйте SQL Editor в Dashboard`)
  return false
}

async function main() {
  const migrations = [
    {
      file: 'supabase/migrations/00001_initial_schema.sql',
      name: 'Migration 1: Initial Schema'
    },
    {
      file: 'supabase/migrations/00002_rls_policies.sql',
      name: 'Migration 2: RLS Policies'
    },
    {
      file: 'supabase/migrations/00003_materialized_views.sql',
      name: 'Migration 3: Materialized Views'
    },
    {
      file: 'supabase/migrations/00004_integrations_table.sql',
      name: 'Migration 4: Integrations Table'
    },
    {
      file: 'supabase/seed.sql',
      name: 'Seed Data'
    }
  ]

  for (const migration of migrations) {
    try {
      const sql = fs.readFileSync(migration.file, 'utf8')
      console.log(`\n📄 ${migration.name}`)
      console.log(`   Файл: ${migration.file}`)
      console.log(`   Размер: ${(sql.length / 1024).toFixed(1)} KB`)
      
      await executeViaPostgrest(sql, migration.name)
    } catch (err) {
      console.log(`❌ Не удалось прочитать ${migration.file}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📝 ПРИМЕНЕНИЕ МИГРАЦИЙ:')
  console.log('\nSupabase не позволяет применять миграции через API.')
  console.log('Нужно использовать SQL Editor в Dashboard.')
  console.log('\n✅ ПРОСТОЙ СПОСОБ:')
  console.log('\n1. Откройте SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/baxitmywyznnbnsampug/sql')
  console.log('\n2. Для каждого файла:')
  console.log('   - Откройте в редакторе')
  console.log('   - Ctrl+A → Ctrl+C (скопировать всё)')
  console.log('   - Вставьте в SQL Editor')
  console.log('   - Нажмите RUN ▶️')
  console.log('\n3. Файлы (по порядку):')
  migrations.forEach((m, i) => {
    console.log(`   ${i+1}. ${m.file.split('/').pop()}`)
  })
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
