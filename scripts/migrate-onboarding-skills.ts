import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOnboardingSkillsToInterviewPreferences() {
  try {
    console.log('🔄 Starting migration: Onboarding skills → Interview preferences');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        skills: true,
        interviewPreferences: true
      }
    });

    console.log(`Found ${users.length} users with onboarding skills\n`);

    for (const user of users) {
      const existingSkills = Array.isArray(user.skills) ? user.skills : [];
      
      if (existingSkills.length === 0) {
        console.log(`⏭️  Skipping ${user.email}: No skills to migrate`);
        continue;
      }

      // Check if user already has interviewPreferences
      const hasInterviewPrefs = user.interviewPreferences && 
        typeof user.interviewPreferences === 'object' &&
        user.interviewPreferences !== null;

      const existingPrefs = hasInterviewPrefs ? user.interviewPreferences as Record<string, unknown> : {};
      const existingSelectedSkills = Array.isArray(existingPrefs.selectedSkills) ? existingPrefs.selectedSkills : [];
      
      // Only migrate if user doesn't have selectedSkills or has empty selectedSkills
      if (existingSelectedSkills.length > 0) {
        console.log(`⏭️  Skipping ${user.email}: Already has selected skills:`, existingSelectedSkills);
        continue;
      }

      console.log(`🔄 Migrating ${user.email}:`);
      console.log(`   From skills:`, existingSkills);
      
      const newInterviewPreferences = {
        selectedSkills: existingSkills,
        customSkills: Array.isArray(existingPrefs.customSkills) ? existingPrefs.customSkills : [],
        showJobRoleSelector: existingPrefs.showJobRoleSelector ?? true,
        defaultAvatarId: existingPrefs.defaultAvatarId || '',
        enableVoiceInteraction: existingPrefs.enableVoiceInteraction ?? true
      };

      await prisma.user.update({
        where: { clerkId: user.clerkId },
        data: {
          interviewPreferences: newInterviewPreferences
        }
      });

      console.log(`   ✅ To interviewPreferences.selectedSkills:`, newInterviewPreferences.selectedSkills);
      console.log('');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateOnboardingSkillsToInterviewPreferences();