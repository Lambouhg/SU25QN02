const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding roles...')

  // Tạo role user trước
  await prisma.role.upsert({
    where: { id: 'user_role_id' },
    update: {},
    create: {
      id: 'user_role_id',
      name: 'user',
      displayName: 'User',
      description: 'Standard user role',
      isDefault: true,
      isActive: true
    }
  })

  // Tạo role admin
  await prisma.role.upsert({
    where: { id: 'admin_role_id' },
    update: {},
    create: {
      id: 'admin_role_id',
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrator with full access',
      isDefault: false,
      isActive: true
    }
  })

  console.log('✅ Roles seeded successfully!')
  await prisma.$disconnect()
}

main().catch(console.error)
