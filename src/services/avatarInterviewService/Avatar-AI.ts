// src/services/azureAiService.ts
import { ChatMessage, callOpenAI } from '../openaiService';

export interface InterviewConfig {
  field: string;
  level: string;
  language: 'vi-VN' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR';
  specialization?: string;
  minExperience?: number;
  maxExperience?: number;
  jobRoleTitle?: string; // Thêm jobRoleTitle để mapping với question bank
  selectedSkills?: string[]; // User selected skills từ preferences
  jobRoleLevel?: string; // Thêm jobRoleLevel để mapping với question bank
  customSkills?: string[]; // User custom skills từ preferences
}

// Enhanced Question interface with difficulty and skill mapping
interface QuestionWithDifficulty {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  skills?: string[];
}

const FIXED_QUESTIONS = 10 ;

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

// Enhanced Question Bank Context with difficulty levels
async function getQuestionBankContext(config: InterviewConfig): Promise<{
  questions: QuestionWithDifficulty[]
} | null> {
  try {
    console.log('🔗 Fetching question bank context for:', {
      field: config.field,
      level: config.level,
      jobRoleTitle: config.jobRoleTitle,
      jobRoleLevel: config.jobRoleLevel,
      selectedSkills: config.selectedSkills,
      questionCount: FIXED_QUESTIONS
    });

    const response = await fetch('/api/questions/interview-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: config.field,
        level: config.level,
        selectedSkills: config.selectedSkills, // Include selected skills for filtering
        questionCount: FIXED_QUESTIONS,
        includeDifficulty: true // Request difficulty levels
      })
    });

    console.log('🔗 Question bank API response status:', response.status);

    if (!response.ok) {
      console.warn('Failed to fetch question bank context:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('🔗 Question bank API response data:', {
      questionsCount: data.questions?.length || 0,
      difficultyBreakdown: data.questions?.reduce((acc: Record<string, number>, q: QuestionWithDifficulty) => {
        acc[q.difficulty || 'unknown'] = (acc[q.difficulty || 'unknown'] || 0) + 1;
        return acc;
      }, {}) || {}
    });

    return {
      questions: data.questions || []
    };
  } catch (error) {
    console.error('Error fetching question bank context:', error);
    return null;
  }
}

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
  // Enhanced difficulty tracking
  currentDifficulty?: 'easy' | 'medium' | 'hard';
  difficultyProgression?: string[];
  performanceTrend?: 'improving' | 'stable' | 'declining';
  completionDetails?: {
    coveredTopics: string[];
    evaluation?: {
      technicalScore: number;
      communicationScore: number;
      problemSolvingScore: number;
      deliveryScore?: number;
      overallRating?: number;
      recommendations?: string[];
    };
  };
}

export interface QuestionAnalysis {
  question: string;
  userAnswer: string;
  score: number;
  technicalAccuracy: number;
  completeness: number;
  clarity: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywords: string[];
  skillTags: string[];
  category: string;
  feedback: string;
}

export interface InterviewEvaluation {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  deliveryScore: number; // Delivery/Presentation in practice context (replaces culture fit)
  // overallRating được tính toán ở backend dựa trên 4 tiêu chí
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
  questionAnalysis?: QuestionAnalysis[];
}

