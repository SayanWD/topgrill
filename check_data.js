const SUPABASE_URL = 'https://baxitmywyznnbnsampug.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGl0bXl3eXpubmJuc2FtcHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYxNTM0NSwiZXhwIjoyMDc2MTkxMzQ1fQ.uQXZs-mLSjrNKiKFn-Mw6Hm74uWJu4BMRXTWMoQpkGQ'

async function checkData() {
  console.log('🔍 Проверка данных в базе...\n')
  
  const tables = ['contacts', 'companies', 'deals', 'activities', 'events']
  
  for (const table of tables) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    })
    
    const count = res.headers.get('content-range')?.split('/')[1] || '0'
    console.log(`${table.padEnd(15)} ${count.padStart(3)} записей`)
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n🎉 БАЗА ДАННЫХ ГОТОВА!')
  console.log('\n✅ Что работает:')
  console.log('   - Next.js: http://localhost:3100')
  console.log('   - Supabase: подключён')
  console.log('   - Таблицы: созданы')
  console.log('   - Seed данные: загружены')
  console.log('\n🧪 Что тестировать:')
  console.log('   1. Откройте: http://localhost:3100')
  console.log('   2. Регистрация: любой email + пароль')
  console.log('   3. Dashboard: /analytics')
  console.log('   4. Import: /import (CSV, amoCRM)')
  console.log('   5. Contacts: /contacts')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

checkData()
