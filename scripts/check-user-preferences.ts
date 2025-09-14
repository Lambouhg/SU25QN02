import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPreferences() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        interviewPreferences: true,
        preferredJobRoleId: true,
        preferredLanguage: true,
        autoStartWithPreferences: true
      }
    });

    console.log('Total users:', users.length);
    
    for (const user of users) {
      console.log('\n--- User ---');
      console.log('ID:', user.id);
      console.log('ClerkID:', user.clerkId);
      console.log('Email:', user.email);
      console.log('InterviewPreferences:', user.interviewPreferences);
      console.log('PreferredJobRoleId:', user.preferredJobRoleId);
      console.log('PreferredLanguage:', user.preferredLanguage);
      console.log('AutoStartWithPreferences:', user.autoStartWithPreferences);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPreferences();