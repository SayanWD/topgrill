// Проверка Supabase подключения
const SUPABASE_URL = 'https://baxitmywyznnbnsampug.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGl0bXl3eXpubmJuc2FtcHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTUzNDUsImV4cCI6MjA3NjE5MTM0NX0._eLyr_xcui4IGA80PNvrrM0hRpebQhn889DG4YUNdJ4'

console.log('🔍 Проверка подключения к Supabase...\n')

// Тест 1: Проверка доступности API
fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: { 'apikey': ANON_KEY }
})
.then(res => {
  if (res.ok) {
    console.log('✅ Supabase API доступен')
    console.log(`   URL: ${SUPABASE_URL}`)
    
    // Тест 2: Проверка таблиц
    return fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
      headers: { 
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    })
  } else {
    throw new Error(`API недоступен: ${res.status}`)
  }
})
.then(res => {
  if (res.status === 404 || res.status === 400) {
    console.log('\n⚠️  Таблицы НЕ созданы')
    console.log('   Нужно применить миграции!')
    console.log('\n📝 ЧТО ДЕЛАТЬ:')
    console.log('   1. Откройте SQL Editor в Supabase Dashboard')
    console.log('   2. Примените миграции (4 файла)')
    console.log('   3. См. файл: SUPABASE_MIGRATION_INSTRUCTIONS.md')
  } else if (res.ok) {
    console.log('✅ Таблицы созданы')
    return res.json()
  }
  return null
})
.then(data => {
  if (data) {
    console.log(`✅ База данных работает (profiles table exists)`)
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⏳ ЧТО НУЖНО ДЛЯ ЗАВЕРШЕНИЯ:')
  console.log('\n1️⃣  Service Role Key (обязательно)')
  console.log('   Где: Supabase Dashboard → Settings → API')
  console.log('   Что: service_role key (нажмите 👁️ Reveal)')
  console.log('   Куда: .env.local → SUPABASE_SERVICE_ROLE_KEY=')
  console.log('\n2️⃣  Применить миграции (если ещё не)')
  console.log('   Где: SQL Editor в Supabase')
  console.log('   Что: 4 файла из supabase/migrations/')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})
.catch(err => {
  console.error('❌ Ошибка:', err.message)
})
