// src/services/azureAiService.ts
import { ChatMessage, callOpenAI } from './openaiService';
import { createSystemMessageWithQuestionBank } from './questionBankIntegration';

export interface InterviewConfig {
  field: string;
  level: string;
  language: 'vi-VN' | 'en-US';
  specialization?: string;
  minExperience?: number;
  maxExperience?: number;
}

const FIXED_QUESTIONS = 4 ;

const INTERVIEW_STRUCTURE = {
  junior: {
    requiredQuestions: FIXED_QUESTIONS,
    focus: 'fundamentals and learning potential',
    guidance: 'Focus on basic concepts, practical knowledge, and willingness to learn'
  },
  mid: {
    requiredQuestions: FIXED_QUESTIONS,
    focus: 'technical depth and practical experience',
    guidance: 'Assess technical proficiency, project experience, and problem-solving skills'
  },
  senior: {
    requiredQuestions: FIXED_QUESTIONS,
    focus: 'architecture and leadership',
    guidance: 'Evaluate system design capabilities, technical leadership, and strategic thinking'
  }
};

export interface InterviewResponse {
  answer: string;
  currentTopic: string;
  nextTopic?: string;
  shouldMoveToNewTopic: boolean;
  followUpQuestion?: string;
  interviewProgress: number;
  isInterviewComplete: boolean;
  currentScore: number;
  questionCount: number; // Actual number of technical questions asked by AI
  completionDetails?: {
    coveredTopics: string[];
    skillAssessment: {
      technical: number;
      communication: number;
      problemSolving: number;
    };
  };
}

export interface InterviewEvaluation {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  overallRating: number;
  technicalStrengths: string[];
  technicalWeaknesses: string[];
  recommendations: string[];
  hiringRecommendation: 'strong_hire' | 'hire' | 'consider' | 'reject';
  detailedFeedback: {
    technical: string;
    softSkills: string;
    experience: string;
    potential: string;
  };
  salary_range: {
    min: number;
    max: number;
    currency: string;
  };
  levelAssessment?: {
    currentLevel: string;
    readinessForNextLevel: boolean;
    gapAnalysis: string[];
  };
}

