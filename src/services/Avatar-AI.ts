// src/services/azureAiService.ts
import { ChatMessage, callOpenAI } from './openaiService';

export interface InterviewConfig {
  field: string;
  level: string;
  language: 'vi-VN' | 'en-US';
}

const FIXED_QUESTIONS = 10;

const INTERVIEW_STRUCTURE = {
  junior: {
    requiredQuestions: FIXED_QUESTIONS,
    topics: [
      'technical_basics',
      'problem_solving',
      'learning_ability'
    ]
  },
  mid: {
    requiredQuestions: FIXED_QUESTIONS,
    topics: [
      'technical_depth',
      'problem_solving',
      'project_experience',
      'system_design'
    ]
  },
  senior: {
    requiredQuestions: FIXED_QUESTIONS,
    topics: [
      'system_design',
      'technical_leadership',
      'problem_solving',
      'architecture',
      'team_management'
    ]
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
}

export async function processInterviewResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  language: 'vi-VN' | 'en-US' = 'en-US'
): Promise<InterviewResponse> {
  try {
    
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
    
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are conducting a technical interview for a ${field} position at ${level} level.
IMPORTANT: ONLY respond in ${language === 'vi-VN' ? 'Vietnamese' : 'English'}.

INTERVIEW GUIDELINES:
1. This is a structured interview with EXACTLY ${FIXED_QUESTIONS} technical questions (excluding greeting and conclusion)
2. Focus on these key topics for ${level}:
${structure.topics.map(t => `   - ${t}`).join('\n')}

3. Interview Structure:
   - Start with a warm greeting and brief introduction
   - Ask ${FIXED_QUESTIONS} technical questions
   - End with a polite conclusion

4. Question Guidelines:
   - Ask only ONE question at a time
   - Ensure questions cover all required topics
   - Distribute questions evenly across topics
   - Keep questions focused and relevant to the level
   - Each question should have clear evaluation criteria

5. Evaluation:
   - Score each answer on a scale of 1-10
   - Track topic coverage
   - Assess both technical knowledge and communication
   - Consider problem-solving approach

CRITICAL: YOU MUST RESPOND WITH VALID JSON ONLY!
USE THIS EXACT FORMAT (do not include any text outside the JSON structure):
{
  "answer": "Your response or question in complete sentences",
  "currentTopic": "Current topic from required list",
  "nextTopic": "Next planned topic if needed",
  "shouldMoveToNewTopic": boolean,
  "followUpQuestion": "Optional follow-up for clarification",
  "interviewProgress": number (0-100),
  "isInterviewComplete": boolean,
  "currentScore": number (1-10),
  "completionDetails": {
    "coveredTopics": ["topics", "covered", "so far"],
    "skillAssessment": {
      "technical": number (1-10),
      "communication": number (1-10),
      "problemSolving": number (1-10)
    }
  }
}`
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
          isInterviewComplete: questionsAsked >= FIXED_QUESTIONS,
          currentScore: 5,
          completionDetails: {
            coveredTopics: [],
            skillAssessment: {
              technical: 5,
              communication: 5,
              problemSolving: 5
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
        isInterviewComplete: questionsAsked >= FIXED_QUESTIONS,
        currentScore: 5,
        completionDetails: {
          coveredTopics: [],
          skillAssessment: {
            technical: 5,
            communication: 5,
            problemSolving: 5
          }
        }
      };
    }

    const isComplete = questionsAsked >= FIXED_QUESTIONS || result.isInterviewComplete;

    return {
      answer: result.answer || '',
      currentTopic: result.currentTopic || "general",
      nextTopic: result.nextTopic,
      shouldMoveToNewTopic: Boolean(result.shouldMoveToNewTopic),
      followUpQuestion: result.followUpQuestion,
      interviewProgress: currentProgress,
      isInterviewComplete: isComplete,
      currentScore: result.currentScore || 5,
      completionDetails: result.completionDetails || {
        coveredTopics: result.coveredTopics || [],
        skillAssessment: result.skillAssessment || {
          technical: 0,
          communication: 0,
          problemSolving: 0
        }
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
      currentScore: 0,
      completionDetails: {
        coveredTopics: [],
        skillAssessment: {
          technical: 0,
          communication: 0,
          problemSolving: 0
        }
      }
    };
  }
}

const generateSystemPrompt = (field: string, level: string, language: string) => `
You are a senior technical interviewer with extensive experience in ${field}. Your goal is to conduct a professional technical interview that simulates a real-world interview experience.
IMPORTANT: You must ONLY respond in ${language === 'vi-VN' ? 'Vietnamese' : 'English'} language.

INTERVIEWER PERSONA:
- Be professional but friendly
- Ask questions that are relevant to real-world scenarios
- Probe deeper when answers are superficial
- Provide constructive feedback
- Adapt questions based on candidate's responses

INTERVIEW STRATEGY FOR ${level.toUpperCase()} ${field.toUpperCase()} POSITION:
${level === 'junior' ? `
- Start with fundamental concepts
- Focus on practical coding experience
- Ask about personal projects
- Verify basic problem-solving skills
- Assess willingness to learn` : level === 'mid-level' ? `
- Deep dive into technical implementations
- Focus on system design considerations
- Assess problem-solving methodology
- Evaluate architectural decisions
- Check team collaboration experience` : `
- Focus on architecture and system design
- Evaluate technical leadership
- Discuss complex project challenges
- Assess mentorship experience
- Technical decision making process`}

RESPONSE FORMAT (STRICT JSON):
{
  "answer": "Your question or response in ${language === 'vi-VN' ? 'Vietnamese' : 'English'}",
  "feedback": "Constructive feedback on their answer",
  "currentTopic": "Current technical topic being discussed",
  "shouldMoveToNewTopic": boolean,
  "followUpQuestion": "Follow-up question based on their response"
}

GUIDELINES:
1. Follow real interview patterns:
   - Start with background questions
   - Progress to technical questions
   - Include practical scenarios
   - End with candidate's questions

2. Question Types for ${field}:
   - Technical knowledge verification
   - Problem-solving scenarios
   - Past experience discussion
   - System design (for mid/senior)
   - Code review discussions

3. Response Evaluation:
   - Technical accuracy
   - Communication clarity
   - Problem-solving approach
   - Best practices awareness
   - Real-world application

4. Interview Flow:
   - One topic at a time
   - Progressive difficulty
   - Allow time for thinking
   - Natural conversation flow
   - Professional feedback

Always maintain professional demeanor and provide constructive feedback.`;

export async function startInterview(config: InterviewConfig): Promise<InterviewResponse> {
  try {
    const systemPrompt = generateSystemPrompt(config.field, config.level, config.language);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: config.language === 'vi-VN'
          ? 'Bắt đầu cuộc phỏng vấn.'
          : 'Start the interview.'
      }
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    const result = JSON.parse(response.choices[0].message.content);
    return {      answer: result.answer || (config.language === 'vi-VN' 
        ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng của bạn trong lĩnh vực này không?` 
        : `Hello! I am your AI interviewer for the ${config.level} ${config.field} position. Could you tell me about your experience and skills in this field?`),
      currentTopic: "introduction",
      shouldMoveToNewTopic: false,
      interviewProgress: 0,
      isInterviewComplete: false,
      currentScore: 5,
      completionDetails: {
        coveredTopics: [],
        skillAssessment: {
          technical: 0,
          communication: 0,
          problemSolving: 0
        }
      }
    };

  } catch (error) {
    console.error('Error starting interview:', error);
    return {      answer: config.language === 'vi-VN' 
        ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng của bạn trong lĩnh vực này không?` 
        : `Hello! I am your AI interviewer for the ${config.level} ${config.field} position. Could you tell me about your experience and skills in this field?`,
      currentTopic: "introduction",
      shouldMoveToNewTopic: false,
      interviewProgress: 0,
      isInterviewComplete: false,
      currentScore: 5,
      completionDetails: {
        coveredTopics: [],
        skillAssessment: {
          technical: 0,
          communication: 0,
          problemSolving: 0
        }
      }
    };
  }
}