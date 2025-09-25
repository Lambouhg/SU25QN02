import { callOpenAI, type ChatMessage } from '@/services/openaiService';
import prisma from '@/lib/prisma';

export interface QuestionSimilarity {
  questionId: string;
  similarity: number;
  reason: string;
  stem: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarQuestions: QuestionSimilarity[];
  confidence: number;
  recommendation: 'save' | 'review' | 'reject';
}

/**
 * Build comprehensive question content for comparison including stem, options, and explanation
 */
function buildQuestionContent(question: {
  stem: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
}): string {
  let content = `"${question.stem}"`;
  
  if (question.options && question.options.length > 0) {
    content += '\nOptions:';
    question.options.forEach((option, index) => {
      const marker = option.isCorrect ? '✓' : ' ';
      content += `\n  ${String.fromCharCode(65 + index)}. [${marker}] ${option.text}`;
    });
  }
  
  if (question.explanation && question.explanation.trim()) {
    content += `\nExplanation: "${question.explanation.trim()}"`;
  }
  
  return content;
}

/**
 * Check if a question is similar to existing questions using AI
 * @param newQuestionStem The new question to check
 * @param existingQuestions Array of existing questions to compare against
 * @param similarityThreshold Threshold for considering questions as similar (0-1)
 * @returns Promise<DuplicateCheckResult>
 */
export async function checkQuestionDuplicateWithAI(
  newQuestion: {
    stem: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  },
  existingQuestions: Array<{ 
    id: string; 
    stem: string; 
    category?: string; 
    fields?: string[];
    options?: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  }>,
  similarityThreshold: number = 0.8
): Promise<DuplicateCheckResult> {
  try {
    if (!newQuestion?.stem?.trim()) {
      throw new Error('Question stem is required');
    }

    // If no existing questions, it's definitely not a duplicate
    if (!existingQuestions || existingQuestions.length === 0) {
      return {
        isDuplicate: false,
        similarQuestions: [],
        confidence: 1.0,
        recommendation: 'save'
      };
    }

    // Limit the number of questions to compare for performance
    const questionsToCheck = existingQuestions.slice(0, 100);

    // Skip AI check if there are very few questions (less than 3)
    if (questionsToCheck.length < 3) {
      return await fallbackSimilarityCheck(newQuestion, questionsToCheck, similarityThreshold);
    }

    const systemPrompt = `You are an expert question similarity analyzer. Your task is to determine if a new question is similar or duplicate to existing questions.

SIMILARITY CRITERIA:
1. Semantic similarity - Do questions test the same knowledge/skill?
2. Content overlap - Are the core concepts identical?
3. Answer requirements - Would correct answers be the same?
4. Context similarity - Are they in the same domain/difficulty?

SIMILARITY LEVELS:
- 0.9-1.0: Nearly identical (definitely duplicate)
- 0.8-0.89: Very similar (likely duplicate, needs review)
- 0.6-0.79: Somewhat similar (different but related)
- 0.4-0.59: Different focus (same topic, different angle)
- 0.0-0.39: Not similar (different topics/skills)

RESPONSE FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "similarities": [
    {
      "questionId": "existing-question-id",
      "similarity": 0.85,
      "reason": "Both questions test knowledge of React hooks, specifically useState",
      "isDuplicate": true
    }
  ],
  "overallAssessment": {
    "maxSimilarity": 0.85,
    "isDuplicate": true,
    "confidence": 0.9,
    "recommendation": "review",
    "summary": "High similarity found with existing React hooks question"
  }
}

IMPORTANT: 
- Only include similarities >= 0.6 in the results
- Be conservative with duplicate detection
- Consider domain-specific terminology
- Focus on what knowledge/skill is being tested`;

    // Build comprehensive question content for comparison
    const newQuestionContent = buildQuestionContent(newQuestion);
    const existingQuestionsContent = questionsToCheck.map((q, index) => 
      `${index + 1}. [ID: ${q.id}] ${buildQuestionContent(q)}`
    ).join('\n');

    const userPrompt = `NEW QUESTION TO CHECK:
${newQuestionContent}

EXISTING QUESTIONS TO COMPARE AGAINST:
${existingQuestionsContent}

Analyze the new question against these existing questions. Consider:
1. Question content/stem similarity
2. Answer options similarity (if present)
3. Explanation similarity (if present)
4. Whether they test the same knowledge/skill even if worded differently

Determine overall similarities and provide detailed reasoning.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI service');
    }

    let aiContent = response.choices[0].message.content.trim();
    
    // Clean up the response
    aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiContent);
    } catch {
      console.error('Failed to parse AI similarity analysis:', aiContent);
      throw new Error('AI similarity analysis returned invalid format');
    }

    // Validate and process the results
    const similarities: QuestionSimilarity[] = [];
    const similaritiesArray = analysisResult.similarities || [];

    for (const sim of similaritiesArray) {
      if (sim.similarity >= 0.6 && sim.questionId) {
        const existingQuestion = existingQuestions.find(q => q.id === sim.questionId);
        if (existingQuestion) {
          similarities.push({
            questionId: sim.questionId,
            similarity: Math.min(Math.max(sim.similarity, 0), 1), // Clamp between 0-1
            reason: sim.reason || 'Similar content detected',
            stem: existingQuestion.stem
          });
        }
      }
    }

    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity);

    const maxSimilarity = similarities.length > 0 ? similarities[0].similarity : 0;
    const isDuplicate = maxSimilarity >= similarityThreshold;
    
    // Determine confidence based on AI assessment and similarity scores
    const aiConfidence = analysisResult.overallAssessment?.confidence || 0.5;
    const confidence = Math.min(Math.max(aiConfidence, 0), 1);

    // Determine recommendation based on similarityThreshold
    let recommendation: 'save' | 'review' | 'reject' = 'save';
    
    // Use dynamic thresholds based on similarityThreshold parameter
    const rejectThreshold = Math.max(similarityThreshold, 0.9); // At least 0.9 for reject
    const reviewThreshold = Math.max(similarityThreshold - 0.1, 0.7); // 0.1 below threshold for review
    
    if (maxSimilarity >= rejectThreshold) {
      recommendation = 'reject'; // Very high similarity
    } else if (maxSimilarity >= reviewThreshold) {
      recommendation = 'review'; // Moderate similarity, needs review
    }

    return {
      isDuplicate,
      similarQuestions: similarities,
      confidence,
      recommendation
    };

  } catch (error) {
    console.error('Error in AI duplicate check:', error);
    
    // Fallback to basic string similarity if AI fails
    return await fallbackSimilarityCheck(newQuestion, existingQuestions, similarityThreshold);
  }
}

/**
 * Fallback similarity check using basic string comparison
 */
async function fallbackSimilarityCheck(
  newQuestion: {
    stem: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  },
  existingQuestions: Array<{ 
    id: string; 
    stem: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  }>,
  similarityThreshold: number
): Promise<DuplicateCheckResult> {
  const similarities: QuestionSimilarity[] = [];
  
  const newQuestionNormalized = normalizeText(newQuestion.stem);
  
  for (const existing of existingQuestions) {
    const existingNormalized = normalizeText(existing.stem);
    
    // 1. Calculate stem similarity
    const stemSimilarity = calculateJaccardSimilarity(newQuestionNormalized, existingNormalized);
    
    // 2. Calculate options similarity (if both have options)
    let optionsSimilarity = 0;
    let optionsWeight = 0;
    if (newQuestion.options && existing.options && newQuestion.options.length > 0 && existing.options.length > 0) {
      const newOptionsText = newQuestion.options.map(o => normalizeText(o.text)).join(' ');
      const existingOptionsText = existing.options.map(o => normalizeText(o.text)).join(' ');
      optionsSimilarity = calculateJaccardSimilarity(newOptionsText, existingOptionsText);
      optionsWeight = 0.3; // Options contribute 30%
      
      // Check if correct answers are the same
      const newCorrectOptions = newQuestion.options.filter(o => o.isCorrect).map(o => normalizeText(o.text));
      const existingCorrectOptions = existing.options.filter(o => o.isCorrect).map(o => normalizeText(o.text));
      
      if (newCorrectOptions.length > 0 && existingCorrectOptions.length > 0) {
        const correctAnswerSimilarity = calculateJaccardSimilarity(
          newCorrectOptions.join(' '), 
          existingCorrectOptions.join(' ')
        );
        // If correct answers are very similar but question stems are different, it might still be a different question
        if (correctAnswerSimilarity > 0.8 && stemSimilarity < 0.7) {
          optionsSimilarity = optionsSimilarity * 0.5; // Reduce options weight if stems are different
        }
      }
    }
    
    // 3. Calculate explanation similarity (if both have explanations)
    let explanationSimilarity = 0;
    let explanationWeight = 0;
    if (newQuestion.explanation && existing.explanation && 
        newQuestion.explanation.trim() && existing.explanation.trim()) {
      const newExplNormalized = normalizeText(newQuestion.explanation);
      const existingExplNormalized = normalizeText(existing.explanation);
      explanationSimilarity = calculateJaccardSimilarity(newExplNormalized, existingExplNormalized);
      explanationWeight = 0.2; // Explanations contribute 20%
    }
    
    // 4. Calculate weighted total similarity
    const stemWeight = 0.5 + (optionsWeight + explanationWeight === 0 ? 0.5 : 0); // Stem is at least 50%, up to 100% if no options/explanation
    const totalSimilarity = (stemSimilarity * stemWeight) + 
                           (optionsSimilarity * optionsWeight) + 
                           (explanationSimilarity * explanationWeight);
    
    if (totalSimilarity >= 0.6) {
      let reason = `Stem similarity: ${Math.round(stemSimilarity * 100)}%`;
      if (optionsWeight > 0) {
        reason += `, Options similarity: ${Math.round(optionsSimilarity * 100)}%`;
      }
      if (explanationWeight > 0) {
        reason += `, Explanation similarity: ${Math.round(explanationSimilarity * 100)}%`;
      }
      reason += ` (Combined: ${Math.round(totalSimilarity * 100)}%)`;
      
      similarities.push({
        questionId: existing.id,
        similarity: totalSimilarity,
        reason,
        stem: existing.stem
      });
    }
  }
  
  similarities.sort((a, b) => b.similarity - a.similarity);
  const maxSimilarity = similarities.length > 0 ? similarities[0].similarity : 0;
  
  return {
    isDuplicate: maxSimilarity >= similarityThreshold,
    similarQuestions: similarities,
    confidence: 0.7, // Lower confidence for fallback method
    recommendation: maxSimilarity >= 0.8 ? 'review' : 'save'
  };
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate Jaccard similarity between two texts
 */
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(text2.split(' ').filter(w => w.length > 2));
  
  const words1Array = Array.from(words1);
  const words2Array = Array.from(words2);
  
  const intersection = new Set(words1Array.filter(w => words2.has(w)));
  const union = new Set([...words1Array, ...words2Array]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Get existing questions from database for similarity comparison
 */
export async function getExistingQuestionsForComparison(
  category?: string,
  fields?: string[],
  limit: number = 100
) {
  try {
    const whereClause: Record<string, unknown> = {
      isArchived: false
    };

    if (category) {
      whereClause.category = category;
    }

    if (fields && fields.length > 0) {
      whereClause.fields = {
        hasSome: fields
      };
    }

    const questions = await prisma.questionItem.findMany({
      where: whereClause,
      select: {
        id: true,
        stem: true,
        category: true,
        fields: true,
        topics: true,
        explanation: true,
        options: {
          select: {
            text: true,
            isCorrect: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return questions.map(q => ({
      id: q.id,
      stem: q.stem,
      category: q.category || undefined,
      fields: q.fields,
      topics: q.topics,
      explanation: q.explanation || undefined,
      options: q.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect
      }))
    }));
  } catch (error) {
    console.error('Error fetching existing questions:', error);
    return [];
  }
}

/**
 * Batch check multiple questions for duplicates
 */
export async function batchCheckQuestionDuplicates(
  newQuestions: Array<{ stem: string; category?: string; fields?: string[] }>,
  similarityThreshold: number = 0.8
): Promise<Array<DuplicateCheckResult & { questionIndex: number }>> {
  const results: Array<DuplicateCheckResult & { questionIndex: number }> = [];
  
  // Get existing questions for comparison
  const categoriesSet = new Set(newQuestions.map(q => q.category).filter(Boolean));
  const allCategories = Array.from(categoriesSet);
  const fieldsSet = new Set(newQuestions.flatMap(q => q.fields || []));
  const allFields = Array.from(fieldsSet);
  
  const existingQuestions = await getExistingQuestionsForComparison(
    allCategories[0], // Use first category for initial filter
    allFields,
    200 // Increased limit for batch processing
  );

  // If no existing questions in database, all questions are safe to save
  if (!existingQuestions || existingQuestions.length === 0) {
    return newQuestions.map((_, index) => ({
      isDuplicate: false,
      similarQuestions: [],
      confidence: 1.0,
      recommendation: 'save' as const,
      questionIndex: index
    }));
  }

  // Check each new question
  for (let i = 0; i < newQuestions.length; i++) {
    const newQuestion = newQuestions[i];
    
    try {
      const result = await checkQuestionDuplicateWithAI(
        newQuestion,
        existingQuestions,
        similarityThreshold
      );
      
      results.push({
        ...result,
        questionIndex: i
      });
      
      // Add small delay to avoid rate limiting (only if using AI)
      if (existingQuestions.length >= 3 && i < newQuestions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error checking question ${i}:`, error);
      results.push({
        isDuplicate: false,
        similarQuestions: [],
        confidence: 0,
        recommendation: 'save',
        questionIndex: i
      });
    }
  }
  
  return results;
}