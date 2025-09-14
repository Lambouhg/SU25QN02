import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUserPreferences() {
  try {
    // Set interview preferences for current user
    const clerkId = 'user_31xlDtpsy9GiD7B1vF5iamic8vk'; // tranphuc16102003@gmail.com
    
    const result = await prisma.user.update({
      where: { clerkId },
      data: {
        interviewPreferences: {
          selectedSkills: ['React'], // Chỉ React như user muốn
          customSkills: []
        }
      }
    });

    console.log('✅ Updated user preferences:', result.interviewPreferences);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUserPreferences();