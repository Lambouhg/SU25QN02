// Enhanced test script for duplicate detection with real-time checking

interface TestQuestion {
  stem: string;
  type: string;
  level: string;
  difficulty: string;
  category: string;
  fields: string[];
  topics: string[];
  skills: string[];
  explanation?: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
}

interface TestScenario {
  name: string;
  description: string;
  config: {
    field: string;
    level: string;
    difficulty: string;
    questionCount: number;
    questionType: string;
    topics: string;
  };
  expectedBehavior: string;
}

const testScenarios: TestScenario[] = [
  {
    name: "Empty Database Test",
    description: "Test with empty database - should show all questions as safe",
    config: {
      field: 'Frontend Development',
      level: 'junior',
      difficulty: 'easy',
      questionCount: 3,
      questionType: 'single_choice',
      topics: 'React, JavaScript'
    },
    expectedBehavior: "All questions should be marked as SAFE since database is empty"
  },
  {
    name: "Duplicate Detection Test",
    description: "Generate, save, then generate similar questions",
    config: {
      field: 'Frontend Development',
      level: 'junior',
      difficulty: 'easy',
      questionCount: 2,
      questionType: 'single_choice',
      topics: 'React hooks, useState'
    },
    expectedBehavior: "Second generation should detect duplicates from first generation"
  },
  {
    name: "Different Topic Test",
    description: "Generate questions on different topics",
    config: {
      field: 'Backend Development',
      level: 'senior',
      difficulty: 'hard',
      questionCount: 2,
      questionType: 'multiple_choice',
      topics: 'Node.js, Database design'
    },
    expectedBehavior: "Should be marked as safe if no similar backend questions exist"
  }
];

// Test database stats endpoint
const testDatabaseStats = async () => {
  try {
    console.log('📊 Testing database stats...');
    
    const response = await fetch('/api/admin/qb2/questions/check-duplicates', {
      method: 'GET'
    });
    
    const stats = await response.json();
    
    if (response.ok) {
      console.log('✅ Database stats:', stats);
      return stats;
    } else {
      console.error('❌ Failed to get database stats:', stats.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Database stats request failed:', error);
    return null;
  }
};

// Test question generation
const testQuestionGeneration = async (config: TestScenario['config']) => {
  try {
    console.log(`🎯 Generating questions for: ${config.field} - ${config.topics}`);
    
    const response = await fetch('/api/admin/qb2/questions/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    const data = await response.json();
    
    if (response.ok && data.questions) {
      console.log(`✅ Generated ${data.questions.length} questions`);
      return data.questions;
    } else {
      console.error('❌ Generation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Generation request failed:', error);
    return null;
  }
};

// Test duplicate checking
const testDuplicateCheck = async (questions: TestQuestion[]) => {
  try {
    console.log(`🔍 Checking ${questions.length} questions for duplicates...`);
    
    const response = await fetch('/api/admin/qb2/questions/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: questions.map(q => ({
          stem: q.stem,
          category: q.category,
          fields: q.fields
        })),
        similarityThreshold: 0.8
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Duplicate check results:', data.summary);
      return data;
    } else {
      console.error('❌ Duplicate check failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Duplicate check request failed:', error);
    return null;
  }
};

// Test bulk import
const testBulkImport = async (questions: TestQuestion[], skipDuplicateCheck = false) => {
  try {
    console.log(`💾 Importing ${questions.length} questions (skipDuplicateCheck: ${skipDuplicateCheck})...`);
    
    const response = await fetch('/api/admin/qb2/questions/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: questions.map(q => ({
          stem: q.stem,
          type: q.type,
          level: q.level,
          difficulty: q.difficulty,
          category: q.category,
          fields: q.fields.join(','),
          topics: q.topics.join(','),
          skills: q.skills.join(','),
          explanation: q.explanation,
          ...(q.options?.reduce((acc: Record<string, unknown>, opt: { text: string; isCorrect: boolean }, idx: number) => ({
            ...acc,
            [`option${idx + 1}`]: opt.text,
            [`option${idx + 1}_correct`]: opt.isCorrect
          }), {}) || {})
        })),
        skipDuplicateCheck,
        similarityThreshold: 0.8
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Import results:', {
        success: data.success,
        failed: data.failed,
        skipped: data.skipped,
        duplicatesFound: data.duplicatesFound
      });
      return data;
    } else {
      console.error('❌ Import failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Import request failed:', error);
    return null;
  }
};

