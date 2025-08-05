import { getAIResponse } from './azureAiservicesforJD';

export interface GeneratedQuizQuestion {
  question: string;
  options: string[]; // 4 options A, B, C, D
  correct: number[]; // index of correct answers (can be one or more)
  explanation?: string;
}

/**
 * Call AI to generate quiz multiple-choice (single/multiple answer)
 * @param field Field
 * @param topic Topic
 * @param level Level (junior/middle/senior)
 * @param count Number of questions
 * @param language Language (default: 'en')
 */
export async function generateQuizQuestionsByAI({
  field,
  topic,
  level,
  count,
  language = 'en',
}: {
  field: string;
  topic: string;
  level: string;
  count: number;
  language?: 'en' | 'vi';
}): Promise<GeneratedQuizQuestion[]> {
  const allQuestions: GeneratedQuizQuestion[] = [];
  
  // For large counts, split into batches to avoid token limits
  const batchSize = 15; // Safe batch size for token limits
  const batches = Math.ceil(count / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const remainingCount = count - allQuestions.length;
    const currentBatchSize = Math.min(batchSize, remainingCount);
    
    // English prompt for AI
    const prompt = `
Generate ${currentBatchSize} ${level} level multiple-choice questions for the topic "${topic}" in the field "${field}".
Requirements:
- Each question must have 4 options (A, B, C, D).
- Each question can have one or more correct answers (single or multiple choice).
- For each question, specify the correct answer(s) as an array of indices (e.g., [1] or [0,2]).
- Each question MUST include a short explanation for the correct answer(s) in the field "explanation".
- Return the result as a valid JSON array, each item:
{
  "question": "...",
  "options": ["A...", "B...", "C...", "D..."],
  "correct": [0,2],
  "explanation": "..."
}
Return only valid JSON, nothing else.
  `;

    try {
      const aiResponse = await getAIResponse(prompt, [], { language });
      console.log(`AI raw response for batch ${batch + 1}:`, aiResponse);

      // Parse JSON result
      let questions: GeneratedQuizQuestion[] = [];
      try {
        questions = JSON.parse(aiResponse);
        // Validate format
        if (!Array.isArray(questions)) throw new Error('AI did not return an array');
        questions.forEach(q => {
          if (!q.question || !Array.isArray(q.options) || !Array.isArray(q.correct) || typeof q.explanation !== 'string') {
            throw new Error('Invalid question format');
          }
        });
        
        allQuestions.push(...questions);
        console.log(`Successfully generated ${questions.length} questions in batch ${batch + 1}`);
        
      } catch (parseError) {
        console.error(`Error parsing AI response for batch ${batch + 1}:`, aiResponse, parseError);
        
        // If JSON is truncated, try to extract partial questions
        const partialQuestions = extractPartialQuestions(aiResponse);
        if (partialQuestions.length > 0) {
          allQuestions.push(...partialQuestions);
          console.log(`Extracted ${partialQuestions.length} partial questions from truncated response`);
        }
        
        // If we still don't have enough questions, throw error
        if (allQuestions.length < count * 0.5) { // At least 50% of requested count
          throw new Error(`Failed to generate sufficient questions. Generated: ${allQuestions.length}/${count}`);
        }
      }
      
    } catch (error) {
      console.error(`Error in batch ${batch + 1}:`, error);
      if (batch === 0) {
        throw error; // If first batch fails, throw error
      }
      // For subsequent batches, continue with what we have
      break;
    }
  }
  
  return allQuestions.slice(0, count); // Return exactly the requested count
}

/**
 * Extract partial questions from truncated JSON response
 */
function extractPartialQuestions(truncatedResponse: string): GeneratedQuizQuestion[] {
  const questions: GeneratedQuizQuestion[] = [];
  
  try {
    // Try to find complete question objects in the truncated response
    const questionMatches = truncatedResponse.match(/\{[^}]*"question"[^}]*\}/g);
    
    if (questionMatches) {
      for (const match of questionMatches) {
        try {
          const question = JSON.parse(match);
          if (question.question && Array.isArray(question.options) && Array.isArray(question.correct)) {
            questions.push(question);
          }
        } catch {
          // Skip invalid partial questions
          continue;
        }
      }
    }
  } catch (e) {
    console.error('Error extracting partial questions:', e);
  }
  
  return questions;
} 