export async function processInterviewResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  language: 'vi-VN' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR' = 'en-US',
  config?: InterviewConfig // Thêm config parameter để có thể truy cập jobRoleTitle và jobRoleLevel
): Promise<InterviewResponse> {
  try {
    
    // Check if this is an instruction message (auto-prompt or ending)
    const isInstruction = userMessage.startsWith('INSTRUCTION:');
    const isEndingInstruction = isInstruction && (
      userMessage.includes('kết thúc phỏng vấn') || 
      userMessage.includes('end the interview') ||
      userMessage.includes('conclude the interview') ||
      userMessage.includes('结束面试') ||
      userMessage.includes('面接を終了') ||
      userMessage.includes('면접 종료')
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

    // Lấy question list nếu có config
    let questionBankContext: { questions: QuestionWithDifficulty[] } | null = null;
    if (config) {
      console.log('🔗 Getting question bank context for config:', config);
      questionBankContext = await getQuestionBankContext(config);
      console.log('🔗 Question bank context result:', questionBankContext ? 'Success' : 'Failed/No data');
    } else {
      console.log('⚠️ No config provided for question bank integration');
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
    
    
    // Tạo system message và ép dùng danh sách câu hỏi nếu có
    let systemContent = `You are a senior technical interviewer conducting a professional interview for a ${field} position at ${level} level.
IMPORTANT: ONLY respond in ${language === 'vi-VN' ? 'Vietnamese' : language === 'zh-CN' ? 'Chinese' : language === 'ja-JP' ? 'Japanese' : language === 'ko-KR' ? 'Korean' : 'English'}.

INTERVIEWER PERSONA:
- Be professional but friendly
- Ask questions that are relevant to real-world ${field} scenarios
- Probe deeper when answers are superficial
- Provide constructive feedback
- Adapt questions based on candidate's responses while staying within ${field} domain

🎯 SMART FOLLOW-UP QUESTION SYSTEM:
You have TWO modes of questioning:
1. **PRIMARY QUESTIONS**: From the question bank or planned topics
2. **FOLLOW-UP QUESTIONS**: Contextual questions based on user's previous answer

🎚️ DIFFICULTY PROGRESSION SYSTEM:
Use the question bank's built-in difficulty levels (easy/medium/hard) intelligently:
- **Questions 1-2**: Start with EASY questions to build confidence
- **Performance-based progression**:
  * High performance (8-10/10) → Move to HARD questions
  * Good performance (6-7/10) → Use MEDIUM questions  
  * Average performance (4-5/10) → Stay with EASY questions
  * Low performance (0-3/10) → Recovery mode with EASY questions

**SKILL-FOCUSED SELECTION**:
- Prioritize questions related to user's selectedSkills: ${config?.selectedSkills?.join(', ') || 'general skills'}
- Match question topics with their expertise areas
- Balance between comfort zone and challenge zone

**PROGRESSION EXAMPLES**:
- User answers React question well (8/10) → Next: Hard React architecture question
- User struggles with database (3/10) → Next: Easy SQL basics question
- User shows mixed performance (6/10) → Next: Medium difficulty in their strong area

FOLLOW-UP QUESTION LOGIC (IF/ELSE CONDITIONS):
After each user response, analyze their answer and decide:

**IF user mentions specific technologies/frameworks:**
- Ask deeper questions about those technologies
- Example: User mentions "React" → Follow up with "How do you handle state management in React applications?"
- Example: User mentions "Docker" → Follow up with "What challenges have you faced with container orchestration?"

**IF user gives incomplete or surface-level answers:**
- Ask clarifying follow-up questions
- Example: User says "I use databases" → Follow up with "Which database systems have you worked with and in what scenarios?"
- Example: User says "I know JavaScript" → Follow up with "Can you explain how closures work in JavaScript?"

**IF user demonstrates strong knowledge:**
- Challenge them with advanced scenarios
- Example: User explains SQL joins well → Follow up with "How would you optimize a query with multiple joins on large datasets?"
- Example: User shows good API knowledge → Follow up with "How would you design an API for high concurrency?"

**IF user mentions specific projects/experience:**
- Dive deeper into their project experience
- Example: User mentions e-commerce project → Follow up with "How did you handle payment processing security?"
- Example: User mentions microservices → Follow up with "What were the main challenges in service-to-service communication?"

**IF user shows knowledge gaps:**
- Gently explore related areas or provide learning opportunities
- Example: User doesn't know about testing → Follow up with "How do you ensure code quality in your projects?"
- Example: User unfamiliar with CI/CD → Follow up with "How do you typically deploy your applications?"

**DECISION TREE FOR NEXT QUESTION:**
1. Analyze user's response for: technical terms, depth of knowledge, gaps, confidence level
2. Decide: Should I ask follow-up (80% of the time) OR move to next planned question (20%)?
3. If follow-up: Generate contextual question based on their specific answer
4. If next planned: Use question bank or move to new topic

**FOLLOW-UP QUESTION TYPES:**
- **Depth Questions**: "Can you explain how [mentioned technology] works internally?"
- **Scenario Questions**: "How would you handle [specific situation] in [mentioned context]?"
- **Experience Questions**: "Tell me about a challenging situation you faced with [mentioned tool/concept]"
- **Comparison Questions**: "How does [mentioned approach] compare to [alternative approach]?"
- **Problem-Solving**: "If you encountered [specific issue] with [mentioned technology], how would you debug it?"`;

    // Nếu có danh sách câu hỏi với difficulty levels, cung cấp thông tin để AI chọn thông minh
    if (questionBankContext?.questions?.length) {
      
      // Group questions by difficulty for smart selection
      const questionsByDifficulty = {
        easy: questionBankContext.questions.filter(q => q.difficulty === 'easy'),
        medium: questionBankContext.questions.filter(q => q.difficulty === 'medium'),
        hard: questionBankContext.questions.filter(q => q.difficulty === 'hard')
      };
      
      let questionsInfo: string;
      
      // Nếu ngôn ngữ phỏng vấn không phải tiếng Anh, hướng dẫn AI dịch câu hỏi
      if (language !== 'en-US') {
        const languageName = language === 'vi-VN' ? 'Vietnamese' : language === 'zh-CN' ? 'Chinese' : language === 'ja-JP' ? 'Japanese' : language === 'ko-KR' ? 'Korean' : 'English';
        
        questionsInfo = `
QUESTION BANK STRUCTURE (TRANSLATE TO ${languageName.toUpperCase()} BEFORE ASKING):
📗 EASY QUESTIONS (${questionsByDifficulty.easy.length} available):
${questionsByDifficulty.easy.map((q, i) => `  ${i + 1}. ${q.question} [${q.topic || 'General'}]`).join('\n')}

📘 MEDIUM QUESTIONS (${questionsByDifficulty.medium.length} available):  
${questionsByDifficulty.medium.map((q, i) => `  ${i + 1}. ${q.question} [${q.topic || 'General'}]`).join('\n')}

📕 HARD QUESTIONS (${questionsByDifficulty.hard.length} available):
${questionsByDifficulty.hard.map((q, i) => `  ${i + 1}. ${q.question} [${q.topic || 'General'}]`).join('\n')}

DIFFICULTY SELECTION RULES:
- Question 1-2: Choose from EASY questions
- High performance (8-10): Choose from HARD questions  
- Good performance (6-7): Choose from MEDIUM questions
- Average/Low performance (0-5): Choose from EASY questions
- Prioritize questions matching selected skills: ${config?.selectedSkills?.join(', ') || 'any'}`;
        
        systemContent += `

IMPORTANT LANGUAGE REQUIREMENT:
- The question bank is in English, but you MUST translate ALL questions to ${languageName} before asking
- DO NOT ask questions in English, always translate them first
- Maintain the technical accuracy while translating

${questionsInfo}`;
      } else {
        questionsInfo = `
QUESTION BANK STRUCTURE WITH DIFFICULTY LEVELS:
📗 EASY QUESTIONS (${questionsByDifficulty.easy.length} available):
${questionsByDifficulty.easy.map((q, i) => `  ${i + 1}. ${q.question} [${q.topic || 'General'}]`).join('\n')}

📘 MEDIUM QUESTIONS (${questionsByDifficulty.medium.length} available):
${questionsByDifficulty.medium.map((q, i) => `  ${i + 1}. ${q.question} [${q.topic || 'General'}]`).join('\n')}

📕 HARD QUESTIONS (${questionsByDifficulty.hard.length} available):
${questionsByDifficulty.hard.map((q, i) => `  ${i + 1}. ${q.question} [${q.topic || 'General'}]`).join('\n')}

SMART QUESTION SELECTION:
- Question 1-2: Start with EASY questions
- High performance (8-10): Move to HARD questions
- Good performance (6-7): Use MEDIUM questions  
- Average/Low performance (0-5): Stay with EASY questions
- Focus on selected skills: ${config?.selectedSkills?.join(', ') || 'general topics'}`;
        
        systemContent += `

${questionsInfo}`;
      }
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemContent + `

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

${config?.selectedSkills && config.selectedSkills.length > 0 ? `
**IMPORTANT - USER SELECTED SKILLS FOCUS:**
The candidate has specifically chosen these skills as their areas of expertise: ${config.selectedSkills.join(', ')}${config?.customSkills && config.customSkills.length > 0 ? ` and ${config.customSkills.join(', ')}` : ''}

PRIORITIZE questions related to these specific skills. Your interview should focus on:
- Deep dive into their selected skills: ${config.selectedSkills.join(', ')}
${config?.customSkills && config.customSkills.length > 0 ? `- Explore their custom skills: ${config.customSkills.join(', ')}` : ''}
- Practical applications of these technologies
- Problem-solving using these specific tools/frameworks
- Best practices within these areas
- Integration between these selected technologies

While you may ask general ${field} questions, ensure at least 70% of your questions relate to their selected skills.
` : `
No specific skill selection - cover general ${field} topics appropriate for ${level} level.
`}

CRITICAL REQUIREMENTS FOR QUESTION SELECTION:
1. **Position Alignment**: Every question MUST be directly relevant to ${field} work
2. **Level Appropriateness**: Questions MUST match ${level} expectations
3. **Industry Relevance**: Focus on current market demands and real-world applications
4. **Progressive Difficulty**: Start easier and increase complexity appropriately
${config?.selectedSkills && config.selectedSkills.length > 0 ? `5. **Skill Focus**: Prioritize questions about user's selected skills: ${config.selectedSkills.join(', ')}` : ''}

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
   
   **🚨 QUESTION SELECTION PRIORITY ORDER:**
   1. **FIRST PRIORITY (80%)**: Generate contextual follow-up based on user's previous specific answer
   2. **SECOND PRIORITY (20%)**: Use pre-planned question bank questions only if no good follow-up exists
   
   **⚡ DYNAMIC QUESTIONING RULES:**
   - After user answers, ALWAYS look for specific details they mentioned to follow up on
   - If user mentions ANY technology/concept/experience → Create follow-up about that specific thing
   - If user gives generic answer → Ask for specific examples or deeper explanation
   - If user shows knowledge → Challenge with scenario or advanced concept
   - If user shows gaps → Ask supportive clarifying questions
   
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
   
   **🎯 CRITICAL: FOLLOW-UP QUESTION PRIORITY SYSTEM:**
   
   **STEP 1: ALWAYS ANALYZE USER'S PREVIOUS ANSWER FIRST**
   e) Content Analysis: "What specific technologies, tools, concepts, or experiences did the user mention?"
   f) Depth Assessment: "Was their answer basic/surface-level, detailed, or expert-level?"
   g) Learning Opportunities: "What aspects of their answer can I dig deeper into?"
   
   **STEP 2: MANDATORY FOLLOW-UP DECISION (80% of the time)**
   - DEFAULT ACTION: Generate a contextual follow-up question based on their specific answer
   - ONLY use pre-planned questions if their answer was too vague or off-topic
   - PRIORITY: Dynamic follow-up > Question bank questions
   
   **STEP 3: FOLLOW-UP QUESTION TYPES (Choose based on their answer):**
   📊 DEPTH: "Can you explain more about [specific thing they mentioned]?"
   🎯 SCENARIO: "How would you handle [real scenario] using [their mentioned technology]?"
   💼 EXPERIENCE: "Can you share a specific example when you used [their mentioned concept]?"
   🧩 PROBLEM-SOLVING: "What challenges did you face with [their mentioned approach]?"
   
   **MANDATORY FOLLOW-UP EXAMPLES:**
   - User says "React là thư viện JavaScript" → FOLLOW-UP: "Bạn có thể so sánh React với Vue hay Angular trong project thực tế không?"
   - User mentions "useState hook" → FOLLOW-UP: "Khi nào bạn sẽ chọn useReducer thay vì useState?"
   - User explains "props truyền data" → FOLLOW-UP: "Bạn đã từng gặp vấn đề prop drilling chưa? Xử lý như thế nào?"
   - User says "key prop cho map()" → FOLLOW-UP: "Tại sao không nên dùng array index làm key? Bạn có ví dụ nào không?"
   - User knows "functional component" → FOLLOW-UP: "Khi nào bạn vẫn sẽ chọn class component thay vì functional component?"
   
 
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
- ALWAYS respond in ${language === 'vi-VN' ? 'Vietnamese' : language === 'zh-CN' ? 'Chinese' : language === 'ja-JP' ? 'Japanese' : language === 'ko-KR' ? 'Korean' : 'English'}

**🔍 MANDATORY PRE-QUESTION ANALYSIS:**
Before generating your next question, you MUST analyze the user's previous response:
1. "What specific technologies, concepts, or experiences did they mention?"
2. "What part of their answer shows the most potential for deeper exploration?"
3. "Can I create a follow-up question that builds directly on what they just said?"
4. "Would a follow-up question be more valuable than moving to a new topic?"

**🎯 FOLLOW-UP QUESTION GENERATION EXAMPLES:**
If user says: "React là thư viện JavaScript để xây dựng UI"
→ Your follow-up: "Bạn có thể so sánh React với các framework khác như Angular hay Vue.js không? Điểm khác biệt chính là gì?"

If user says: "useState để quản lý state trong functional component"  
→ Your follow-up: "Khi nào bạn sẽ chọn useReducer thay vì useState? Bạn có thể cho ví dụ cụ thể không?"

If user says: "Props để truyền data từ parent xuống child"
→ Your follow-up: "Nếu bạn có component hierarchy sâu nhiều cấp, bạn sẽ xử lý prop drilling như thế nào?"

**⚠️ ONLY use question bank if:**
- User's answer was too vague or off-topic
- You've already asked 2-3 follow-ups on the same topic
- Need to move to completely new topic area

- Keep questions CONCISE but NATURAL (2 sentences for context + question)
- Be encouraging but maintain professional standards
- Acknowledge candidate's responses before asking next question
- Ask follow-up questions when answers need clarification
- Use natural conversation flow like a real interviewer
- NEVER ask multiple questions in one response
- Show genuine interest in candidate's background and experience

🧠 ADAPTIVE REASONING PROCESS:
Before crafting your next question, follow this thought process:
1. **Analyze Response**: What technologies, concepts, or experiences did they mention?
2. **Assess Depth**: Did they give a surface-level or detailed answer?
3. **Identify Gaps**: What areas need more exploration?
4. **Choose Strategy**: 
   - 80% of time: Ask follow-up to deepen understanding of their response
   - 20% of time: Move to next planned question from question bank
5. **Craft Question**: Make it contextual to their specific answer

🎯 CONTEXTUAL QUESTION EXAMPLES:
- If they mention "React": → "What state management approach do you prefer in React and why?"
- If they say "I worked with APIs": → "Can you describe how you handled authentication in your API integrations?"
- If they explain a concept well: → "Have you encountered any edge cases or challenges with this approach?"
- If they give a basic answer: → "Could you walk me through a specific example from your experience?"
- If they show expertise: → "How would you scale this solution for high traffic scenarios?"

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
  "currentDifficulty": "easy" | "medium" | "hard" (difficulty level of the question you just asked),
  "difficultyReasoning": "Brief explanation of why you chose this difficulty level",
  "completionDetails": {
    "coveredTopics": ["topics", "covered", "so far"],
    "skillAssessment": {
      "technical": number (1-10, based on technical knowledge and depth demonstrated),
      "communication": number (1-10, based on clarity and articulation of responses),
      "problemSolving": number (1-10, based on logical thinking and approach to problems)
    }
  }
}

🎚️ DIFFICULTY SELECTION GUIDELINES:
- Questions 1-2: Use "easy" difficulty to build confidence
- currentScore 8-10: Use "hard" difficulty to challenge them
- currentScore 6-7: Use "medium" difficulty to maintain engagement  
- currentScore 4-5: Use "easy" difficulty for recovery
- currentScore 0-3: Use "easy" difficulty and focus on their strength areas

EXAMPLE DIFFICULTY REASONING:
- "Starting with easy question to build confidence" 
- "High performance (8/10) - challenging with hard React architecture question"
- "Average performance (6/10) - maintaining medium difficulty on selected skills"
- "Low performance (3/10) - recovery mode with easy foundational question"
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
    "evaluation": {
      "technicalScore": number (1-10, based on technical knowledge and depth demonstrated),
      "communicationScore": number (1-10, based on clarity and articulation of responses),
      "problemSolvingScore": number (1-10, based on logical thinking and approach to problems),
      "overallRating": number (1-10, overall assessment),
      "recommendations": ["suggestion1", "suggestion2"]
    }
  }
}

