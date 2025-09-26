/**
 * Optimized Question Type Fixer - Fast version
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeAndFix(dryRun = true) {
  console.log(`🚀 Question Type Fixer ${dryRun ? '(DRY RUN)' : '(EXECUTE MODE)'}`);
  console.log('='.repeat(60));
  
  try {
    // Get all questions with their options in one query
    console.log('📊 Analyzing questions...');
    const questions = await prisma.questionItem.findMany({
      where: { isArchived: false },
      include: {
        options: {
          select: { isCorrect: true }
        }
      }
    });

    console.log(`Found ${questions.length} active questions`);
    
    // Analyze each question
    const updates = [];
    let stats = {
      total: questions.length,
      alreadyCorrect: 0,
      needSingleChoice: 0,
      needMultipleChoice: 0,
      noOptions: 0
    };

    for (const question of questions) {
      const correctCount = question.options.filter(opt => opt.isCorrect).length;
      
      if (correctCount === 1 && question.type !== 'single_choice') {
        stats.needSingleChoice++;
        updates.push({
          id: question.id,
          currentType: question.type,
          suggestedType: 'single_choice',
          correctCount,
          stem: question.stem.substring(0, 60) + '...'
        });
      } else if (correctCount >= 2 && question.type !== 'multiple_choice') {
        stats.needMultipleChoice++;
        updates.push({
          id: question.id,
          currentType: question.type,
          suggestedType: 'multiple_choice',
          correctCount,
          stem: question.stem.substring(0, 60) + '...'
        });
      } else if (correctCount === 0) {
        stats.noOptions++;
      } else {
        stats.alreadyCorrect++;
      }
    }

    // Display results
    console.log('\n📈 ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total questions: ${stats.total}`);
    console.log(`Already correct: ${stats.alreadyCorrect}`);
    console.log(`Need → single_choice: ${stats.needSingleChoice}`);
    console.log(`Need → multiple_choice: ${stats.needMultipleChoice}`);
    console.log(`No correct options: ${stats.noOptions}`);
    console.log(`TOTAL UPDATES NEEDED: ${updates.length}`);

    if (updates.length === 0) {
      console.log('\n✅ All questions are already correctly typed!');
      return { success: true, updated: 0 };
    }

    // Show sample updates
    console.log('\n📋 SAMPLE UPDATES (first 10):');
    console.log('ID'.padEnd(10) + 'Current'.padEnd(16) + 'New'.padEnd(16) + 'Correct#'.padEnd(10) + 'Question');
    console.log('='.repeat(90));
    
    updates.slice(0, 10).forEach(update => {
      console.log(
        update.id.substring(0, 8).padEnd(10) +
        update.currentType.padEnd(16) +
        update.suggestedType.padEnd(16) +
        update.correctCount.toString().padEnd(10) +
        update.stem
      );
    });

    if (updates.length > 10) {
      console.log(`... and ${updates.length - 10} more`);
    }

    // Apply updates if not dry run
    if (!dryRun) {
      console.log('\n🚀 APPLYING UPDATES...');
      console.log('='.repeat(40));
      
      let success = 0;
      let errors = 0;

      for (const update of updates) {
        try {
          await prisma.questionItem.update({
            where: { id: update.id },
            data: { 
              type: update.suggestedType,
              updatedAt: new Date()
            }
          });
          success++;
          
          if (success % 10 === 0) {
            console.log(`✅ Updated ${success}/${updates.length} questions...`);
          }
        } catch (error) {
          console.error(`❌ Failed to update ${update.id}: ${error.message}`);
          errors++;
        }
      }

      console.log('\n📊 UPDATE RESULTS:');
      console.log(`✅ Success: ${success}`);
      console.log(`❌ Errors: ${errors}`);
      
      return { success: true, updated: success, errors };
    } else {
      console.log('\n💡 This was a DRY RUN - no changes made');
      console.log('To apply changes, run with --execute flag');
      return { success: true, wouldUpdate: updates.length };
    }

  } catch (error) {
    console.error('💥 Script failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  try {
    const result = await analyzeAndFix(dryRun);
    
    if (result.success) {
      console.log('\n🎉 Script completed successfully!');
    } else {
      console.log('\n❌ Script failed:', result.error);
      process.exit(1);
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

main();