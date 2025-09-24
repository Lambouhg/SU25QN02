const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportAllData() {
  // Danh sách các model cần export, chỉnh lại theo schema của bạn
  const models = [
    'Role',
    'Permission',
    'RolePermission',
    'User',
    'Interview',
    'QuestionItem',
    'QuestionOption',
    'QuestionSet',
    'QuestionSetQuestion',
    'QuizAttempt',
    'JdQuestions',
    'JdAnswers',
    'Assessment',
    'ServicePackage',
    'UserPackage',
    'PaymentHistory',
    'UserActivityEvent',
    'UserDailyStats',
    'UserSkillSnapshot',
    'JobCategory',
    'JobSpecialization',
    'JobRole'
  ];

  for (const model of models) {
    try {
      const data = await prisma[model.charAt(0).toLowerCase() + model.slice(1)].findMany();
      fs.writeFileSync(`export/${model}.json`, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ Exported ${model} (${data.length} records) to export/${model}.json`);
    } catch (err) {
      console.warn(`Model ${model} không tồn tại hoặc lỗi:`, err.message);
    }
  }
  await prisma.$disconnect();
}

exportAllData();