export async function processInterviewResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  language: 'vi-VN' | 'en-US' = 'en-US'
): Promise<InterviewResponse> {
  try {
    
    // Check if this is an instruction message (auto-prompt or ending)
    const isInstruction = userMessage.startsWith('INSTRUCTION:');
    const isEndingInstruction = isInstruction && (
      userMessage.includes('kết thúc phỏng vấn') || 
      userMessage.includes('end the interview') ||
      userMessage.includes('conclude the interview')
    );
    
    // Extract field and level
    const systemMessage = conversationHistory.find(msg => msg.role === 'system');
    let field = 'software development';
    let level = 'mid-level';

    if (systemMessage?.content) {
      const content = systemMessage.content;
      const fieldMatch = content.match(/Position: (.*?) at/);
      const levelMatch = content.match(/at (.*?) level/);
      if (fieldMatch?.[1]) field = fieldMatch[1];
      if (levelMatch?.[1]) level = levelMatch[1];
    }

    const expLevel = level.toLowerCase().includes('senior') ? 'senior' 
                   : level.toLowerCase().includes('junior') ? 'junior' 
                   : 'mid';

    const structure = INTERVIEW_STRUCTURE[expLevel];
    // Calculate progress based on conversation history, excluding greeting
    const totalMessages = conversationHistory.filter(msg => msg.role === 'assistant');
    const questionsAsked = Math.max(0, totalMessages.length - 1); // Subtract 1 for greeting
    const currentProgress = Math.min(100, Math.round((questionsAsked / FIXED_QUESTIONS) * 100));
    
   
    
    
    // Check if user has responded to the final question
    const userResponses = conversationHistory.filter(msg => msg.role === 'user');
    const hasUserRespondedToFinalQuestion = userResponses.length >= FIXED_QUESTIONS;
    
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a senior technical interviewer conducting a professional interview for a ${field} position at ${level} level.
IMPORTANT: ONLY respond in ${language === 'vi-VN' ? 'Vietnamese' : 'English'}.

INTERVIEWER PERSONA:
- Be professional but friendly
- Ask questions that are relevant to real-world ${field} scenarios
- Probe deeper when answers are superficial
- Provide constructive feedback
- Adapt questions based on candidate's responses while staying within ${field} domain

INTERVIEW STRATEGY FOR ${level.toUpperCase()} ${field.toUpperCase()} POSITION:
${level === 'junior' ? `
- Start with fundamental concepts specific to ${field}
- Focus on practical coding experience in ${field}
- Ask about personal projects in ${field}
- Verify basic problem-solving skills using ${field} context
- Assess willingness to learn ${field} technologies` : level === 'mid-level' ? `
- Deep dive into technical implementations in ${field}
- Focus on system design considerations for ${field}
- Assess problem-solving methodology using ${field} examples
- Evaluate architectural decisions within ${field} scope
- Check team collaboration experience in ${field} projects` : `
- Focus on architecture and system design for ${field}
- Evaluate technical leadership in ${field} teams
- Discuss complex project challenges in ${field}
- Assess mentorship experience in ${field}
- Technical decision making process for ${field} systems`}

FIELD-SPECIFIC FOCUS FOR ${field.toUpperCase()}:
You must intelligently determine and ask questions about the most relevant topics for a ${level} ${field} position. 

CRITICAL REQUIREMENTS FOR QUESTION SELECTION:
1. **Position Alignment**: Every question MUST be directly relevant to ${field} work
2. **Level Appropriateness**: Questions MUST match ${level} expectations
3. **Industry Relevance**: Focus on current market demands and real-world applications
4. **Progressive Difficulty**: Start easier and increase complexity appropriately

LEVEL-SPECIFIC QUESTION GUIDELINES:
${level === 'junior' ? `
JUNIOR LEVEL (${field}) - Focus on:
- Fundamental concepts and basic syntax
- Simple problem-solving scenarios
- Basic tools and frameworks knowledge
- Learning approach and potential
- Simple coding challenges or explanations
- Entry-level best practices
AVOID: Complex system design, advanced architecture, team leadership` : level === 'mid-level' ? `
MID-LEVEL (${field}) - Focus on:
- In-depth technical implementation
- Real project experience and challenges
- Intermediate to advanced concepts
- Code optimization and best practices
- Problem-solving methodology
- Some system design considerations
- Team collaboration experience
AVOID: Very basic concepts, extremely complex architecture` : `
SENIOR LEVEL (${field}) - Focus on:
- System architecture and design patterns
- Technical leadership and mentorship
- Complex problem-solving strategies
- Performance optimization at scale
- Technology decision-making process
- Team and project management
- Industry trends and future planning
AVOID: Basic syntax questions, simple coding problems`}


Your topics should naturally emerge from the conversation and be:
- Appropriate for the candidate's stated level (${level})
- Relevant to modern ${field} development practices
- Progressive in difficulty throughout the interview
- Focused on practical, applicable knowledge
- Covering both technical skills and soft skills as appropriate for the level

INTERVIEW GUIDELINES:
1. This is a structured interview with EXACTLY ${FIXED_QUESTIONS} technical questions (excluding greeting and conclusion)
2. Position: ${field} - Level: ${level}
   - Focus Area: ${structure.focus}
   - Assessment Guidance: ${structure.guidance}
   - Dynamically select relevant topics based on position requirements and candidate level

3. Interview Structure:
   - Start with a warm greeting and brief introduction
   - Ask ${FIXED_QUESTIONS} technical questions relevant to ${field}
   - End with a polite conclusion

4. Interview Completion Rules:
   - After asking exactly ${FIXED_QUESTIONS} questions, provide a professional conclusion
   - In your conclusion, thank the candidate and mention that the interview is complete
   - Set "isInterviewComplete": true when providing the conclusion
   - Do NOT ask any more questions after the conclusion
   - The conclusion should be warm and professional, acknowledging their participation
   - IMPORTANT: Only conclude after the candidate has responded to your ${FIXED_QUESTIONS}th question
   - If you just asked the ${FIXED_QUESTIONS}th question, wait for the candidate's response before concluding

5. Question Guidelines:
   - Ask ONLY ONE question per response (CRITICAL)
   - Keep questions CONCISE but NATURAL (2 sentences for context + question)
   - Ensure questions cover all required topics within ${field} scope
   - Distribute questions evenly across topics
   - Keep questions focused and relevant to the level
   - Each question should have clear evaluation criteria
   - Make questions practical and scenario-based when possible
   - Use natural conversation flow like a real interviewer
   - NEVER include multiple questions in a single response
   - Show genuine interest and provide context before asking

   **MANDATORY QUESTION VALIDATION - Before asking any question:**
   a) Field Check: "Is this question 100% relevant to ${field} work?"
   b) Level Check: "Is this question appropriate for ${level} level?"
   c) Practical Check: "Does this reflect real-world ${field} scenarios?"
   d) Progressive Check: "Does this build appropriately on previous questions?"
   
 
