import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from '@/services/openaiService';
import { prisma } from '@/lib/prisma';
import { createAntiDuplicationPrompt, DEFAULT_ANTI_DUPLICATION_CONFIG } from '@/utils/question-generation-config';

interface GenerationConfig {
  // Job Role Context (master data only - not stored in QuestionItem)
  jobRoleTitle?: string;
  jobRoleLevel?: string;
  jobRoleDescription?: string;
  categoryName?: string;
  specializationName?: string;
  experienceRange?: {
    min: number;
    max?: number;
  };
  
  // QuestionItem Properties (main data to be stored)
  fields: string[];        // stored in QuestionItem.fields
  topics: string[];        // stored in QuestionItem.topics
  skills: string[];        // stored in QuestionItem.skills
  questionType: string;    // stored in QuestionItem.type
  difficulty: string;      // stored in QuestionItem.difficulty
  level?: string;          // stored in QuestionItem.level
  category?: string;       // stored in QuestionItem.category
  questionCount: number;
  
  // AI Generation Context
  customPrompt?: string;
  
  // Legacy fields for backward compatibility
  field?: string;
}

interface GeneratedQuestion {
  // Core QuestionItem fields
  stem: string;            // QuestionItem.stem
  type: string;            // QuestionItem.type
  level?: string;          // QuestionItem.level
  difficulty?: string;     // QuestionItem.difficulty
  category?: string;       // QuestionItem.category
  fields: string[];        // QuestionItem.fields
  topics: string[];        // QuestionItem.topics
  skills: string[];        // QuestionItem.skills
  explanation?: string;    // QuestionItem.explanation
  options?: Array<{ text: string; isCorrect: boolean }>; // QuestionOption[]
  
  // Optional metadata (not stored directly in QuestionItem)
  estimatedTime?: number;  // QuestionItem.estimatedTime
  tags?: string[];         // QuestionItem.tags
}

export async function POST(req: NextRequest) {
  try {
    const config: GenerationConfig = await req.json();

    // Extract config properties
    const {
      // JobRole Context (master data for AI generation)
      jobRoleTitle,
      jobRoleLevel,
      jobRoleDescription,
      categoryName,
      specializationName,
      experienceRange,
      
      // QuestionItem Properties (data to be stored)
      fields,
      topics,
      skills,
      questionType,
      difficulty,
      level,
      category,
      questionCount,
      customPrompt,
      
      // Legacy properties for backward compatibility
      field
    } = config;

    // Determine effective values for QuestionItem
    const effectiveFields = fields && fields.length > 0 ? fields : (field ? [field] : []);
    const effectiveTopics = topics && topics.length > 0 ? topics : [];
    const effectiveSkills = skills && skills.length > 0 ? skills : [];
    
    // Map level from Frontend (Junior/Middle/Senior) to QuestionItem.level (junior/middle/senior)
    const levelMapping: Record<string, string> = {
      'Junior': 'junior',
      'Middle': 'middle', 
      'Senior': 'senior'
    };
    const effectiveLevel = levelMapping[level || ''] || levelMapping[jobRoleLevel || ''] || 'junior';
    
    const effectiveCategory = category || categoryName || field || 'General';
    const effectiveDifficulty = difficulty || 'easy'; // Default difficulty for QuestionItem

    // Validate inputs for QuestionItem creation
    // Validate question type
    const validQuestionTypes = ['single_choice', 'multiple_choice', 'mixed'];
    if (effectiveFields.length === 0 || !effectiveDifficulty || !questionType || !validQuestionTypes.includes(questionType) || questionCount < 1 || questionCount > 20) {
      return NextResponse.json(
        { error: "Invalid configuration parameters. Please ensure fields, difficulty, questionType (single_choice, multiple_choice, or mixed), and questionCount are provided for QuestionItem creation. Maximum 20 questions per request." },
        { status: 400 }
      );
    }

    // Handle mixed question type  
    const actualQuestionType = questionType === 'mixed' ? 'mixed (generate both single_choice and multiple_choice)' : questionType;
    
    // Get existing questions to avoid duplicates using enhanced config
    let existingQuestionPrompt = '';
    try {
      const existingQuestions = await prisma.questionItem.findMany({
        where: {
          fields: {
            hasSome: effectiveFields
          }
        },
        select: {
          stem: true
        },
        take: DEFAULT_ANTI_DUPLICATION_CONFIG.maxExistingQuestions,
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (existingQuestions.length > 0) {
        const existingStems = existingQuestions.map((q: { stem: string }) => q.stem);
        existingQuestionPrompt = createAntiDuplicationPrompt(existingStems, DEFAULT_ANTI_DUPLICATION_CONFIG);
      }
    } catch (error) {
      console.log('Could not fetch existing questions for duplicate prevention:', error);
    }
    
    // Build enhanced AI prompt with JobRole context for QuestionItem generation
    const systemPrompt = `You are an expert technical interviewer and question designer. Generate high-quality questions that will be stored in QuestionItem database records.

JOB ROLE CONTEXT (Master Data Reference):
${jobRoleTitle ? `- Job Role: ${jobRoleTitle} (${jobRoleLevel || effectiveLevel})` : ''}
${jobRoleDescription ? `- Role Description: ${jobRoleDescription}` : ''}
${categoryName ? `- Category: ${categoryName}` : ''}
${specializationName ? `- Specialization: ${specializationName}` : ''}
${experienceRange ? `- Experience Range: ${experienceRange.min}-${experienceRange.max || '∞'} years` : ''}

QUESTIONITEM REQUIREMENTS (Data to be stored):
- Fields: ${effectiveFields.join(', ')} (QuestionItem.fields)
- Topics: ${effectiveTopics.length > 0 ? effectiveTopics.join(', ') : 'Auto-generate based on job role'} (QuestionItem.topics)
- Skills: ${effectiveSkills.length > 0 ? effectiveSkills.slice(0, 10).join(', ') : 'Auto-generate based on job role'} (QuestionItem.skills)
- Level: ${effectiveLevel} (QuestionItem.level)
- Difficulty: ${effectiveDifficulty} (QuestionItem.difficulty)
- Category: ${effectiveCategory} (QuestionItem.category)
- Question Type: ${actualQuestionType} (QuestionItem.type)
- Number of Questions: ${questionCount}
${customPrompt ? `- Additional Requirements: ${customPrompt}` : ''}

CONTEXT-SPECIFIC GUIDELINES FOR QUESTIONITEM:
${jobRoleTitle ? `
- Design questions specifically for ${jobRoleTitle} role (context only - not stored)
- Focus on skills needed for ${effectiveLevel} level positions (stored in QuestionItem.level)
- Include scenarios relevant to ${effectiveCategory} domain (stored in QuestionItem.category)
${specializationName ? `- Emphasize ${specializationName} specific knowledge in question content` : ''}
` : ''}

QUESTIONITEM QUALITY STANDARDS:
1. Questions must be practical and relevant (QuestionItem.stem)
2. Difficulty must match ${effectiveDifficulty} level (QuestionItem.difficulty)
3. Level must be appropriate for ${effectiveLevel} (QuestionItem.level)
4. Fields must align with ${effectiveFields.join(', ')} (QuestionItem.fields)
5. Generate relevant topics for each question (QuestionItem.topics)
6. Generate relevant skills for each question (QuestionItem.skills)
7. For choice questions, provide 4 options with correct answers following these rules:
   - single_choice: EXACTLY ONE option must have isCorrect: true, others must be isCorrect: false
   - multiple_choice: TWO OR MORE options must have isCorrect: true
8. Include detailed explanations for learning value (QuestionItem.explanation)

RESPONSE FORMAT - Return ONLY valid JSON (no comments, no markdown):
{
  "questions": [
    {
      "stem": "Question text here",
      "type": "${questionType === 'mixed' ? 'single_choice_or_multiple_choice' : questionType}",
      "level": "${effectiveLevel}",
      "difficulty": "${effectiveDifficulty}",
      "category": "${effectiveCategory}",
      "fields": ${JSON.stringify(effectiveFields)},
      "topics": ["topic1", "topic2"],
      "skills": ["skill1", "skill2"],
      "explanation": "Brief explanation",
      "estimatedTime": 300,
      "tags": ["tag1", "tag2"]${questionType !== 'essay' ? `,
      "options": [
        ${questionType === 'single_choice' ? '{ "text": "Option 1", "isCorrect": true },\n        { "text": "Option 2", "isCorrect": false },\n        { "text": "Option 3", "isCorrect": false },\n        { "text": "Option 4", "isCorrect": false }' : questionType === 'multiple_choice' ? '{ "text": "Option 1", "isCorrect": true },\n        { "text": "Option 2", "isCorrect": true },\n        { "text": "Option 3", "isCorrect": false },\n        { "text": "Option 4", "isCorrect": false }' : '{ "text": "Option 1", "isCorrect": true },\n        { "text": "Option 2", "isCorrect": false },\n        { "text": "Option 3", "isCorrect": false },\n        { "text": "Option 4", "isCorrect": false }'}
      ]` : ''}
    }
  ]
}

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON - no markdown code blocks
2. Ensure all strings are properly quoted
3. No trailing commas
4. Ensure proper nesting and closing brackets
5. Each question must be a complete object

IMPORTANT CHOICE QUESTION RULES:
- single_choice: Questions must have EXACTLY ONE correct answer (one option with isCorrect: true)
- multiple_choice: Questions must have TWO OR MORE correct answers (multiple options with isCorrect: true)
- mixed: Generate both types, ensuring each follows the appropriate rule

LEVEL-SPECIFIC GUIDELINES FOR QUESTIONITEM:
- junior: Focus on learning fundamentals and basic concepts (QuestionItem.level = "junior")
- middle: Emphasize practical experience, problem-solving, and best practices (QuestionItem.level = "middle")
- senior: Cover architecture, leadership, complex scenarios, and strategic thinking (QuestionItem.level = "senior")

VARIATION TECHNIQUES TO AVOID DUPLICATION:
1. Use different question formats: "What would you do if...", "How would you implement...", "What is the best approach for...", "Why would you choose..."
2. Vary the context: different company sizes, project types, team structures, technologies
3. Focus on different aspects of the same topic: implementation vs troubleshooting vs optimization vs security
4. Use varied scenarios: startup environment, enterprise settings, legacy systems, greenfield projects
5. Different complexity levels within the same difficulty: edge cases, common situations, best practices

IMPORTANT REMINDERS:
1. Generate questions that will be stored as QuestionItem records
2. Use JobRole data only as context for question generation
3. Ensure all required QuestionItem fields are populated
4. Topics and skills should be relevant to the generated question content
5. EstimatedTime should be realistic for the question difficulty

MANDATORY: Generate EXACTLY ${questionCount} questions. Count them carefully before sending your response. Do not generate more or less than ${questionCount} questions.

${existingQuestionPrompt}

Generate ${questionCount} unique, high-quality QuestionItem records tailored to the ${jobRoleTitle || effectiveCategory} context now.`;

    // Call OpenAI for QuestionItem generation
    const mixedPromptSuffix = questionType === 'mixed' ? ` Generate a mix of single_choice and multiple_choice questions (approximately ${Math.floor(questionCount/2)} single choice and ${questionCount - Math.floor(questionCount/2)} multiple choice).` : '';
    
    const userPrompt = jobRoleTitle 
      ? `IMPORTANT: Generate exactly ${questionCount} QuestionItem records (not more, not less). 

Generate ${questionCount} DIVERSE QuestionItem records with ${effectiveDifficulty} difficulty${questionType === 'mixed' ? '' : ` and ${questionType} type`}. Use ${jobRoleTitle} (${effectiveLevel} level) role in ${categoryName}${specializationName ? ` - ${specializationName}` : ''} as context.${effectiveTopics.length > 0 ? ` Focus topics on: ${effectiveTopics.join(', ')}` : ' Auto-generate relevant topics.'} Fields: ${effectiveFields.join(', ')}.${mixedPromptSuffix}

CRITICAL: The JSON response must contain exactly ${questionCount} questions in the "questions" array.`
      : `IMPORTANT: Generate exactly ${questionCount} QuestionItem records (not more, not less).

Generate ${questionCount} DIVERSE QuestionItem records with ${effectiveDifficulty} difficulty${questionType === 'mixed' ? '' : ` and ${questionType} type`} for ${effectiveFields.join(', ')} at ${effectiveLevel} level.${effectiveTopics.length > 0 ? ` Focus topics on: ${effectiveTopics.join(', ')}` : ' Auto-generate relevant topics.'}.${mixedPromptSuffix}

CRITICAL: The JSON response must contain exactly ${questionCount} questions in the "questions" array.`;

    const response = await callOpenAI([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ]);

    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    let aiContent = response.choices[0].message.content;
    
    // Clean up the response if it's wrapped in markdown code blocks
    if (aiContent.includes('```json')) {
      aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Clean up common JSON formatting issues
    aiContent = aiContent.trim();
    
    // Try to fix incomplete JSON by finding complete question objects
    if (!aiContent.endsWith('}') && !aiContent.endsWith(']')) {
      console.log('Attempting to fix incomplete JSON...');
      
      // Strategy 1: Find complete question objects with closing braces
      const questionStartRegex = /\{\s*"stem":/g;
      const questionStarts = [];
      let match;
      
      while ((match = questionStartRegex.exec(aiContent)) !== null) {
        questionStarts.push(match.index);
      }
      
      if (questionStarts.length > 0) {
        // Find the last complete question by looking for closing braces
        let validQuestionsContent = '';
        let validCount = 0;
        
        for (let i = 0; i < questionStarts.length; i++) {
          const start = questionStarts[i];
          const nextStart = questionStarts[i + 1];
          const end = nextStart || aiContent.length;
          
          const questionContent = aiContent.substring(start, end);
          
          // Count braces to see if this question is complete
          const openBraces = (questionContent.match(/\{/g) || []).length;
          const closeBraces = (questionContent.match(/\}/g) || []).length;
          
          if (openBraces === closeBraces) {
            // This question is complete
            if (validCount > 0) validQuestionsContent += ',\n    ';
            validQuestionsContent += questionContent.trim().replace(/,$/, '');
            validCount++;
          } else {
            // This question is incomplete, stop here
            break;
          }
        }
        
        if (validCount > 0) {
          aiContent = `{\n  "questions": [\n    ${validQuestionsContent}\n  ]\n}`;
          console.log(`Fixed JSON with ${validCount} complete questions`);
        }
      }
    }

    // Additional cleanup for malformed JSON
    aiContent = aiContent
      .replace(/,(\s*[\]}])/g, '$1') // Remove trailing commas
      .replace(/[\r\n]+/g, '\n') // Normalize line endings
      .replace(/\n\s*\n/g, '\n'); // Remove empty lines

    console.log('Cleaned AI content:', aiContent.substring(0, 500) + '...');

    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      console.error('Parse error:', parseError);
      
      // Try to extract individual question objects if the main JSON is malformed
      try {
        console.log('Attempting to extract question objects from malformed JSON...');
        
        // More aggressive regex to find question objects
        const questionPattern = /\{\s*"stem"\s*:\s*"[^"]*"[\s\S]*?\}/g;
        const matches = aiContent.match(questionPattern);
        
        if (matches && matches.length > 0) {
          console.log(`Found ${matches.length} potential question objects`);
          const extractedQuestions = [];
          
          for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            try {
              // Try to complete the question object if it's incomplete
              let questionText = match.trim();
              
              // Ensure it has proper structure
              if (!questionText.includes('"type"')) {
                questionText = questionText.replace('"stem":', `"type": "${questionType}", "stem":`);
              }
              if (!questionText.includes('"level"')) {
                questionText = questionText.replace('"stem":', `"level": "${effectiveLevel}", "stem":`);
              }
              if (!questionText.includes('"difficulty"')) {
                questionText = questionText.replace('"stem":', `"difficulty": "${effectiveDifficulty}", "stem":`);
              }
              if (!questionText.includes('"category"')) {
                questionText = questionText.replace('"stem":', `"category": "${effectiveCategory}", "stem":`);
              }
              if (!questionText.includes('"fields"')) {
                questionText = questionText.replace('"stem":', `"fields": ${JSON.stringify(effectiveFields)}, "stem":`);
              }
              if (!questionText.includes('"topics"')) {
                questionText = questionText.replace('"stem":', `"topics": ${JSON.stringify(effectiveTopics.length > 0 ? effectiveTopics : ['General'])}, "stem":`);
              }
              if (!questionText.includes('"skills"')) {
                questionText = questionText.replace('"stem":', `"skills": ${JSON.stringify(effectiveSkills.length > 0 ? effectiveSkills : ['Problem Solving'])}, "stem":`);
              }
              
              // Clean up common issues
              questionText = questionText
                .replace(/,(\s*\})/g, '$1') // Remove trailing commas
                .replace(/[\r\n]+/g, ' ') // Remove line breaks
                .replace(/\s+/g, ' ') // Normalize spaces
                .replace(/"\s*\}/g, '"}'); // Fix quote issues
              
              const questionObj = JSON.parse(`{${questionText.substring(1)}`);
              extractedQuestions.push(questionObj);
              console.log(`Successfully parsed question ${i + 1}`);
            } catch (error) {
              console.error(`Failed to parse question ${i + 1}:`, error);
              console.error('Question text:', match.substring(0, 200) + '...');
            }
          }
          
          if (extractedQuestions.length > 0) {
            parsedResponse = { questions: extractedQuestions };
            console.log(`Successfully extracted ${extractedQuestions.length} questions from malformed JSON`);
          } else {
            throw new Error('Could not extract any valid questions from response');
          }
        } else {
          throw new Error('No question objects found in AI response');
        }
      } catch (extractError) {
        console.error('Extraction failed:', extractError);
        throw new Error('AI returned invalid JSON format and extraction failed');
      }
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('AI response missing questions array');
    }

    // Validate and clean generated questions for QuestionItem creation
    const validatedQuestions: GeneratedQuestion[] = parsedResponse.questions
      .filter((q: unknown) => {
        const question = q as Record<string, unknown>;
        return question.stem && question.type;
      })
      .map((q: unknown) => {
        const question = q as Record<string, unknown>;
        return {
          // Core QuestionItem fields
          stem: String(question.stem),
          type: questionType === 'mixed' ? String(question.type || 'single_choice') : questionType, // For mixed, use AI response type
          level: effectiveLevel, // Use consistent level format
          difficulty: effectiveDifficulty, // Use consistent difficulty
          category: effectiveCategory, // Use consistent category
          fields: Array.isArray(question.fields) ? question.fields : effectiveFields,
          topics: Array.isArray(question.topics) ? question.topics : (effectiveTopics.length > 0 ? effectiveTopics : ['General']),
          skills: Array.isArray(question.skills) ? question.skills : (effectiveSkills.length > 0 ? effectiveSkills : ['Problem Solving']),
          explanation: String(question.explanation || ''),
          
          // Optional QuestionItem fields
          estimatedTime: typeof question.estimatedTime === 'number' ? question.estimatedTime : 300, // Default 5 minutes
          tags: Array.isArray(question.tags) ? question.tags : [effectiveCategory, effectiveLevel],
          
          // QuestionOption data (if applicable)
          ...((questionType === 'mixed' || ['single_choice', 'multiple_choice'].includes(questionType)) && question.options ? {
            options: Array.isArray(question.options) ? 
              question.options.filter((opt: unknown) => {
                const option = opt as Record<string, unknown>;
                return option.text;
              }) : []
          } : {})
        };
      });

    // Check if we got the exact number of questions requested
    if (validatedQuestions.length !== questionCount) {
      console.log(`AI generated ${validatedQuestions.length} questions, but ${questionCount} were requested. Attempting fallback generation.`);
    }

    if (validatedQuestions.length === 0 || validatedQuestions.length < questionCount) {
      // Fallback: Try generating questions one by one to reach the exact count
      console.log('Attempting fallback: generating questions individually...');
      
      // Start with any valid questions we already have
      const fallbackQuestions: GeneratedQuestion[] = [...validatedQuestions];
      
      // Generate remaining questions needed to reach questionCount
      const questionsNeeded = questionCount - validatedQuestions.length;
      console.log(`Need to generate ${questionsNeeded} more questions to reach target of ${questionCount}`);
      
      for (let i = 0; i < questionsNeeded; i++) {
        // For mixed type in fallback, alternate between single_choice and multiple_choice
        const currentType = questionType === 'mixed' ? (i % 2 === 0 ? 'single_choice' : 'multiple_choice') : questionType;
        
        const simplePrompt = `Generate 1 high-quality ${currentType} question for ${effectiveLevel} level ${effectiveCategory} developer.

Question requirements:
- Fields: ${effectiveFields.join(', ')}
- Level: ${effectiveLevel}
- Difficulty: ${effectiveDifficulty}
${effectiveTopics.length > 0 ? `- Topics: ${effectiveTopics.join(', ')}` : ''}
${effectiveSkills.length > 0 ? `- Skills: ${effectiveSkills.slice(0, 5).join(', ')}` : ''}

Return only a JSON object with this structure:
{
  "stem": "Your question here",
  "explanation": "Brief explanation",
  "topics": ["topic1", "topic2"],
  "skills": ["skill1", "skill2"]${currentType === 'single_choice' || currentType === 'multiple_choice' ? `,\n  "options": [\n    ${currentType === 'single_choice' ? '{ "text": "Option 1", "isCorrect": true },\n    { "text": "Option 2", "isCorrect": false },\n    { "text": "Option 3", "isCorrect": false },\n    { "text": "Option 4", "isCorrect": false }' : '{ "text": "Option 1", "isCorrect": true },\n    { "text": "Option 2", "isCorrect": true },\n    { "text": "Option 3", "isCorrect": false },\n    { "text": "Option 4", "isCorrect": false }'}\n  ]` : ''}
}`;
        try {
          const singleResponse = await callOpenAI([
            {
              role: 'system',
              content: 'You are an expert question generator. Return only valid JSON, no extra text.'
            },
            {
              role: 'user',
              content: simplePrompt
            }
          ]);

          if (singleResponse.choices && singleResponse.choices[0]?.message?.content) {
            let content = singleResponse.choices[0].message.content.trim();
            
            // Clean up markdown if present
            if (content.includes('```json')) {
              content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            
            const singleQuestion = JSON.parse(content);
            
            if (singleQuestion.stem) {
              const currentType = questionType === 'mixed' ? (i % 2 === 0 ? 'single_choice' : 'multiple_choice') : questionType;
              
              fallbackQuestions.push({
                stem: singleQuestion.stem,
                type: currentType,
                level: effectiveLevel,
                difficulty: effectiveDifficulty,
                category: effectiveCategory,
                fields: effectiveFields,
                topics: Array.isArray(singleQuestion.topics) ? singleQuestion.topics : effectiveTopics,
                skills: Array.isArray(singleQuestion.skills) ? singleQuestion.skills : effectiveSkills,
                explanation: singleQuestion.explanation || '',
                ...((['single_choice', 'multiple_choice'].includes(currentType) && singleQuestion.options) ? {
                  options: Array.isArray(singleQuestion.options) ? singleQuestion.options : []
                } : {})
              });
            }
          }
        } catch (fallbackError) {
          console.error(`Fallback question ${i + 1} failed:`, fallbackError);
        }
      }
      
      // Limit to requested count if we have more than needed
      const finalQuestions = fallbackQuestions.slice(0, questionCount);
      
      if (finalQuestions.length > 0) {
        return NextResponse.json({
          questions: finalQuestions,
          generated: finalQuestions.length,
          requested: questionCount,
          note: finalQuestions.length < questionCount ? 'Some questions could not be generated due to errors' : 'Generated successfully',
          context: {
            jobRole: jobRoleTitle,
            category: effectiveCategory,
            level: effectiveLevel,
            difficulty: effectiveDifficulty
          }
        });
      }
      
      throw new Error('No valid QuestionItem records were generated');
    }

    // Limit to requested count if AI generated more
    const finalValidatedQuestions = validatedQuestions.slice(0, questionCount);
    
    return NextResponse.json({
      questions: finalValidatedQuestions,
      generated: finalValidatedQuestions.length,
      requested: questionCount,
      context: {
        jobRole: jobRoleTitle,
        category: effectiveCategory,
        level: effectiveLevel,
        difficulty: effectiveDifficulty,
        fields: effectiveFields,
        topics: effectiveTopics,
        skills: effectiveSkills
      },
      note: 'Questions generated successfully for QuestionItem creation'
    });

  } catch (error) {
    console.error('AI QuestionItem generation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate QuestionItem records',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
