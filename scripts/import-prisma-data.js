const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function importModel(model) {
  const filePath = path.join(__dirname, '../export', `${model}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`❌ Không tìm thấy file: ${filePath}`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`⚠️ Không có dữ liệu cho model ${model}`);
    return;
  }
  let importedCount = 0;
  let skippedCount = 0;
  for (const item of data) {
    try {
      await prisma[model.charAt(0).toLowerCase() + model.slice(1)].create({ data: item });
      importedCount++;
    } catch (err) {
      // Nếu lỗi unique constraint ở bảng User thì bỏ qua bản ghi
      if (
        model === 'User' &&
        err.code === 'P2002' &&
        err.meta && err.meta.target && err.meta.target.includes('email')
      ) {
        console.warn(`Bỏ qua bản ghi User trùng email: ${item.email}`);
        skippedCount++;
        continue;
      }
      console.warn(`Lỗi import ${model}:`, err.message);
      skippedCount++;
    }
  }
  console.log(`✅ Đã import ${importedCount} bản ghi cho model ${model}`);
  if (skippedCount > 0) {
    console.log(`⚠️ Đã bỏ qua ${skippedCount} bản ghi cho model ${model}`);
  }
}

async function main() {
  // Import các bảng không có foreign key trước
  const modelsNoFK = [
    'Role',
    'Permission',
    'JobCategory',
    'JobSpecialization',
    'JobRole',
    'ServicePackage'
  ];
  for (const model of modelsNoFK) {
    await importModel(model);
  }

  // Import các bảng có foreign key sau
  const modelsWithFK = [
    'RolePermission',
    'User',
    'PaymentHistory',
    'UserPackage',
    'Interview',
    'Assessment',
    'QuestionItem',
    'QuestionOption',
    'QuestionSet',
    'QuestionSetQuestion',
    'QuizAttempt',
    'JdQuestions',
    'JdAnswers',
    'UserActivityEvent',
    'UserDailyStats',
    'UserSkillSnapshot'
  ];
  for (const model of modelsWithFK) {
    await importModel(model);
  }
  await prisma.$disconnect();
}

main();
