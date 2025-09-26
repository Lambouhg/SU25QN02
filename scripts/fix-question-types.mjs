/**
 * ES Module version - Script để update Question Type dựa trên số lượng correct options
 * Usage: node scripts/fix-question-types.mjs [--execute] [--skip-validation]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeQuestions() {
  console.log('🔍 Analyzing questions and their options...\n');

  const questions = await prisma.questionItem.findMany({
    include: {
      options: {
        select: {
          id: true,
          text: true,
          isCorrect: true
        }
      }
    },
    where: {
      isArchived: false
    }
  });

  const analysis = [];

  for (const question of questions) {
    const totalOptions = question.options.length;
    const correctOptions = question.options.filter(opt => opt.isCorrect === true).length;
    
    let suggestedType;
    let needsUpdate = false;

    if (correctOptions === 1) {
      suggestedType = 'single_choice';
      needsUpdate = question.type !== 'single_choice';
    } else if (correctOptions >= 2) {
      suggestedType = 'multiple_choice';
      needsUpdate = question.type !== 'multiple_choice';
    } else {
      suggestedType = 'keep_current';
      needsUpdate = false;
    }

    analysis.push({
      id: question.id,
      stem: question.stem.substring(0, 80) + (question.stem.length > 80 ? '...' : ''),
      currentType: question.type,
      totalOptions,
      correctOptions,
      suggestedType,
      needsUpdate
    });
  }

  return analysis;
}

async function displayAnalysis(analysis) {
  console.log('📊 ANALYSIS RESULTS\n');
  console.log('='.repeat(120));
  console.log(`${'ID'.padEnd(8)} | ${'Current Type'.padEnd(15)} | ${'Suggested'.padEnd(15)} | ${'Options'.padEnd(7)} | ${'Correct'.padEnd(7)} | ${'Update?'.padEnd(8)} | Question`);
  console.log('='.repeat(120));

  let stats = {
    updateCount: 0,
    singleChoiceCount: 0,
    multipleChoiceCount: 0,
    keepCurrentCount: 0
  };

  for (const item of analysis) {
    const status = item.needsUpdate ? '✅ YES' : '❌ NO';
    const id = item.id.substring(0, 8);
    
    console.log(
      `${id.padEnd(8)} | ${item.currentType.padEnd(15)} | ${item.suggestedType.padEnd(15)} | ${item.totalOptions.toString().padEnd(7)} | ${item.correctOptions.toString().padEnd(7)} | ${status.padEnd(8)} | ${item.stem}`
    );

    if (item.needsUpdate) stats.updateCount++;
    if (item.suggestedType === 'single_choice') stats.singleChoiceCount++;
    if (item.suggestedType === 'multiple_choice') stats.multipleChoiceCount++;
    if (item.suggestedType === 'keep_current') stats.keepCurrentCount++;
  }

  console.log('='.repeat(120));
  console.log(`\n📈 SUMMARY:`);
  console.log(`Total Questions: ${analysis.length}`);
  console.log(`Need Updates: ${stats.updateCount}`);
  console.log(`Suggested Single Choice: ${stats.singleChoiceCount}`);
  console.log(`Suggested Multiple Choice: ${stats.multipleChoiceCount}`);
  console.log(`Keep Current: ${stats.keepCurrentCount}`);
  
  return analysis.filter(item => item.needsUpdate);
}

async function updateQuestionTypes(questionsToUpdate, dryRun = true) {
  if (questionsToUpdate.length === 0) {
    console.log('\n✅ No questions need updating!');
    return { success: 0, errors: 0 };
  }

  console.log(`\n${dryRun ? '🧪 DRY RUN' : '🚀 EXECUTING UPDATES'} - ${questionsToUpdate.length} questions`);
  console.log('='.repeat(80));

  let successCount = 0;
  let errorCount = 0;

  for (const question of questionsToUpdate) {
    try {
      if (!dryRun) {
        await prisma.questionItem.update({
          where: { id: question.id },
          data: { 
            type: question.suggestedType,
            updatedAt: new Date()
          }
        });
      }

      console.log(
        `${dryRun ? '[DRY]' : '[UPD]'} ${question.id.substring(0, 8)}: ${question.currentType} → ${question.suggestedType}`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Error updating ${question.id}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('='.repeat(80));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (dryRun) {
    console.log('\n💡 This was a dry run. Run with --execute to apply changes.');
  } else {
    console.log(`\n🎉 Successfully updated ${successCount} questions!`);
  }

  return { success: successCount, errors: errorCount };
}

async function validateQuestions() {
  console.log('\n🔍 Validating questions after update...');
  
  const questions = await prisma.questionItem.findMany({
    include: {
      options: {
        select: {
          isCorrect: true
        }
      }
    },
    where: {
      isArchived: false
    }
  });

  const issues = [];

  for (const question of questions) {
    const correctCount = question.options.filter(opt => opt.isCorrect).length;
    
    if (question.type === 'single_choice' && correctCount !== 1) {
      issues.push(`${question.id.substring(0, 8)}: single_choice but has ${correctCount} correct answers`);
    }
    
    if (question.type === 'multiple_choice' && correctCount < 2) {
      issues.push(`${question.id.substring(0, 8)}: multiple_choice but has ${correctCount} correct answers`);
    }

    // Check for questions with no options
    if (question.options.length === 0 && ['single_choice', 'multiple_choice'].includes(question.type)) {
      issues.push(`${question.id.substring(0, 8)}: ${question.type} but has no options`);
    }
  }

  if (issues.length > 0) {
    console.log('\n⚠️ VALIDATION ISSUES FOUND:');
    issues.forEach(issue => console.log(`- ${issue}`));
    return false;
  } else {
    console.log('\n✅ All questions are properly categorized!');
    return true;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');
    const skipValidation = args.includes('--skip-validation');

    console.log('🚀 Question Type Updater Script');
    console.log('================================\n');

    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be made');
      console.log('   Use --execute flag to apply changes\n');
    }

    // Step 1: Analyze questions
    console.time('Analysis completed in');
    const analysis = await analyzeQuestions();
    console.timeEnd('Analysis completed in');
    
    // Step 2: Display analysis
    const questionsToUpdate = await displayAnalysis(analysis);

    // Step 3: Update questions
    console.time('Update completed in');
    const result = await updateQuestionTypes(questionsToUpdate, dryRun);
    console.timeEnd('Update completed in');

    // Step 4: Validate (if not dry run and not skipped)
    if (!dryRun && !skipValidation) {
      console.time('Validation completed in');
      await validateQuestions();
      console.timeEnd('Validation completed in');
    }

    console.log('\n🏁 Script completed successfully!');
    
    if (dryRun && questionsToUpdate.length > 0) {
      console.log('\n💡 To apply these changes, run:');
      console.log('   node scripts/fix-question-types.mjs --execute');
    }

    // Return summary for potential external use
    return {
      totalAnalyzed: analysis.length,
      needsUpdate: questionsToUpdate.length,
      updated: result.success,
      errors: result.errors
    };

  } catch (error) {
    console.error('💥 Script failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeQuestions, updateQuestionTypes, validateQuestions };