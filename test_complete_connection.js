// Полная проверка Supabase с service role key
const SUPABASE_URL = 'https://baxitmywyznnbnsampug.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGl0bXl3eXpubmJuc2FtcHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYxNTM0NSwiZXhwIjoyMDc2MTkxMzQ1fQ.uQXZs-mLSjrNKiKFn-Mw6Hm74uWJu4BMRXTWMoQpkGQ'

console.log('🔍 Тестирование Supabase с Service Role Key...\n')

// Проверка наличия таблиц
const tables = ['profiles', 'contacts', 'companies', 'deals', 'events', 'integrations']
let allTablesExist = true

async function checkTables() {
  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: { 
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      })
      
      if (res.ok) {
        console.log(`✅ Таблица "${table}" существует`)
      } else if (res.status === 404) {
        console.log(`❌ Таблица "${table}" НЕ найдена`)
        allTablesExist = false
      } else {
        console.log(`⚠️  Таблица "${table}" - ошибка: ${res.status}`)
        allTablesExist = false
      }
    } catch (err) {
      console.log(`❌ Ошибка проверки "${table}":`, err.message)
      allTablesExist = false
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (allTablesExist) {
    console.log('\n🎉 ВСЕ ТАБЛИЦЫ СОЗДАНЫ! База данных готова!')
    console.log('\n✅ Можно тестировать:')
    console.log('   1. npm run dev (перезапустить)')
    console.log('   2. open http://localhost:3100')
    console.log('   3. Регистрация → Dashboard → Import')
  } else {
    console.log('\n⚠️  ТАБЛИЦЫ НЕ СОЗДАНЫ')
    console.log('\n📝 Нужно применить миграции:')
    console.log('   1. Откройте: https://supabase.com/dashboard/project/baxitmywyznnbnsampug/sql')
    console.log('   2. Copy-paste файлы из supabase/migrations/')
    console.log('   3. Запустите каждый файл (RUN)')
    console.log('\n   Файлы:')
    console.log('   - 00001_initial_schema.sql')
    console.log('   - 00002_rls_policies.sql')
    console.log('   - 00003_materialized_views.sql')
    console.log('   - 00004_integrations_table.sql')
    console.log('   - seed.sql')
  }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

checkTables()