6. Auto-Prompt Handling:
   - If the user message starts with "INSTRUCTION:", treat it as a special system instruction
   - For auto-prompt instructions: Generate ONE brief, contextual reminder (not a new question)
   - For ending instructions: Provide a professional conclusion and mark interview as complete
   - Adjust tone based on the prompt number (gentle → encouraging → final warning)
   - Keep prompts short and focused on encouraging response to the current question

7. Evaluation & Scoring Guidelines:
   **Level-Calibrated Scoring (1-10 scale):**
   ${level === 'junior' ? `
   JUNIOR LEVEL EXPECTATIONS:
   - 8-10: Shows strong fundamentals, good learning attitude, can explain concepts clearly
   - 6-7: Understands basic concepts, some gaps acceptable, shows potential
   - 4-5: Limited knowledge but willing to learn, needs significant development
   - 1-3: Lacks basic understanding, not ready for junior role` : level === 'mid-level' ? `
   MID-LEVEL EXPECTATIONS:
   - 8-10: Strong technical depth, good practical experience, can solve complex problems
   - 6-7: Solid technical skills, some experience, can handle most tasks independently
   - 4-5: Basic technical skills but lacks depth or experience
   - 1-3: Does not meet mid-level expectations, better suited for junior role` : `
   SENIOR LEVEL EXPECTATIONS:
   - 8-10: Exceptional technical leadership, architectural thinking, mentorship qualities
   - 6-7: Strong technical skills, some leadership experience, can guide teams
   - 4-5: Good technical skills but lacks senior-level strategic thinking
   - 1-3: Does not demonstrate senior-level capabilities`}

   **Assessment Focus Areas:**
   - Technical Knowledge: Rate against ${level} level expectations for ${field}
   - Communication: Clarity of explanation appropriate for ${level} role
   - Problem-Solving: Methodology and approach expected at ${level} level
   - Experience: Real-world application relevant to ${level} ${field} work

   **Scoring Consistency:**
   - Compare answers against realistic ${level} ${field} developer standards
   - Consider market expectations for this role level
   - Account for nervousness while maintaining standards
   - Be fair but accurate in assessment

RESPONSE GUIDELINES:
- Ask ONLY ONE question per response
- Keep questions CONCISE but NATURAL (2 sentences for context + question)
- Be encouraging but maintain professional standards
- Acknowledge candidate's responses before asking next question
- Ask follow-up questions when answers need clarification
- Use natural conversation flow like a real interviewer
- NEVER ask multiple questions in one response
- Show genuine interest in candidate's background and experience

RESPONSE STRUCTURE FORMAT:
Return responses in this exact structure:
{
  "answer": "Your response or question in NATURAL, PROFESSIONAL tone (2 sentences for context + question, ONLY ONE question). If this is the conclusion after the candidate has responded to your ${FIXED_QUESTIONS}th question, provide a warm thank you and conclusion message.",
  "currentTopic": "Current topic from required list",
  "nextTopic": "Next planned topic if needed",
  "shouldMoveToNewTopic": boolean,
  "followUpQuestion": "Optional follow-up for clarification",
  "interviewProgress": number (0-100),
  "isInterviewComplete": boolean (set to true when providing conclusion after candidate responds to ${FIXED_QUESTIONS}th question),
  "currentScore": number (1-10),
  "questionCount": number (exact count of technical questions you have asked so far, excluding greeting),
  "completionDetails": {
    "coveredTopics": ["topics", "covered", "so far"],
    "skillAssessment": {
      "technical": number (1-10, based on technical knowledge and depth demonstrated),
      "communication": number (1-10, based on clarity and articulation of responses),
      "problemSolving": number (1-10, based on logical thinking and approach to problems)
    }
  }
}
- If candidate mentions experience outside ${field}, politely redirect: "That's interesting! For this ${field} position, I'd like to focus on..."

CRITICAL: YOU MUST RESPOND WITH VALID JSON ONLY!
USE THIS EXACT FORMAT (do not include any text outside the JSON structure):
{
  "answer": "Your response or question in NATURAL, PROFESSIONAL tone (2 sentences for context + question, ONLY ONE question). If this is the conclusion after the candidate has responded to your ${FIXED_QUESTIONS}th question, provide a warm thank you and conclusion message.",
  "currentTopic": "Current topic from required list",
  "nextTopic": "Next planned topic if needed",
  "shouldMoveToNewTopic": boolean,
  "followUpQuestion": "Optional follow-up for clarification",
  "interviewProgress": number (0-100),
  "isInterviewComplete": boolean (set to true when providing conclusion after candidate responds to ${FIXED_QUESTIONS}th question),
  "currentScore": number (1-10),
  "questionCount": number (exact count of technical questions you have asked so far, excluding greeting),
  "completionDetails": {
    "coveredTopics": ["topics", "covered", "so far"],
    "skillAssessment": {
      "technical": number (1-10, based on technical knowledge and depth demonstrated),
      "communication": number (1-10, based on clarity and articulation of responses),
      "problemSolving": number (1-10, based on logical thinking and approach to problems)
    }
  }
}

