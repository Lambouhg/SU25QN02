import { callOpenAI, ChatMessage } from './openaiService';

export interface GlobalChatboxContext {
  page?: string;
  feature?: string;
  helpType?: string;
  error?: string;
  assessmentType?: string;
  userData?: unknown;
  // Thêm các trường mới cho cá nhân hóa
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  userPreferences?: {
    language: string;
    responseStyle: 'concise' | 'detailed';
    technicalLevel: 'basic' | 'intermediate' | 'advanced';
    tone: 'formal' | 'casual' | 'friendly';
  };
  previousQuestions?: string[];
  sessionDuration?: number;
  [key: string]: unknown;
}

export interface GlobalChatboxResponse {
  content: string;
  suggestions?: string[];
  actions?: {
    type: string;
    label: string;
    action: string;
  }[];
}

// Interface cho streaming response
export interface StreamingChatboxResponse {
  content: string;
  isComplete: boolean;
  suggestions?: string[];
  actions?: {
    type: string;
    label: string;
    action: string;
  }[];
}

const generateContextAwarePrompt = (
  userMessage: string,
  context: GlobalChatboxContext
): string => {
  // Cải thiện prompt engineering với user preferences
  const userLevel = context.userLevel || 'beginner';
  const responseStyle = context.userPreferences?.responseStyle || 'detailed';
  const technicalLevel = context.userPreferences?.technicalLevel || 'basic';
  const tone = context.userPreferences?.tone || 'friendly';
  const language = context.userPreferences?.language || 'en';
  
  // Điều chỉnh prompt dựa trên user level
  const levelSpecificInstructions = {
    beginner: language === 'vi' 
      ? 'Sử dụng ngôn ngữ đơn giản, giải thích từng bước chi tiết, đưa ra ví dụ cụ thể'
      : 'Use simple language, explain step by step in detail, provide specific examples',
    intermediate: language === 'vi'
      ? 'Cân bằng giữa chi tiết và ngắn gọn, đưa ra tips nâng cao, gợi ý các bước tiếp theo'
      : 'Balance between detailed and concise, provide advanced tips, suggest next steps',
    advanced: language === 'vi'
      ? 'Tập trung vào insights sâu, best practices, optimization tips, và advanced techniques'
      : 'Focus on deep insights, best practices, optimization tips, and advanced techniques'
  };
  
  // Điều chỉnh tone
  const toneInstructions = {
    formal: language === 'vi'
      ? 'Sử dụng ngôn ngữ trang trọng, chuyên nghiệp, phù hợp với môi trường công việc'
      : 'Use formal, professional language suitable for work environment',
    casual: language === 'vi'
      ? 'Sử dụng ngôn ngữ thân thiện, gần gũi, như đang nói chuyện với bạn bè'
      : 'Use friendly, casual language like talking to friends',
    friendly: language === 'vi'
      ? 'Sử dụng ngôn ngữ thân thiện nhưng vẫn chuyên nghiệp, khuyến khích và động viên'
      : 'Use friendly but professional language, encouraging and motivating'
  };
  
  // Tạo prompt dựa trên ngôn ngữ
  if (language === 'vi') {
    return `Bạn là AI Assistant của F.AI Interview - nền tảng phỏng vấn AI.

NGUYÊN TẮC:
- Trả lời bằng tiếng Việt, ${toneInstructions[tone]}
- Hướng dẫn cụ thể và thực tế
- Khuyến khích sử dụng các tính năng platform

LEVEL NGƯỜI DÙNG (${userLevel}):
${levelSpecificInstructions[userLevel]}

PHONG CÁCH:
- Chi tiết: ${responseStyle === 'concise' ? 'Ngắn gọn, tập trung điểm chính' : 'Chi tiết, có ví dụ và hướng dẫn từng bước'}
- Kỹ thuật: ${technicalLevel === 'basic' ? 'Giải thích đơn giản' : 'Sử dụng thuật ngữ phù hợp'}

CONTEXT:
- Trang: ${context.page || 'general'}
- Level: ${userLevel}
${context.error ? `- Lỗi: ${context.error}` : ''}

TÍNH NĂNG CHÍNH:

1. Avatar Interview: Luyện tập phỏng vấn với AI avatar, chọn avatar/ngôn ngữ/level, theo dõi tiến độ
2. JD Analysis: Upload job description, AI tạo câu hỏi phù hợp, lưu bộ câu hỏi
3. Quiz: Làm quiz theo chủ đề/level, theo dõi điểm số, cải thiện kiến thức
4. Assessment: Đánh giá kỹ năng EQ/Technical, phân tích điểm mạnh/yếu, lộ trình phát triển
5. Review: Hệ thống học bằng flash card với tính năng shuffle, lọc bookmark, kỹ thuật học tập
6. Dashboard: Tổng quan tiến độ, skill assessment, thống kê, goal tracking
7. Payment: Gói dịch vụ, thanh toán PayOS, quản lý subscription
8. Profile: Thông tin cá nhân, cài đặt preferences, customization

HƯỚNG DẪN THEO CONTEXT:

${context.page === 'avatar-interview' ? 'AVATAR INTERVIEW: Hướng dẫn chọn avatar, quy trình phỏng vấn, troubleshooting voice/video, tips phỏng vấn' : ''}
${context.page === 'jd-analysis' ? 'JD ANALYSIS: Hướng dẫn upload file, quá trình phân tích, chọn câu hỏi, tips viết JD' : ''}
${context.page === 'quiz' ? 'QUIZ: Hướng dẫn chọn quiz, scoring system, tips làm quiz, review và cải thiện' : ''}
${context.page === 'assessment' ? 'ASSESSMENT: Hướng dẫn chọn loại đánh giá, quy trình làm bài, hiểu kết quả EQ/Technical, tips cải thiện điểm số' : ''}
${context.page === 'review' ? 'REVIEW: Hướng dẫn học bằng flash card, tính năng shuffle, lọc bookmark, kỹ thuật học tập, chiến lược review' : ''}
${context.page === 'dashboard' ? 'DASHBOARD: Giải thích metrics, đọc skill assessment, tips cải thiện, goal setting' : ''}
${context.page === 'payment' ? 'PAYMENT: Giải thích gói dịch vụ, hướng dẫn thanh toán, quản lý subscription' : ''}
${context.page === 'error' ? `ERROR: Phân tích lỗi ${context.error}, đưa ra giải pháp, troubleshooting, liên hệ support` : ''}

QUAN TRỌNG: 
- Phân tích câu hỏi của người dùng trước khi trả lời
- Trả lời ngắn gọn, đúng trọng tâm câu hỏi
- Nếu người dùng chào hỏi: Trả lời chào lại và hỏi có thể giúp gì
- Nếu hỏi về tính năng: Hướng dẫn step-by-step cụ thể
- Nếu hỏi chung chung: Đưa ra overview ngắn gọn
- KHÔNG sử dụng dấu **, ###, hoặc format markdown
- Trả lời bằng text thuần túy, dễ đọc

FORMAT TRẢ LỜI:
- Sử dụng dấu gạch đầu dòng (-) cho danh sách
- Không sử dụng dấu ** cho nhấn mạnh
- Không sử dụng ### cho tiêu đề
- Trả lời tự nhiên như đang nói chuyện
- Độ dài: 2-5 câu cho câu hỏi đơn giản, 5-10 câu cho hướng dẫn

Hãy trả lời: "${userMessage}"`;
  } else {
    // English prompt
    return `You are an AI Assistant for F.AI Interview - an AI interview platform.

PRINCIPLES:
- Respond in English, ${toneInstructions[tone]}
- Provide specific and practical guidance
- Encourage platform feature usage

USER LEVEL (${userLevel}):
${levelSpecificInstructions[userLevel]}

STYLE:
- Detail: ${responseStyle === 'concise' ? 'Concise, focused' : 'Detailed with examples and step-by-step'}
- Technical: ${technicalLevel === 'basic' ? 'Simple explanations' : 'Use appropriate technical terms'}

CONTEXT:
- Page: ${context.page || 'general'}
- Level: ${userLevel}
${context.error ? `- Error: ${context.error}` : ''}

MAIN FEATURES:

1. Avatar Interview: AI avatar interviews, choose avatar/language/level, track progress
2. JD Analysis: Upload job description, AI creates questions, save question sets
3. Quiz: Take quizzes by topic/level, track scores, improve knowledge
4. Assessment: EQ/Technical skill evaluation, analyze strengths/weaknesses, development roadmap
5. Review: Flash card learning system with shuffle, bookmark filtering, study techniques
6. Dashboard: Progress overview, skill assessment, statistics, goal tracking
7. Payment: Service packages, PayOS payment, subscription management
8. Profile: Personal info, preferences setup, customization

CONTEXT GUIDANCE:

${context.page === 'avatar-interview' ? 'AVATAR INTERVIEW: Guide avatar selection, interview process, troubleshoot voice/video, interview tips' : ''}
${context.page === 'jd-analysis' ? 'JD ANALYSIS: Guide file upload, analysis process, choose questions, JD writing tips' : ''}
${context.page === 'quiz' ? 'QUIZ: Guide quiz selection, scoring system, quiz tips, review and improve' : ''}
${context.page === 'assessment' ? 'ASSESSMENT: Guide assessment type selection, evaluation process, understand EQ/Technical results, improvement tips' : ''}
${context.page === 'review' ? 'REVIEW: Guide flash card learning, shuffle functionality, bookmark filtering, study techniques, review strategies' : ''}
${context.page === 'dashboard' ? 'DASHBOARD: Explain metrics, read skill assessment, improvement tips, goal setting' : ''}
${context.page === 'payment' ? 'PAYMENT: Explain packages, payment guidance, subscription management' : ''}
${context.page === 'error' ? `ERROR: Analyze error ${context.error}, provide solutions, troubleshooting, contact support` : ''}

IMPORTANT: 
- Analyze the user's question before responding
- Provide concise, focused answers
- If user greets: Respond with greeting and ask how you can help
- If asking about features: Give specific step-by-step guidance
- If asking general questions: Provide brief overview
- DO NOT use **, ###, or markdown formatting
- Respond with plain text, easy to read

RESPONSE FORMAT:
- Use bullet points (-) for lists
- Do not use ** for emphasis
- Do not use ### for headings
- Respond naturally like in conversation
- Length: 2-5 sentences for simple questions, 5-10 sentences for guidance

Please answer: "${userMessage}"`;
  }
};

