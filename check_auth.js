const SUPABASE_URL = 'https://baxitmywyznnbnsampug.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGl0bXl3eXpubmJuc2FtcHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTUzNDUsImV4cCI6MjA3NjE5MTM0NX0._eLyr_xcui4IGA80PNvrrM0hRpebQhn889DG4YUNdJ4'

async function checkAuth() {
  console.log('🔐 Проверка Supabase Auth...\n')
  
  // Проверка что Auth включён
  const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
    headers: { 'apikey': ANON_KEY }
  })
  
  if (response.ok) {
    const data = await response.json()
    console.log('✅ Supabase Auth работает')
    console.log(`   Version: ${data.version || 'unknown'}`)
  } else {
    console.log('⚠️  Auth service недоступен')
  }
  
  console.log('\n📝 ПРОБЛЕМА с 400 ошибкой:')
  console.log('\nВозможные причины:')
  console.log('1. Email confirmation включён (нужно подтверждение)')
  console.log('2. Неправильный формат email/password')
  console.log('3. Auth настройки в Supabase')
  console.log('\n✅ РЕШЕНИЕ:')
  console.log('\nВ Supabase Dashboard:')
  console.log('1. Authentication → Providers → Email')
  console.log('2. Отключите "Confirm email"')
  console.log('3. Сохраните')
  console.log('4. Попробуйте зарегистрироваться снова')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

checkAuth()