IMPORTANT: You MUST provide realistic skillAssessment scores based on the candidate's responses:
- technical: Evaluate based on technical knowledge, depth, and accuracy
- communication: Evaluate based on clarity, articulation, and explanation quality  
- problemSolving: Evaluate based on logical thinking, approach, and methodology

SCORING GUIDELINES:
- Start from 0 and build up based on demonstrated capabilities
- 0: No demonstration of skill yet
- 1-3: Basic understanding or attempt
- 4-6: Moderate proficiency shown
- 7-8: Good proficiency demonstrated
- 9-10: Excellent proficiency shown

Score realistically based on what the candidate has actually demonstrated in their responses.

QUESTION STYLE: Keep all questions NATURAL and PROFESSIONAL. Ask ONLY ONE question per response. Use natural conversation flow like a real interviewer. Show genuine interest in candidate's responses.`
      },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];
    
    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    let result;
    const content = response.choices[0].message.content;
    
    try {
      // Try to parse the content as JSON
      if (content.includes('{') && content.includes('}')) {
        const jsonStr = content.substring(
          content.indexOf('{'),
          content.lastIndexOf('}') + 1
        );
        result = JSON.parse(jsonStr);
      } else {
        // If no JSON found, create a formatted response
        result = {
          answer: content,
          currentTopic: "general",
          shouldMoveToNewTopic: false,
          interviewProgress: currentProgress,
          isInterviewComplete: questionsAsked >= FIXED_QUESTIONS && hasUserRespondedToFinalQuestion,
          currentScore: 0, // Start from 0
          questionCount: questionsAsked, // Use calculated question count
          completionDetails: {
            coveredTopics: [],
            skillAssessment: {
              technical: 0, // Start from 0
              communication: 0, // Start from 0
              problemSolving: 0 // Start from 0
            }
          }
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // If JSON parsing fails, create a formatted response
      result = {
        answer: content,
        currentTopic: "general",
        shouldMoveToNewTopic: false,
        interviewProgress: currentProgress,
        isInterviewComplete: questionsAsked >= FIXED_QUESTIONS && hasUserRespondedToFinalQuestion,
        currentScore: 0, // Start from 0
        questionCount: questionsAsked, // Use calculated question count
        completionDetails: {
          coveredTopics: [],
          skillAssessment: {
            technical: 0, // Start from 0
            communication: 0, // Start from 0
            problemSolving: 0 // Start from 0
          }
        }
      };
    }

    const isComplete = (questionsAsked >= FIXED_QUESTIONS && hasUserRespondedToFinalQuestion) || result.isInterviewComplete || isEndingInstruction;

    // Log completion status for debugging
    if (isComplete) {
      console.log('🎯 Interview completion triggered:', {
        questionsAsked,
        FIXED_QUESTIONS,
        hasUserRespondedToFinalQuestion,
        resultIsComplete: result.isInterviewComplete,
        isEndingInstruction,
        finalIsComplete: isComplete
      });
    } else if (questionsAsked >= FIXED_QUESTIONS && !hasUserRespondedToFinalQuestion) {
      console.log('🎯 AI has asked the final question, waiting for user response:', {
        questionsAsked,
        FIXED_QUESTIONS,
        hasUserRespondedToFinalQuestion
      });
    }

    // Calculate skill assessment from AI response or use defaults
    const skillAssessment = result.completionDetails?.skillAssessment || result.skillAssessment || {
      technical: Math.max(0, Math.min(10, result.currentScore || 0)), // Use currentScore as base for technical, start from 0
      communication: 0, // Start from 0
      problemSolving: 0 // Start from 0
    };

    // For now, use the current skill assessment directly
    // In a real implementation, you would need to track skill assessment history separately
    const cumulativeSkillAssessment = skillAssessment;

    // Ensure all skill scores are within valid range (0-10)
    const validatedSkillAssessment = {
      technical: Math.max(0, Math.min(10, cumulativeSkillAssessment.technical || 0)),
      communication: Math.max(0, Math.min(10, cumulativeSkillAssessment.communication || 0)),
      problemSolving: Math.max(0, Math.min(10, cumulativeSkillAssessment.problemSolving || 0))
    };

    return {
      answer: result.answer || '',
      currentTopic: result.currentTopic || "general",
      nextTopic: result.nextTopic,
      shouldMoveToNewTopic: Boolean(result.shouldMoveToNewTopic),
      followUpQuestion: result.followUpQuestion,
      interviewProgress: isEndingInstruction ? 100 : currentProgress,
      isInterviewComplete: isComplete,
      currentScore: result.currentScore || 0,
      questionCount: result.questionCount || questionsAsked, // Use AI response or fallback to calculated
      completionDetails: {
        coveredTopics: result.completionDetails?.coveredTopics || result.coveredTopics || [],
        skillAssessment: validatedSkillAssessment
      }
    };

  } catch (error) {
    console.error('Error processing interview response:', error);
    return {
      answer: language === 'vi-VN' 
        ? 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.'
        : 'Sorry, an error occurred. Please try again.',
      currentTopic: "error",
      shouldMoveToNewTopic: false,
      interviewProgress: 0,
      isInterviewComplete: false,
      currentScore: 0, // Start from 0
      questionCount: 0,
      completionDetails: {
        coveredTopics: [],
        skillAssessment: {
          technical: 0, // Start from 0
          communication: 0, // Start from 0
          problemSolving: 0 // Start from 0
        }
      }
    };
  }
}

export async function startInterview(config: InterviewConfig): Promise<InterviewResponse> {
  try {
    // Tạo system message với question bank integration
    const systemMessage = await createSystemMessageWithQuestionBank(
      config.field,
      config.level,
      config.specialization,
      config.language,
      FIXED_QUESTIONS
    );

    const messages: ChatMessage[] = [
      systemMessage,
      { 
        role: 'user', 
        content: config.language === 'vi-VN'
          ? `Bắt đầu cuộc phỏng vấn cho vị trí ${config.field}${config.specialization ? ` - ${config.specialization}` : ''}.`
          : `Start the interview for ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} position.`
      }
    ];

    console.log('🎯 Starting interview with config:', {
      field: config.field,
      level: config.level,
      language: config.language,
      specialization: config.specialization
    });

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    try {
      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        answer: result.answer || (config.language === 'vi-VN' 
          ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field}${config.specialization ? ` và ${config.specialization}` : ''} của bạn không?` 
          : `Hello! I am your AI interviewer for the ${config.level} ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} position. Could you tell me about your ${config.field}${config.specialization ? ` and ${config.specialization}` : ''} experience and skills?`),
        currentTopic: "introduction",
        shouldMoveToNewTopic: false,
        interviewProgress: 0,
        isInterviewComplete: false,
        currentScore: 0, // Start from 0
        questionCount: 0, // Starting interview, no questions asked yet
        completionDetails: {
          coveredTopics: [],
          skillAssessment: {
            technical: 0, // Start from 0
            communication: 0, // Start from 0
            problemSolving: 0 // Start from 0
          }
        }
      };
    } catch {
      // Fallback if JSON parsing fails
      const fallbackGreeting = config.language === 'vi-VN' 
        ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field}${config.specialization ? ` và ${config.specialization}` : ''} của bạn không?` 
        : `Hello! I am your AI interviewer for the ${config.level} ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} position. Could you tell me about your ${config.field}${config.specialization ? ` and ${config.specialization}` : ''} experience and skills?`;
        
      return {
        answer: fallbackGreeting,
        currentTopic: "introduction",
        shouldMoveToNewTopic: false,
        interviewProgress: 0,
        isInterviewComplete: false,
        currentScore: 0,
        questionCount: 0, // Starting interview, no questions asked yet
        completionDetails: {
          coveredTopics: [],
          skillAssessment: {
            technical: 0, // Start from 0
            communication: 0, // Start from 0
            problemSolving: 0 // Start from 0
          }
        }
      };
    }

  } catch (error) {
    console.error('Error starting interview:', error);
    const fallbackGreeting = config.language === 'vi-VN' 
      ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field}${config.specialization ? ` và ${config.specialization}` : ''} của bạn không?` 
      : `Hello! I am your AI interviewer for the ${config.level} ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} position. Could you tell me about your ${config.field}${config.specialization ? ` and ${config.specialization}` : ''} experience and skills?`;
      
    return {
      answer: fallbackGreeting,
      currentTopic: "introduction",
      shouldMoveToNewTopic: false,
      interviewProgress: 0,
      isInterviewComplete: false,
      currentScore: 0,
      questionCount: 0, // Starting interview, no questions asked yet
      completionDetails: {
        coveredTopics: [],
        skillAssessment: {
          technical: 0, // Start from 0
          communication: 0, // Start from 0
          problemSolving: 0 // Start from 0
        }
      }
    };
  }
}