IMPORTANT: You MUST provide realistic evaluation scores based on the candidate's responses:
- technicalScore: Evaluate based on technical knowledge, depth, and accuracy
- communicationScore: Evaluate based on clarity, articulation, and explanation quality  
- problemSolvingScore: Evaluate based on logical thinking, approach, and methodology

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
            evaluation: {
              technicalScore: 0, // Start from 0
              communicationScore: 0, // Start from 0
              problemSolvingScore: 0, // Start from 0
              overallRating: 0,
              recommendations: []
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
          evaluation: {
            technicalScore: 0, // Start from 0
            communicationScore: 0, // Start from 0
            problemSolvingScore: 0, // Start from 0
            overallRating: 0,
            recommendations: []
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

    // Create evaluation object directly from AI response or use defaults
    const evaluation = result.completionDetails?.evaluation || {
      technicalScore: Math.max(0, Math.min(10, result.currentScore || 0)), // Use currentScore as fallback
      communicationScore: 0, // Start from 0
      problemSolvingScore: 0, // Start from 0
      deliveryScore: 0,
      overallRating: 0,
      recommendations: []
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
        evaluation: evaluation
      }
    };

  } catch (error) {
    console.error('Error processing interview response:', error);
    return {
      answer: language === 'vi-VN' 
        ? 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.'
        : language === 'zh-CN'
        ? '抱歉，发生错误。请重试。'
        : language === 'ja-JP'
        ? '申し訳ございません。エラーが発生しました。もう一度お試しください。'
        : language === 'ko-KR'
        ? '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.'
        : 'Sorry, an error occurred. Please try again.',
      currentTopic: "error",
      shouldMoveToNewTopic: false,
      interviewProgress: 0,
      isInterviewComplete: false,
      currentScore: 0, // Start from 0
      questionCount: 0,
      completionDetails: {
        coveredTopics: [],
        evaluation: {
          technicalScore: 0,
          communicationScore: 0,
          problemSolvingScore: 0,
          deliveryScore: 0,
          overallRating: 0,
          recommendations: []
        }
      }
    };
  }
}

