import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAverageScoring() {
  try {
    console.log('🧮 Testing average score calculation...\n');
    
    const user = await prisma.user.findFirst({
      where: {
        email: 'viett9961@gmail.com'
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const skills = await prisma.userSkillSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });

    // Group by skill name
    const skillGroups = {};
    skills.forEach(skill => {
      if (!skillGroups[skill.skillName]) {
        skillGroups[skill.skillName] = [];
      }
      skillGroups[skill.skillName].push(skill);
    });

    console.log('📊 Average Score Analysis:\n');
    
    Object.entries(skillGroups).forEach(([skillName, skillData]) => {
      const scores = skillData.map(s => s.score);
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const averageScore = totalScore / scores.length;
      
      const latest = skillData[skillData.length - 1];
      const previous = skillData[skillData.length - 2];
      const trend = previous ? latest.score - previous.score : null;
      
      console.log(`🎯 ${skillName}:`);
      console.log(`   Average Score: ${averageScore.toFixed(1)} (from ${scores.length} sessions)`);
      console.log(`   Latest Score: ${latest.score} (${latest.source})`);
      console.log(`   Trend: ${trend ? (trend > 0 ? '+' : '') + trend.toFixed(1) : 'N/A'}`);
      console.log(`   All Scores: [${scores.join(', ')}]`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAverageScoring();