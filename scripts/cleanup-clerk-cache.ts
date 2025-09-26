import { clerkClient } from "@clerk/nextjs/server";
import prisma from "../src/lib/prisma";

const OLD_CLERK_ID = "idn_32dF50W2nvCjJuzuR1oWE76bwMI";

async function cleanupClerkCache() {
  console.log(`🧹 Cleaning up old Clerk ID: ${OLD_CLERK_ID}`);
  
  try {
    // 1. Clean database first
    console.log("📖 Checking database for user...");
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: OLD_CLERK_ID }
    });

    if (dbUser) {
      console.log("🗑️ Found user in database, deleting...");
      
      // Delete all related records first
      await prisma.userActivityEvent.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.userDailyStats.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.userSkillSnapshot.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.quizAttempt.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.jdQuestions.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.jdAnswers.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.assessment.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.userPackage.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.paymentHistory.deleteMany({
        where: { userId: dbUser.id }
      });

      await prisma.interview.deleteMany({
        where: { userId: dbUser.id }
      });

      // Finally delete the user
      await prisma.user.delete({
        where: { clerkId: OLD_CLERK_ID }
      });

      console.log("✅ User deleted from database");
    } else {
      console.log("ℹ️ User not found in database");
    }

    // 2. Check Clerk and try to delete if exists
    try {
      console.log("🔍 Checking Clerk for user...");
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(OLD_CLERK_ID);
      
      if (clerkUser) {
        console.log("🗑️ Found user in Clerk, deleting...");
        await clerk.users.deleteUser(OLD_CLERK_ID);
        console.log("✅ User deleted from Clerk");
      }
    } catch (clerkError: any) {
      if (clerkError.status === 404 || clerkError.code === 'resource_not_found') {
        console.log("ℹ️ User not found in Clerk (already deleted)");
      } else {
        console.log("⚠️ Clerk error:", clerkError.message);
      }
    }

    console.log("🎉 Cleanup completed!");
    
    // 3. Clear browser cache hint
    console.log(`
📝 Next steps:
1. Clear your browser cache and cookies for this site
2. Sign out completely from Clerk (if logged in)
3. Try signing up again with a fresh session
4. If still having issues, try incognito/private mode
    `);

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

// Run cleanup
cleanupClerkCache().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});