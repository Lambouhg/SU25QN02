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

FIELD-SPECIFIC TECHNICAL AREAS for ${field}:
${field === 'Frontend' ? `
- HTML/CSS/JavaScript fundamentals and advanced concepts
- Modern frameworks (React, Vue, Angular) and their ecosystems
- State management and component architecture
- Browser APIs, performance optimization, and debugging
- Responsive design, accessibility, and cross-browser compatibility
- Build tools, bundlers, and development workflow
- Testing strategies for frontend applications
- UI/UX principles and user-centered design` : field === 'Backend' ? `
- Server-side programming languages and frameworks
- Database design, optimization, and management
- API development (REST, GraphQL) and microservices
- System architecture, scalability, and distributed systems
- Security best practices and authentication/authorization
- Performance optimization, caching, and monitoring
- DevOps practices, CI/CD, and deployment strategies
- Data structures, algorithms, and system design` : `
- Full-stack architecture and technology integration
- Frontend and backend communication patterns
- Database to UI data flow and state management
- API design and consumption best practices
- Technology stack selection and justification
- End-to-end development lifecycle
- Performance optimization across the entire stack
- Deployment and DevOps for full-stack applications`}

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

4. Question Guidelines:
   - Ask only ONE question at a time
   - Ensure questions cover all required topics within ${field} scope
   - Distribute questions evenly across topics
   - Keep questions focused and relevant to the level
   - Each question should have clear evaluation criteria
   - Make questions practical and scenario-based when possible

   **MANDATORY QUESTION VALIDATION - Before asking any question:**
   a) Field Check: "Is this question 100% relevant to ${field} work?"
   b) Level Check: "Is this question appropriate for ${level} level?"
   c) Practical Check: "Does this reflect real-world ${field} scenarios?"
   d) Progressive Check: "Does this build appropriately on previous questions?"
   
   **QUESTION EXAMPLES BY LEVEL:**
   ${level === 'junior' ? `
   ✅ GOOD for Junior ${field}: "Explain how you would [basic task relevant to ${field}]"
   ✅ GOOD: "What is [fundamental concept] and when would you use it?"
   ❌ AVOID: Complex system design, advanced architecture questions` : level === 'mid-level' ? `
   ✅ GOOD for Mid-level ${field}: "How would you optimize [specific ${field} scenario]?"
   ✅ GOOD: "Describe a challenging project where you [relevant experience]"
   ❌ AVOID: Too basic syntax questions, overly complex enterprise architecture` : `
   ✅ GOOD for Senior ${field}: "How would you architect a system to [complex requirement]?"
   ✅ GOOD: "What technical decisions would you make when [strategic scenario]?"
   ❌ AVOID: Basic syntax, simple coding problems`}

5. Auto-Prompt Handling:
   - If the user message starts with "INSTRUCTION:", treat it as a special system instruction
   - For auto-prompt instructions: Generate ONE brief, contextual reminder (not a new question)
   - For ending instructions: Provide a professional conclusion and mark interview as complete
   - Adjust tone based on the prompt number (gentle → encouraging → final warning)
   - Keep prompts short and focused on encouraging response to the current question

6. Evaluation & Scoring Guidelines:
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
- Follow natural interview conversation patterns
- Be encouraging but maintain professional standards
- Ask follow-up questions when answers need clarification
- Acknowledge good answers before moving to next question

RESPONSE STRUCTURE FORMAT:
Return responses in this exact structure:
{
  "currentQuestion": "${questionsAsked + 1}",
  "interviewerMessage": "Professional response with follow-up question",
  "questionCount": ${questionsAsked + 1},
  "evaluation": {
    "technicalScore": <1-10 rating based on ${level} level expectations>,
    "communicationScore": <1-10 rating for clarity and explanation>,
    "problemSolvingScore": <1-10 rating for logical thinking>,
    "overallRating": <calculated average>,
    "levelAppropriate": <true/false - does answer meet ${level} level standards>,
    "feedback": "Specific ${level}-level feedback on the response",
    "areasForImprovement": ["specific areas to develop for ${level} ${field} role"],
    "strengths": ["demonstrated strengths at ${level} level"]
  },
  "isComplete": <true if interview should end (usually after 8-12 questions)>,
  "topics": ["list of ${field} topics covered"],
  "nextTopicHint": "What area to explore next for ${level} ${field} interview"
}
- If candidate mentions experience outside ${field}, politely redirect: "That's interesting! For this ${field} position, I'd like to focus on..."

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
  "questionCount": number (exact count of technical questions you have asked so far, excluding greeting),
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
          currentScore: 0,
          questionCount: questionsAsked, // Use calculated question count
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
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // If JSON parsing fails, create a formatted response
      result = {
        answer: content,
        currentTopic: "general",
        shouldMoveToNewTopic: false,
        interviewProgress: currentProgress,
        isInterviewComplete: questionsAsked >= FIXED_QUESTIONS,
        currentScore: 0,
        questionCount: questionsAsked, // Use calculated question count
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

    const isComplete = questionsAsked >= FIXED_QUESTIONS || result.isInterviewComplete || isEndingInstruction;

    return {
      answer: result.answer || '',
      currentTopic: result.currentTopic || "general",
      nextTopic: result.nextTopic,
      shouldMoveToNewTopic: Boolean(result.shouldMoveToNewTopic),
      followUpQuestion: result.followUpQuestion,
      interviewProgress: isEndingInstruction ? 100 : currentProgress,
      isInterviewComplete: isComplete,
      currentScore: result.currentScore || 5,
      questionCount: result.questionCount || questionsAsked, // Use AI response or fallback to calculated
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
      questionCount: 0,
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

export async function startInterview(config: InterviewConfig): Promise<InterviewResponse> {
  try {
    const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: `You are a senior technical interviewer with extensive experience in ${config.field}. Your goal is to conduct a professional technical interview that simulates a real-world interview experience.
IMPORTANT: You must ONLY respond in ${config.language === 'vi-VN' ? 'Vietnamese' : 'English'} language.

INTERVIEWER PERSONA:
- Be professional but friendly
- Ask questions that are relevant to real-world scenarios
- Probe deeper when answers are superficial
- Provide constructive feedback
- Adapt questions based on candidate's responses

INTERVIEW STRATEGY FOR ${config.level.toUpperCase()} ${config.field.toUpperCase()} POSITION:
${config.level === 'junior' ? `
- Start with fundamental concepts
- Focus on practical coding experience
- Ask about personal projects
- Verify basic problem-solving skills
- Assess willingness to learn` : config.level === 'mid-level' ? `
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
  "answer": "Your question or response in ${config.language === 'vi-VN' ? 'Vietnamese' : 'English'}",
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

2. Question Types for ${config.field}:
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

Always maintain professional demeanor and provide constructive feedback.` 
      },
      { 
        role: 'user', 
        content: config.language === 'vi-VN'
          ? `Bắt đầu cuộc phỏng vấn cho vị trí ${config.field}.`
          : `Start the interview for ${config.field} position.`
      }
    ];

    console.log('🎯 Starting interview with config:', {
      field: config.field,
      level: config.level,
      language: config.language
    });

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    try {
      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        answer: result.answer || (config.language === 'vi-VN' 
          ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field} của bạn không?` 
          : `Hello! I am your AI interviewer for the ${config.level} ${config.field} position. Could you tell me about your ${config.field} experience and skills?`),
        currentTopic: "introduction",
        shouldMoveToNewTopic: false,
        interviewProgress: 0,
        isInterviewComplete: false,
        currentScore: 0,
        questionCount: 0, // Starting interview, no questions asked yet
        completionDetails: {
          coveredTopics: [],
          skillAssessment: {
            technical: 0,
            communication: 0,
            problemSolving: 0
          }
        }
      };
    } catch {
      // Fallback if JSON parsing fails
      const fallbackGreeting = config.language === 'vi-VN' 
        ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field} của bạn không?` 
        : `Hello! I am your AI interviewer for the ${config.level} ${config.field} position. Could you tell me about your ${config.field} experience and skills?`;
        
      return {
        answer: fallbackGreeting,
        currentTopic: "introduction",
        shouldMoveToNewTopic: false,
        interviewProgress: 0,
        isInterviewComplete: false,
        currentScore: 5,
        questionCount: 0, // Starting interview, no questions asked yet
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

  } catch (error) {
    console.error('Error starting interview:', error);
    const fallbackGreeting = config.language === 'vi-VN' 
      ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field} của bạn không?` 
      : `Hello! I am your AI interviewer for the ${config.level} ${config.field} position. Could you tell me about your ${config.field} experience and skills?`;
      
    return {
      answer: fallbackGreeting,
      currentTopic: "introduction",
      shouldMoveToNewTopic: false,
      interviewProgress: 0,
      isInterviewComplete: false,
      currentScore: 5,
      questionCount: 0, // Starting interview, no questions asked yet
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