// Function to generate context-aware actions
const generateContextAwareActions = (page: string | undefined, language: string): { type: string; label: string; action: string }[] => {
  const actions: { type: string; label: string; action: string }[] = [];
  
  if (page === 'avatar-interview') {
    actions.push(
      { type: 'navigate', label: language === 'vi' ? 'Bắt đầu phỏng vấn' : 'Start Interview', action: '/avatar-interview' },
      { type: 'help', label: language === 'vi' ? 'Xem lịch sử phỏng vấn' : 'View Interview History', action: '/avatar-interview/history' }
    );
  } else if (page === 'jd-analysis') {
    actions.push(
      { type: 'navigate', label: language === 'vi' ? 'Upload JD' : 'Upload JD', action: '/jd' },
      { type: 'help', label: language === 'vi' ? 'Xem lịch sử JD' : 'View JD Interview History', action: '/jd-interview-history' }
    );
  } else if (page === 'quiz') {
    actions.push(
      { type: 'navigate', label: language === 'vi' ? 'Làm Quiz' : 'Take Quiz', action: '/quiz' },
      { type: 'help', label: language === 'vi' ? 'Xem lịch sử' : 'View History', action: '/history' }
    );
  } else if (page === 'assessment') {
    actions.push(
      { type: 'navigate', label: language === 'vi' ? 'Bắt đầu Assessment' : 'Start Assessment', action: '/test' },
      { type: 'help', label: language === 'vi' ? 'Thiết lập cá nhân hóa ở profile' : 'Setting in profile', action: '/profile' }
    );
  } else if (page === 'review') {
    actions.push(
      { type: 'navigate', label: language === 'vi' ? 'Bắt đầu Review' : 'Start Review', action: '/review' },
      { type: 'help', label: language === 'vi' ? 'Hướng dẫn sử dụng Flash Card' : 'Flash Card Guide', action: '/review' }
    );
  } else if (page === 'payment') {
    actions.push(
      { type: 'navigate', label: language === 'vi' ? 'Xem gói dịch vụ' : 'View Pricing', action: '/Pricing' },
      { type: 'help', label: language === 'vi' ? 'Gói hiện tại của bạn và các khoản tín dụng còn lại' : 'Your current package and remaining credits', action: '/usage' }
    );
  }
  
  return actions;
};

// Function to get context-specific suggestions
const getContextSpecificSuggestions = (page: string | undefined, language: string): string[] => {
  if (language === 'vi') {
    const viSuggestions: { [key: string]: string[] } = {
      'avatar-interview': [
        'Cách chọn avatar phù hợp với ngành nghề?',
        'Làm sao để chuẩn bị tốt cho buổi phỏng vấn?',
        'Cách khắc phục sự cố âm thanh khi phỏng vấn?',
        'Mẹo trả lời câu hỏi phỏng vấn hiệu quả?',
        'Cách thiết lập ngôn ngữ và level phù hợp?'
      ],
      'jd-analysis': [
        'Cách viết job description hấp dẫn?',
        'Làm sao để tạo câu hỏi phỏng vấn phù hợp?',
        'Cách phân tích JD để tìm ứng viên tốt?',
        'Mẹo upload file JD thành công?',
        'Cách chọn loại câu hỏi phù hợp?'
      ],
      'quiz': [
        'Cách chọn quiz phù hợp với trình độ?',
        'Làm sao để cải thiện điểm số quiz?',
        'Cách xem lại kết quả quiz chi tiết?',
        'Mẹo làm quiz hiệu quả và nhanh chóng?',
        'Cách theo dõi tiến độ học tập?'
      ],
      'assessment': [
        'Cách chuẩn bị cho bài đánh giá kỹ năng?',
        'Làm sao để hiểu kết quả assessment?',
        'Cách cải thiện điểm số EQ/Technical?',
        'Mẹo làm bài assessment hiệu quả?',
        'Cách thiết lập profile cá nhân hóa?'
      ],
      'review': [
        'Cách sử dụng flash card hiệu quả?',
        'Làm sao để shuffle flash card ngẫu nhiên?',
        'Cách lọc flash card theo bookmark?',
        'Mẹo học tập với flash card?',
        'Cách tạo bookmark cho flash card quan trọng?'
      ],
      'dashboard': [
        'Cách đọc các chỉ số trong dashboard?',
        'Làm sao để hiểu skill assessment?',
        'Cách đặt mục tiêu học tập phù hợp?',
        'Mẹo cải thiện điểm số tổng thể?',
        'Cách theo dõi tiến độ học tập?'
      ],
      'payment': [
        'Cách so sánh các gói dịch vụ?',
        'Làm sao để thanh toán an toàn?',
        'Cách quản lý gói đăng ký?',
        'Mẹo chọn gói phù hợp với nhu cầu?',
        'Cách liên hệ hỗ trợ thanh toán?'
      ]
    };
    return viSuggestions[page || 'general'] || [
      'Hướng dẫn sử dụng nền tảng',
      'Tổng quan tính năng chính',
      'Mẹo để đạt kết quả tốt'
    ];
  } else {
    const enSuggestions: { [key: string]: string[] } = {
      'avatar-interview': [
        'How to choose the right avatar for my field?',
        'How to prepare effectively for interviews?',
        'How to troubleshoot audio issues during interviews?',
        'Tips for answering interview questions effectively?',
        'How to set appropriate language and level?'
      ],
      'jd-analysis': [
        'How to write compelling job descriptions?',
        'How to create relevant interview questions?',
        'How to analyze JD to find good candidates?',
        'Tips for successful JD file upload?',
        'How to choose the right question types?'
      ],
      'quiz': [
        'How to choose quizzes matching my level?',
        'How to improve my quiz scores?',
        'How to review detailed quiz results?',
        'Tips for effective and quick quiz taking?',
        'How to track learning progress?'
      ],
      'assessment': [
        'How to prepare for skill assessments?',
        'How to understand assessment results?',
        'How to improve EQ/Technical scores?',
        'Tips for effective assessment taking?',
        'How to set up personalized profile?'
      ],
      'review': [
        'How to use flash cards effectively?',
        'How to shuffle flash cards randomly?',
        'How to filter flash cards by bookmark?',
        'Study tips with flash cards?',
        'How to bookmark important flash cards?'
      ],
      'dashboard': [
        'How to read dashboard metrics?',
        'How to understand skill assessment?',
        'How to set appropriate learning goals?',
        'Tips to improve overall scores?',
        'How to track learning progress?'
      ],
      'payment': [
        'How to compare service packages?',
        'How to make secure payments?',
        'How to manage subscriptions?',
        'Tips for choosing the right package?',
        'How to contact payment support?'
      ]
    };
    return enSuggestions[page || 'general'] || [
      'How to use this platform',
      'Main features overview',
      'Tips for best results'
    ];
  }
};

// Sentiment Analysis Function
const analyzeUserSentiment = (message: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = [
    'tốt', 'hay', 'cảm ơn', 'thích', 'tuyệt', 'xuất sắc', 'hoàn hảo', 'tuyệt vời',
    'dễ', 'đơn giản', 'rõ ràng', 'hiểu', 'thành công', 'hoàn thành', 'xong'
  ];
  
  const negativeWords = [
    'không tốt', 'tệ', 'lỗi', 'khó', 'không hiểu', 'rắc rối', 'vấn đề',
    'thất bại', 'không được', 'sai', 'lỗi', 'bug', 'crash', 'đơ'
  ];
  
  const messageLower = message.toLowerCase();
  const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length;
  
  // Thêm logic cho các từ khóa mạnh
  const strongPositive = ['tuyệt vời', 'xuất sắc', 'hoàn hảo', 'cảm ơn nhiều'];
  const strongNegative = ['rất tệ', 'rất khó', 'không thể', 'impossible'];
  
  const hasStrongPositive = strongPositive.some(word => messageLower.includes(word));
  const hasStrongNegative = strongNegative.some(word => messageLower.includes(word));
  
  if (hasStrongPositive || positiveCount > negativeCount + 1) return 'positive';
  if (hasStrongNegative || negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
};

export const processGlobalChatboxMessage = async (
  userMessage: string,
  context: GlobalChatboxContext = {}
): Promise<GlobalChatboxResponse> => {
  try {
    const systemPrompt = generateContextAwarePrompt(userMessage, context);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    const content = response.choices[0].message.content;

    // Extract suggestions and actions from content
    const suggestions: string[] = [];
    const actions: { type: string; label: string; action: string }[] = [];

    // Sentiment Analysis và Response Tuning
    const sentiment = analyzeUserSentiment(userMessage);
    let adjustedContent = content;
    
    // Điều chỉnh response dựa trên sentiment và user preferences
    const language = context.userPreferences?.language || 'en';
    
    if (sentiment === 'negative') {
      const empathyPhrases = language === 'vi' ? {
        beginner: 'Tôi hiểu bạn đang gặp khó khăn. Hãy để tôi hướng dẫn bạn từng bước một.',
        intermediate: 'Tôi thấy bạn đang gặp vấn đề. Hãy để tôi giúp bạn giải quyết một cách hiệu quả.',
        advanced: 'Tôi nhận thấy có vấn đề cần khắc phục. Hãy để tôi đưa ra giải pháp tối ưu.'
      } : {
        beginner: 'I understand you\'re having difficulties. Let me guide you step by step.',
        intermediate: 'I see you\'re facing an issue. Let me help you solve it effectively.',
        advanced: 'I notice there\'s a problem that needs to be addressed. Let me provide an optimal solution.'
      };
      
      const followUpQuestion = language === 'vi' 
        ? 'Bạn có thể mô tả cụ thể vấn đề không? Tôi sẽ hỗ trợ bạn tốt hơn.'
        : 'Can you describe the specific issue? I\'ll provide better support.';
      
      adjustedContent = `${empathyPhrases[context.userLevel || 'beginner']}\n\n${content}\n\n${followUpQuestion}`;
    } else if (sentiment === 'positive') {
      const encouragementPhrases = language === 'vi' ? {
        beginner: 'Rất vui khi có thể giúp bạn! Hãy tiếp tục khám phá các tính năng.',
        intermediate: 'Tuyệt vời! Bạn đang tiến bộ rất tốt. Có cần hỗ trợ thêm gì không?',
        advanced: 'Xuất sắc! Bạn đã nắm vững kiến thức. Hãy để tôi đưa ra những tips nâng cao.'
      } : {
        beginner: 'I\'m glad I could help you! Keep exploring the features.',
        intermediate: 'Excellent! You\'re making great progress. Do you need any additional support?',
        advanced: 'Outstanding! You\'ve mastered the knowledge. Let me provide some advanced tips.'
      };
      
      adjustedContent = `${content}\n\n${encouragementPhrases[context.userLevel || 'beginner']}`;
    }

    // Use only context-specific suggestions (no AI content parsing)
    const contextSuggestions = getContextSpecificSuggestions(context.page, language);
    const randomSuggestions = contextSuggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    suggestions.push(...randomSuggestions);

    // Generate context-aware actions
    const contextActions = generateContextAwareActions(context.page, language);
    actions.push(...contextActions);

    return {
      content: adjustedContent,
      suggestions: suggestions, // Use context-specific suggestions
      actions: actions.slice(0, 3) // Limit to 3 actions
    };

  } catch (error) {
    console.error('Error processing global chatbox message:', error);
    
    const language = context.userPreferences?.language || 'en';
    
    if (language === 'vi') {
      return {
        content: 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau hoặc liên hệ support nếu vấn đề tiếp tục.',
        suggestions: [
          'Thử refresh trang và thử lại',
          'Kiểm tra kết nối internet',
          'Liên hệ support nếu vấn đề tiếp tục'
        ]
      };
    } else {
      return {
        content: 'Sorry, an error occurred while processing your message. Please try again later or contact support if the issue persists.',
        suggestions: [
          'Try refreshing the page and try again',
          'Check your internet connection',
          'Contact support if the issue persists'
        ]
      };
    }
  }
};

// Function để xử lý streaming response - trả lời từng bước
export const processGlobalChatboxMessageStreaming = async (
  userMessage: string,
  context: GlobalChatboxContext = {},
  onChunk?: (chunk: StreamingChatboxResponse) => void,
  signal?: AbortSignal
): Promise<StreamingChatboxResponse> => {
  try {
    const systemPrompt = generateContextAwarePrompt(userMessage, context);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // Tạo response từng bước
    const language = context.userPreferences?.language || 'en';
    const userLevel = context.userLevel || 'beginner';
    
    // Bước 1: Empathy/Introduction (nếu sentiment negative)
    const sentiment = analyzeUserSentiment(userMessage);
    let currentContent = '';
    
    if (sentiment === 'negative') {
      const empathyPhrases = language === 'vi' ? {
        beginner: 'Tôi hiểu bạn đang gặp khó khăn. Hãy để tôi hướng dẫn bạn từng bước một.',
        intermediate: 'Tôi thấy bạn đang gặp vấn đề. Hãy để tôi giúp bạn giải quyết một cách hiệu quả.',
        advanced: 'Tôi nhận thấy có vấn đề cần khắc phục. Hãy để tôi đưa ra giải pháp tối ưu.'
      } : {
        beginner: 'I understand you\'re having difficulties. Let me guide you step by step.',
        intermediate: 'I see you\'re facing an issue. Let me help you solve it effectively.',
        advanced: 'I notice there\'s a problem that needs to be addressed. Let me provide an optimal solution.'
      };
      
      currentContent = empathyPhrases[userLevel];
      if (onChunk) {
        onChunk({
          content: currentContent,
          isComplete: false
        });
      }
      
      // Delay để tạo cảm giác typing
      await new Promise(resolve => setTimeout(resolve, 800));
       
       // Check if aborted
       if (signal?.aborted) {
         throw new Error('Generation aborted');
       }
    }

    // Bước 2: Main content từ AI
    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    const aiContent = response.choices[0].message.content;
    
         // Chia content thành các chunks nhỏ để stream - từng từ một
     const words = aiContent.split(/\s+/);
    let streamedContent = currentContent;
    
     for (let i = 0; i < words.length; i++) {
       const word = words[i];
       if (word.trim()) {
         streamedContent += (streamedContent && !streamedContent.endsWith('\n\n') ? ' ' : '') + word;
        
        if (onChunk) {
          onChunk({
            content: streamedContent,
            isComplete: false
          });
        }
        
         // Delay giữa các từ để tạo cảm giác typing tự nhiên
         const baseDelay = 50; // 50ms base delay
         const randomDelay = Math.random() * 30; // 0-30ms random
         await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
         
         // Check if aborted
         if (signal?.aborted) {
           throw new Error('Generation aborted');
         }
      }
    }

    // Bước 3: Follow-up question hoặc encouragement
    let finalContent = streamedContent;
    
    if (sentiment === 'negative') {
      const followUpQuestion = language === 'vi' 
        ? 'Bạn có thể mô tả cụ thể vấn đề không? Tôi sẽ hỗ trợ bạn tốt hơn.'
        : 'Can you describe the specific issue? I\'ll provide better support.';
      
      finalContent += '\n\n' + followUpQuestion;
      
      if (onChunk) {
        onChunk({
          content: finalContent,
          isComplete: false
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if aborted
      if (signal?.aborted) {
        throw new Error('Generation aborted');
      }
      
    } else if (sentiment === 'positive') {
      const encouragementPhrases = language === 'vi' ? {
        beginner: 'Rất vui khi có thể giúp bạn! Hãy tiếp tục khám phá các tính năng.',
        intermediate: 'Tuyệt vời! Bạn đang tiến bộ rất tốt. Có cần hỗ trợ thêm gì không?',
        advanced: 'Xuất sắc! Bạn đã nắm vững kiến thức. Hãy để tôi đưa ra những tips nâng cao.'
      } : {
        beginner: 'I\'m glad I could help you! Keep exploring the features.',
        intermediate: 'Excellent! You\'re making great progress. Do you need any additional support?',
        advanced: 'Outstanding! You\'ve mastered the knowledge. Let me provide some advanced tips.'
      };
      
      finalContent += '\n\n' + encouragementPhrases[userLevel];
      
      if (onChunk) {
        onChunk({
          content: finalContent,
          isComplete: false
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if aborted
      if (signal?.aborted) {
        throw new Error('Generation aborted');
      }
    }

    // Extract suggestions và actions
    const suggestions: string[] = [];
    const actions: { type: string; label: string; action: string }[] = [];

    // Use only context-specific suggestions (no AI content parsing)
    const contextSuggestions = getContextSpecificSuggestions(context.page, language);
    const randomSuggestions = contextSuggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    suggestions.push(...randomSuggestions);

    // Generate context-aware actions
    const contextActions = generateContextAwareActions(context.page, language);
    actions.push(...contextActions);

    // Final response với suggestions và actions
    const finalResponse: StreamingChatboxResponse = {
      content: finalContent,
      isComplete: true,
      suggestions: suggestions.slice(0, 3),
      actions: actions.slice(0, 3)
    };

    if (onChunk) {
      onChunk(finalResponse);
    }

    return finalResponse;

  } catch (error) {
    console.error('Error processing global chatbox message streaming:', error);
    
    const language = context.userPreferences?.language || 'en';
    
    const errorResponse: StreamingChatboxResponse = {
      content: language === 'vi' 
        ? 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau hoặc liên hệ support nếu vấn đề tiếp tục.'
        : 'Sorry, an error occurred while processing your message. Please try again later or contact support if the issue persists.',
      isComplete: true,
      suggestions: language === 'vi' ? [
        'Thử refresh trang và thử lại',
        'Kiểm tra kết nối internet',
        'Liên hệ support nếu vấn đề tiếp tục'
      ] : [
        'Try refreshing the page and try again',
        'Check your internet connection',
        'Contact support if the issue persists'
      ]
    };

    if (onChunk) {
      onChunk(errorResponse);
    }

    return errorResponse;
  }
};