export async function startInterview(config: InterviewConfig): Promise<InterviewResponse> {
  try {
    
    console.log('🎯 Starting interview with config:', config);
    
    // Lấy question list trước
    const questionBankContext = await getQuestionBankContext(config);
    
    // Tạo system message và ép dùng danh sách câu hỏi nếu có
    let systemContent = `You are a senior technical interviewer conducting a professional interview for a ${config.level} level ${config.field} position${config.specialization ? ` - ${config.specialization}` : ''}.
IMPORTANT: ONLY respond in ${config.language === 'vi-VN' ? 'Vietnamese' : config.language === 'zh-CN' ? 'Chinese' : config.language === 'ja-JP' ? 'Japanese' : config.language === 'ko-KR' ? 'Korean' : 'English'}.

🎯 SMART FOLLOW-UP QUESTION SYSTEM:
You have TWO modes of questioning:
1. **PRIMARY QUESTIONS**: From the question bank or planned topics  
2. **FOLLOW-UP QUESTIONS**: Contextual questions based on user's previous answer

Use the same follow-up question logic as described in the main interview system:
- IF user mentions specific technologies → Ask deeper questions about those technologies
- IF user gives incomplete answers → Ask clarifying follow-up questions
- IF user demonstrates strong knowledge → Challenge with advanced scenarios
- IF user mentions projects/experience → Dive deeper into their experience
- IF user shows knowledge gaps → Gently explore related areas

DECISION TREE: 80% follow-up questions, 20% move to next planned question.`;

    if (questionBankContext?.questions?.length) {
      console.log('✅ Adding fixed question list to system message');
      const questionsList = questionBankContext.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
      const firstQuestion = questionBankContext.questions[0]?.question || '';
      systemContent += `

FIXED QUESTION LIST (ASK EXACTLY THESE IN ORDER, ONE PER TURN):
${questionsList}

NEXT QUESTION INDEX: 1
YOU MUST ASK EXACTLY THIS QUESTION NOW (DO NOT REPHRASE, DO NOT ADD NEW QUESTIONS):
${firstQuestion}
`;
    } else {
      console.log('⚠️ No question list available, using basic system message');
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemContent
      },
      { 
        role: 'user', 
        content: config.language === 'vi-VN'
          ? `Bắt đầu cuộc phỏng vấn cho vị trí ${config.field}${config.specialization ? ` - ${config.specialization}` : ''}.`
          : config.language === 'zh-CN'
          ? `开始${config.field}${config.specialization ? ` - ${config.specialization}` : ''}职位的面试。`
          : config.language === 'ja-JP'
          ? `${config.field}${config.specialization ? ` - ${config.specialization}` : ''}ポジションの面接を開始します。`
          : config.language === 'ko-KR'
          ? `${config.field}${config.specialization ? ` - ${config.specialization}` : ''} 포지션 면접을 시작합니다.`
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
          : config.language === 'zh-CN'
          ? `您好！我是您的AI面试官，负责${config.level}级别${config.field}${config.specialization ? ` - ${config.specialization}` : ''}职位。您能介绍一下您在${config.field}${config.specialization ? `和${config.specialization}` : ''}方面的经验和技能吗？`
          : config.language === 'ja-JP'
          ? `こんにちは！私は${config.level}レベルの${config.field}${config.specialization ? ` - ${config.specialization}` : ''}ポジションのAI面接官です。${config.field}${config.specialization ? `と${config.specialization}` : ''}の経験とスキルについて教えていただけますか？`
          : config.language === 'ko-KR'
          ? `안녕하세요! 저는 ${config.level} 레벨 ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} 포지션의 AI 면접관입니다. ${config.field}${config.specialization ? `와 ${config.specialization}` : ''} 경험과 기술에 대해 소개해 주실 수 있나요?`
          : `Hello! I am your AI interviewer for the ${config.level} ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} position. Could you tell me about your ${config.field}${config.specialization ? ` and ${config.specialization}` : ''} experience and skills?`),
        currentTopic: "introduction",
        shouldMoveToNewTopic: false,
        interviewProgress: 0,
        isInterviewComplete: false,
        currentScore: 0, // Start from 0
        questionCount: 0, // Starting interview, no questions asked yet
        completionDetails: {
          coveredTopics: [],
          evaluation: {
            technicalScore: 0,
            communicationScore: 0,
            problemSolvingScore: 0
          }
        }
      };
    } catch {
      // Fallback if JSON parsing fails
      const fallbackGreeting = config.language === 'vi-VN' 
        ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field}${config.specialization ? ` và ${config.specialization}` : ''} của bạn không?` 
        : config.language === 'zh-CN'
        ? `您好！我是您的AI面试官，负责${config.level}级别${config.field}${config.specialization ? ` - ${config.specialization}` : ''}职位。您能介绍一下您在${config.field}${config.specialization ? `和${config.specialization}` : ''}方面的经验和技能吗？`
        : config.language === 'ja-JP'
        ? `こんにちは！私は${config.level}レベルの${config.field}${config.specialization ? ` - ${config.specialization}` : ''}ポジションのAI面接官です。${config.field}${config.specialization ? `と${config.specialization}` : ''}の経験とスキルについて教えていただけますか？`
        : config.language === 'ko-KR'
        ? `안녕하세요! 저는 ${config.level} 레벨 ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} 포지션의 AI 면접관입니다. ${config.field}${config.specialization ? `와 ${config.specialization}` : ''} 경험과 기술에 대해 소개해 주실 수 있나요?`
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
          evaluation: {
            technicalScore: 0,
            communicationScore: 0,
            problemSolvingScore: 0
          }
        }
      };
    }

  } catch (error) {
    console.error('Error starting interview:', error);
    const fallbackGreeting = config.language === 'vi-VN' 
      ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng ${config.field}${config.specialization ? ` và ${config.specialization}` : ''} của bạn không?` 
      : config.language === 'zh-CN'
      ? `您好！我是您的AI面试官，负责${config.level}级别${config.field}${config.specialization ? ` - ${config.specialization}` : ''}职位。您能介绍一下您在${config.field}${config.specialization ? `和${config.specialization}` : ''}方面的经验和技能吗？`
      : config.language === 'ja-JP'
      ? `こんにちは！私は${config.level}レベルの${config.field}${config.specialization ? ` - ${config.specialization}` : ''}ポジションのAI面接官です。${config.field}${config.specialization ? `と${config.specialization}` : ''}の経験とスキルについて教えていただけますか？`
      : config.language === 'ko-KR'
      ? `안녕하세요! 저는 ${config.level} 레벨 ${config.field}${config.specialization ? ` - ${config.specialization}` : ''} 포지션의 AI 면접관입니다. ${config.field}${config.specialization ? `와 ${config.specialization}` : ''} 경험과 기술에 대해 소개해 주실 수 있나요?`
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
        evaluation: {
          technicalScore: 0,
          communicationScore: 0,
          problemSolvingScore: 0
        }
      }
    };
  }
}