// Run comprehensive test
const runComprehensiveTest = async () => {
  console.log('🧪 Starting Comprehensive Duplicate Detection Test\n');
  
  // Get initial database stats
  const initialStats = await testDatabaseStats();
  console.log('\n📊 Initial database state:', initialStats?.totalQuestions || 0, 'questions\n');
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n🎬 SCENARIO ${i + 1}: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log(`🎯 Expected: ${scenario.expectedBehavior}\n`);
    
    // Step 1: Generate questions
    const questions = await testQuestionGeneration(scenario.config);
    if (!questions) {
      console.log('❌ Skipping scenario due to generation failure\n');
      continue;
    }
    
    // Step 2: Check for duplicates
    const duplicateCheck = await testDuplicateCheck(questions);
    if (duplicateCheck) {
      console.log(`🔍 Duplicate analysis:
        - Safe: ${duplicateCheck.summary.safe}
        - Warnings: ${duplicateCheck.summary.warnings}
        - Duplicates: ${duplicateCheck.summary.duplicates}`);
    }
    
    // Step 3: Import questions (only if they're mostly safe)
    if (duplicateCheck && duplicateCheck.summary.duplicates === 0) {
      const importResult = await testBulkImport(questions, false);
      if (importResult) {
        console.log(`💾 Import successful: ${importResult.success} saved`);
      }
    } else {
      console.log('⚠️ Skipping import due to duplicates detected');
    }
    
    console.log(`\n✅ Scenario ${i + 1} completed\n${'='.repeat(50)}`);
    
    // Small delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final database stats
  const finalStats = await testDatabaseStats();
  console.log('\n📊 Final database state:', finalStats?.totalQuestions || 0, 'questions');
  
  console.log('\n🎉 Comprehensive test completed!');
};

// Test specific duplicate detection scenario
const testDuplicateScenario = async () => {
  console.log('🧪 Testing Duplicate Detection Scenario\n');
  
  const config = {
    field: 'Frontend Development',
    level: 'junior',
    difficulty: 'easy',
    questionCount: 2,
    questionType: 'single_choice',
    topics: 'React hooks, useState'
  };
  
  // Generate first set
  console.log('📝 Generating first set of questions...');
  const firstSet = await testQuestionGeneration(config);
  if (!firstSet) return;
  
  // Check first set (should be safe in empty db)
  console.log('🔍 Checking first set for duplicates...');
  const firstCheck = await testDuplicateCheck(firstSet);
  console.log('First set results:', firstCheck?.summary);
  
  // Import first set
  console.log('💾 Importing first set...');
  const firstImport = await testBulkImport(firstSet, false);
  console.log('First import results:', firstImport?.success, 'saved');
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate second set (similar topics)
  console.log('\n📝 Generating second set (similar topics)...');
  const secondSet = await testQuestionGeneration(config);
  if (!secondSet) return;
  
  // Check second set (should detect some duplicates)
  console.log('🔍 Checking second set for duplicates...');
  const secondCheck = await testDuplicateCheck(secondSet);
  console.log('Second set results:', secondCheck?.summary);
  
  if (secondCheck && secondCheck.summary.duplicates > 0) {
    console.log('✅ SUCCESS: Duplicate detection is working!');
    console.log('🔍 Duplicate details:');
    secondCheck.results.forEach((result: { recommendation: string; confidence: number; similarQuestions: Array<{ similarity: number; stem: string }> }, index: number) => {
      if (result.recommendation === 'reject' || result.recommendation === 'review') {
        console.log(`  Question ${index + 1}: ${result.recommendation.toUpperCase()} (${Math.round(result.confidence * 100)}% confidence)`);
        result.similarQuestions.forEach((sim: { similarity: number; stem: string }) => {
          console.log(`    - ${Math.round(sim.similarity * 100)}% similar: ${sim.stem.substring(0, 50)}...`);
        });
      }
    });
  } else {
    console.log('⚠️ No duplicates detected - this might indicate an issue');
  }
};

// Export functions for manual testing
if (typeof window !== 'undefined') {
  const globalWindow = window as unknown as Record<string, unknown>;
  globalWindow.runComprehensiveTest = runComprehensiveTest;
  globalWindow.testDuplicateScenario = testDuplicateScenario;
  globalWindow.testDatabaseStats = testDatabaseStats;
  globalWindow.testQuestionGeneration = testQuestionGeneration;
  globalWindow.testDuplicateCheck = testDuplicateCheck;
  globalWindow.testBulkImport = testBulkImport;
  
  console.log('🧪 Enhanced test functions available:');
  console.log('- runComprehensiveTest() - Full test suite');
  console.log('- testDuplicateScenario() - Focused duplicate test');
  console.log('- testDatabaseStats() - Check database stats');
  console.log('- testQuestionGeneration(config) - Test generation only');
  console.log('- testDuplicateCheck(questions) - Test duplicate checking only');
  console.log('- testBulkImport(questions, skipCheck) - Test import only');
}

export { 
  runComprehensiveTest, 
  testDuplicateScenario, 
  testDatabaseStats,
  testQuestionGeneration,
  testDuplicateCheck,
  testBulkImport
};