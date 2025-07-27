import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Create 3 service packages
    const packages = [
        {
            name: 'Basic',
            description: 'Gói cơ bản cho người mới bắt đầu',
            price: 150000, // 150,000 VND
            duration: 30, // 30 days
            avatarInterviewLimit: 5,
            testQuizEQLimit: 10,
            jdUploadLimit: 3,
            highlight: false,
            isActive: true
        },
        {
            name: 'Standard',
            description: 'Gói tiêu chuẩn cho người có kinh nghiệm',
            price: 250000, // 250,000 VND
            duration: 30, // 30 days
            avatarInterviewLimit: 8,
            testQuizEQLimit: 15,
            jdUploadLimit: 5,
            highlight: true, // Featured package
            isActive: true
        },
        {
            name: 'Pro',
            description: 'Gói cao cấp cho chuyên gia',
            price: 500000, // 500,000 VND
            duration: 30, // 30 days
            avatarInterviewLimit: 20,
            testQuizEQLimit: 30,
            jdUploadLimit: 10,
            highlight: false,
            isActive: true
        }
    ]

    for (const pkg of packages) {
        const existingPackage = await prisma.servicePackage.findFirst({
            where: { name: pkg.name }
        })

        if (!existingPackage) {
            await prisma.servicePackage.create({
                data: pkg
            })
            console.log(`✅ Created package: ${pkg.name}`)
        } else {
            console.log(`⏭️  Package already exists: ${pkg.name}`)
        }
    }

    console.log('🎉 Database seeding completed!')
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    }) 