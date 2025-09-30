import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

async function createAdmin() {
  try {
    console.log('🔧 Создание тестового администратора...')
    
    const login = 'jessy'
    const password = 'Fuck2015@'
    const note = 'Главный администратор'

    // Проверяем, существует ли уже администратор с таким логином
    const existingAdmin = await prisma.callcentreAdmin.findUnique({
      where: { login }
    })

    if (existingAdmin) {
      console.log('⚠️  Администратор с логином "jessy" уже существует')
      
      // Обновляем пароль существующего администратора
      const hashedPassword = await bcrypt.hash(password, 12)
      
      await prisma.callcentreAdmin.update({
        where: { login },
        data: { 
          password: hashedPassword,
          note: note
        }
      })
      
      console.log('✅ Пароль администратора обновлен')
      console.log(`📋 Данные для входа:`)
      console.log(`   Логин: ${login}`)
      console.log(`   Пароль: ${password}`)
      console.log(`   URL: http://localhost:3000/adlogin`)
      
    } else {
      // Создаем нового администратора
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const newAdmin = await prisma.callcentreAdmin.create({
        data: {
          login,
          password: hashedPassword,
          note
        }
      })
      
      console.log('✅ Новый администратор создан успешно')
      console.log(`📋 Данные для входа:`)
      console.log(`   ID: ${newAdmin.id}`)
      console.log(`   Логин: ${login}`)
      console.log(`   Пароль: ${password}`)
      console.log(`   URL: http://localhost:3000/adlogin`)
    }

  } catch (error) {
    console.error('❌ Ошибка создания администратора:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
