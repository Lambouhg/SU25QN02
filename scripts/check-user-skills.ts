import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserSkills() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        skills: true,
        interviewPreferences: true,
        preferredJobRole: {
          select: {
            title: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`Total users: ${users.length}\n`);

    for (const user of users) {
      console.log('--- User ---');
      console.log(`Email: ${user.email}`);
      console.log(`Skills (from onboarding):`, user.skills);
      console.log(`InterviewPreferences:`, user.interviewPreferences);
      console.log(`Job Role:`, user.preferredJobRole?.title);
      console.log(`Category:`, user.preferredJobRole?.category?.name);
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSkills();