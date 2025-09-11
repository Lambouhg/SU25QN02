import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from '@/services/openaiService';

interface GenerationConfig {
  field: string;
  level: string;
  difficulty: string;
  questionCount: number;
  questionType: string;
  topics: string;
  customPrompt?: string;
}

interface GeneratedQuestion {
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

export async function POST(req: NextRequest) {
  try {
    const config: GenerationConfig = await req.json();

    const { field, level, difficulty, questionCount, questionType, topics, customPrompt } = config;

    // Validate inputs
    if (!field || !level || !difficulty || !questionType || questionCount < 1 || questionCount > 20) {
      return NextResponse.json(
        { error: "Invalid configuration parameters" },
        { status: 400 }
      );
    }

    // Build AI prompt
    const systemPrompt = `You are an expert technical interviewer and question designer. Generate high-quality interview questions for software engineering roles.

REQUIREMENTS:
- Field: ${field}
- Level: ${level}
- Difficulty: ${difficulty}
- Question Type: ${questionType}
- Number of Questions: ${questionCount}
${topics ? `- Focus Topics: ${topics}` : ''}
${customPrompt ? `- Additional Requirements: ${customPrompt}` : ''}

QUALITY STANDARDS:
1. Questions must be practical and relevant to real-world scenarios
2. Difficulty must match the specified level (${level})
3. Questions should test both theoretical knowledge and practical application
4. For choice questions, provide 4 options with clear correct answers
5. Include detailed explanations for learning value

RESPONSE FORMAT:
Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "questions": [
    {
      "stem": "Question text here",
      "type": "${questionType}",
      "level": "${level}",
      "difficulty": "${difficulty}",
      "category": "${field}",
      "fields": ["${field}"],
      "topics": ["topic1", "topic2"],
      "skills": ["skill1", "skill2"],
      "explanation": "Detailed explanation",
      ${questionType === 'single_choice' || questionType === 'multiple_choice' ? `"options": [
        { "text": "Option 1", "isCorrect": true },
        { "text": "Option 2", "isCorrect": false },
        { "text": "Option 3", "isCorrect": false },
        { "text": "Option 4", "isCorrect": false }
      ]` : '"options": null'}
    }
  ]
}

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON - no markdown code blocks
2. Ensure all strings are properly quoted
3. No trailing commas
4. Ensure proper nesting and closing brackets
5. Each question must be a complete object

LEVEL-SPECIFIC GUIDELINES:
- Junior: Focus on fundamentals, basic concepts, and syntax
- Middle: Emphasize practical experience, problem-solving, and best practices  
- Senior: Cover architecture, leadership, complex scenarios, and strategic thinking

Generate ${questionCount} unique, high-quality questions now.`;

    // Call OpenAI
    const response = await callOpenAI([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate ${questionCount} ${difficulty} level ${questionType} questions for ${field} at ${level} level.${topics ? ` Focus on: ${topics}` : ''}`
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
    
    // Try to fix incomplete JSON by finding the last complete object
    if (!aiContent.endsWith('}') && !aiContent.endsWith(']')) {
      // Find the last complete question object
      const lastCompleteObjectIndex = aiContent.lastIndexOf('},');
      if (lastCompleteObjectIndex !== -1) {
        // Truncate to the last complete object and close the array and main object
        aiContent = aiContent.substring(0, lastCompleteObjectIndex + 1) + '\n  ]\n}';
      } else {
        // If no complete objects found, try to find at least one complete object
        const firstObjectStart = aiContent.indexOf('{');
        const firstObjectEnd = aiContent.indexOf('}\n');
        if (firstObjectStart !== -1 && firstObjectEnd !== -1) {
          const firstObject = aiContent.substring(firstObjectStart, firstObjectEnd + 1);
          aiContent = `{\n  "questions": [\n    ${firstObject}\n  ]\n}`;
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
        const questionMatches = aiContent.match(/\{[^}]*"stem"[^}]*\}/g);
        if (questionMatches && questionMatches.length > 0) {
          console.log('Attempting to parse individual questions...');
          const extractedQuestions = [];
          
          for (const match of questionMatches) {
            try {
              // Clean up the individual question object
              const cleanMatch = match
                .replace(/,(\s*\})/g, '$1') // Remove trailing commas
                .replace(/[\r\n]+/g, ' ') // Remove line breaks
                .replace(/\s+/g, ' '); // Normalize spaces
                
              const questionObj = JSON.parse(cleanMatch);
              extractedQuestions.push(questionObj);
            } catch {
              console.error('Failed to parse individual question:', match.substring(0, 100));
            }
          }
          
          if (extractedQuestions.length > 0) {
            parsedResponse = { questions: extractedQuestions };
            console.log(`Successfully extracted ${extractedQuestions.length} questions from malformed JSON`);
          } else {
            throw new Error('AI returned invalid JSON format and could not extract questions');
          }
        } else {
          throw new Error('AI returned invalid JSON format');
        }
      } catch {
        throw new Error('AI returned invalid JSON format and extraction failed');
      }
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('AI response missing questions array');
    }

    // Validate and clean generated questions
    const validatedQuestions: GeneratedQuestion[] = parsedResponse.questions
      .filter((q: unknown) => {
        const question = q as Record<string, unknown>;
        return question.stem && question.type;
      })
      .map((q: unknown) => {
        const question = q as Record<string, unknown>;
        return {
          stem: String(question.stem),
          type: questionType,
          level: level,
          difficulty: difficulty,
          category: field,
          fields: Array.isArray(question.fields) ? question.fields : [field],
          topics: Array.isArray(question.topics) ? question.topics : (topics ? topics.split(',').map(t => t.trim()) : []),
          skills: Array.isArray(question.skills) ? question.skills : [],
          explanation: String(question.explanation || ''),
          ...((['single_choice', 'multiple_choice'].includes(questionType) && question.options) ? {
            options: Array.isArray(question.options) ? 
              question.options.filter((opt: unknown) => {
                const option = opt as Record<string, unknown>;
                return option.text;
              }) : []
          } : {})
        };
      });

    if (validatedQuestions.length === 0) {
      // Fallback: Try generating questions one by one
      console.log('Attempting fallback: generating questions individually...');
      
      const fallbackQuestions: GeneratedQuestion[] = [];
      const simplePrompt = `Generate 1 high-quality ${questionType} question for ${level} level ${field} developer.

Question requirements:
- Field: ${field}
- Level: ${level}
- Difficulty: ${difficulty}
${topics ? `- Topics: ${topics}` : ''}

Return only a JSON object with this structure:
{
  "stem": "Your question here",
  "explanation": "Brief explanation",
  "topics": ["topic1", "topic2"],
  "skills": ["skill1", "skill2"]${questionType === 'single_choice' || questionType === 'multiple_choice' ? ',\n  "options": [\n    { "text": "Option 1", "isCorrect": true },\n    { "text": "Option 2", "isCorrect": false },\n    { "text": "Option 3", "isCorrect": false },\n    { "text": "Option 4", "isCorrect": false }\n  ]' : ''}
}`;

      for (let i = 0; i < Math.min(questionCount, 3); i++) {
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
              fallbackQuestions.push({
                stem: singleQuestion.stem,
                type: questionType,
                level: level,
                difficulty: difficulty,
                category: field,
                fields: [field],
                topics: Array.isArray(singleQuestion.topics) ? singleQuestion.topics : (topics ? topics.split(',').map(t => t.trim()) : []),
                skills: Array.isArray(singleQuestion.skills) ? singleQuestion.skills : [],
                explanation: singleQuestion.explanation || '',
                ...((['single_choice', 'multiple_choice'].includes(questionType) && singleQuestion.options) ? {
                  options: Array.isArray(singleQuestion.options) ? singleQuestion.options : []
                } : {})
              });
            }
          }
        } catch (fallbackError) {
          console.error(`Fallback question ${i + 1} failed:`, fallbackError);
        }
      }
      
      if (fallbackQuestions.length > 0) {
        return NextResponse.json({
          questions: fallbackQuestions,
          generated: fallbackQuestions.length,
          requested: questionCount,
          note: 'Used fallback generation due to parsing issues'
        });
      }
      
      throw new Error('No valid questions were generated');
    }

    return NextResponse.json({
      questions: validatedQuestions,
      generated: validatedQuestions.length,
      requested: questionCount
    });

  } catch (error) {
    console.error('AI question generation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate questions',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
