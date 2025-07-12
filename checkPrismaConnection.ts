import { PrismaClient } from '@prisma/client'

async function checkPrismaConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Đang kiểm tra kết nối Prisma...')
    
    // Kiểm tra kết nối cơ bản
    await prisma.$connect()
    console.log('✅ Kết nối Prisma thành công!')
    
    // Kiểm tra một query đơn giản
    const userCount = await prisma.user.count()
    console.log(`📊 Số lượng users trong database: ${userCount}`)
    
    // Kiểm tra các bảng khác
    const questionCount = await prisma.question.count()
    console.log(`📝 Số lượng questions: ${questionCount}`)
    
    const quizCount = await prisma.quiz.count()
    console.log(`🧩 Số lượng quizzes: ${quizCount}`)
    
    const interviewCount = await prisma.interview.count()
    console.log(`🎤 Số lượng interviews: ${interviewCount}`)
    
    console.log('🎉 Tất cả kiểm tra kết nối đều thành công!')
    
  } catch (error) {
    console.error('❌ Lỗi kết nối Prisma:', error)
    
    if (error instanceof Error) {
      console.error('Chi tiết lỗi:', error.message)
      
      // Kiểm tra các lỗi phổ biến
      if (error.message.includes('DATABASE_URL')) {
        console.error('💡 Gợi ý: Kiểm tra biến môi trường DATABASE_URL')
      } else if (error.message.includes('connection')) {
        console.error('💡 Gợi ý: Kiểm tra kết nối database')
      } else if (error.message.includes('schema')) {
        console.error('💡 Gợi ý: Chạy "npx prisma generate" và "npx prisma db push"')
      }
    }
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Đã đóng kết nối Prisma')
  }
}

// Chạy kiểm tra
checkPrismaConnection() 