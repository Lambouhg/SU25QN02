// Test script for duplicate detection functionality
// Run this in browser console or as a standalone test

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

const testQuestionGeneration = async (): Promise<TestQuestion[]> => {
  try {
    console.log('Testing AI Question Generation...');
    
    const response = await fetch('/api/admin/qb2/questions/ai-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'Frontend Development',
        level: 'junior',
        difficulty: 'easy',
        questionCount: 3,
        questionType: 'single_choice',
        topics: 'React, JavaScript',
        customPrompt: ''
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    console.log('✅ Question generation successful:', data);
    return data.questions;
    
  } catch (error) {
    console.error('❌ Question generation failed:', error);
    throw error;
  }
};

const testBulkImportWithDuplicateCheck = async (questions: TestQuestion[]) => {
  try {
    console.log('Testing Bulk Import with Duplicate Check...');
    
    const response = await fetch('/api/admin/qb2/questions/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions: questions.map((q: TestQuestion) => ({
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
        skipDuplicateCheck: false,
        similarityThreshold: 0.8
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Import failed');
    }

    console.log('✅ Bulk import successful:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Bulk import failed:', error);
    throw error;
  }
};

const testDuplicateDetection = async () => {
  try {
    console.log('🧪 Starting Duplicate Detection Test...');
    
    // Step 1: Generate questions
    const questions = await testQuestionGeneration();
    
    // Step 2: Import questions first time (should succeed)
    console.log('📤 First import...');
    const firstImport = await testBulkImportWithDuplicateCheck(questions);
    
    // Step 3: Try to import same questions again (should detect duplicates)
    console.log('📤 Second import (should detect duplicates)...');
    const secondImport = await testBulkImportWithDuplicateCheck(questions);
    
    console.log('🎉 Test completed successfully!');
    console.log('First import results:', firstImport);
    console.log('Second import results:', secondImport);
    
    // Verify duplicate detection worked
    if (secondImport.duplicatesFound > 0) {
      console.log('✅ Duplicate detection is working correctly!');
    } else {
      console.log('⚠️ No duplicates detected in second import - this might be unexpected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for manual testing
if (typeof window !== 'undefined') {
  const globalWindow = window as unknown as Record<string, unknown>;
  globalWindow.testDuplicateDetection = testDuplicateDetection;
  globalWindow.testQuestionGeneration = testQuestionGeneration;
  globalWindow.testBulkImportWithDuplicateCheck = testBulkImportWithDuplicateCheck;
  
  console.log('🧪 Test functions available:');
  console.log('- testDuplicateDetection()');
  console.log('- testQuestionGeneration()');
  console.log('- testBulkImportWithDuplicateCheck(questions)');
}

export { testDuplicateDetection, testQuestionGeneration, testBulkImportWithDuplicateCheck };