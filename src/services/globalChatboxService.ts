import { callOpenAI, ChatMessage } from './openaiService';

export interface GlobalChatboxContext {
  page?: string;
  feature?: string;
  helpType?: string;
  error?: string;
  assessmentType?: string;
  userData?: any;
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
  [key: string]: any;
}

// Interface cho chatbot settings
export interface ChatbotSettings {
  language: 'en' | 'vi' | 'auto';
  responseStyle: 'concise' | 'detailed';
  technicalLevel: 'basic' | 'intermediate' | 'advanced';
  tone: 'formal' | 'casual' | 'friendly';
  autoDetectLanguage: boolean;
  enableSentimentAnalysis: boolean;
  enableContextMemory: boolean;
  maxResponseLength: 'short' | 'medium' | 'long';
  enableProactiveSuggestions: boolean;
  enableUserBehaviorTracking: boolean;
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
  context: GlobalChatboxContext,
  userData?: any
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
    return `Bạn là AI Assistant chuyên nghiệp của F.AI Interview - nền tảng phỏng vấn AI toàn diện.

NGUYÊN TẮC CHÍNH:
- Trả lời bằng tiếng Việt, ${toneInstructions[tone]}
- Đưa ra hướng dẫn cụ thể và thực tế
- Kết hợp kiến thức về phỏng vấn, công nghệ và career development
- Luôn khuyến khích người dùng sử dụng các tính năng của platform

HƯỚNG DẪN THEO LEVEL NGƯỜI DÙNG (${userLevel}):
${levelSpecificInstructions[userLevel]}

PHONG CÁCH TRẢ LỜI:
- Độ chi tiết: ${responseStyle === 'concise' ? 'Ngắn gọn, súc tích, tập trung vào điểm chính' : 'Chi tiết, đầy đủ, bao gồm examples và step-by-step'}
- Mức độ kỹ thuật: ${technicalLevel === 'basic' ? 'Giải thích đơn giản, tránh jargon phức tạp' : 'Sử dụng technical terms phù hợp, đưa ra insights nâng cao'}

CONTEXT HIỆN TẠI:
- Trang: ${context.page || 'general'}
- Level người dùng: ${userLevel}
- Tính năng: ${context.feature || 'general'}
- Loại hỗ trợ: ${context.helpType || 'general'}
${context.error ? `- Lỗi: ${context.error}` : ''}
${context.assessmentType ? `- Loại đánh giá: ${context.assessmentType}` : ''}
${context.previousQuestions && context.previousQuestions.length > 0 ? `- Câu hỏi trước: ${context.previousQuestions.slice(-2).join(', ')}` : ''}
${context.sessionDuration ? `- Thời gian session: ${Math.round(context.sessionDuration / 60000)} phút` : ''}

TÍNH NĂNG CHÍNH CỦA PLATFORM:

1. Avatar Interview (avatar-interview):
   - Phỏng vấn với AI avatar có voice và video
   - Chọn avatar, cài đặt ngôn ngữ, level
   - Theo dõi tiến độ và đánh giá kỹ năng
   - Lưu lịch sử phỏng vấn

2. JD Analysis (jd-analysis):
   - Upload job description (PDF/Word)
   - AI phân tích và tạo câu hỏi phù hợp
   - Chọn loại câu hỏi (technical/behavioral)
   - Lưu bộ câu hỏi để tái sử dụng

3. Quiz & Assessment (quiz):
   - Làm quiz theo chủ đề và level
   - Assessment EQ và technical
   - Theo dõi điểm số và tiến độ
   - Xem lịch sử và cải thiện

4. Dashboard (dashboard):
   - Tổng quan tiến độ học tập
   - Skill assessment và recommendations
   - Thống kê phỏng vấn và quiz
   - Goal tracking và achievements

5. Payment & Packages (payment):
   - Gói dịch vụ khác nhau
   - Thanh toán qua PayOS
   - Quản lý subscription
   - Lịch sử thanh toán

6. Profile & Settings (profile):
   - Quản lý thông tin cá nhân
   - Cài đặt interview preferences
   - Avatar và theme customization
   - Privacy và security settings

HƯỚNG DẪN TRẢ LỜI THEO CONTEXT:

${context.page === 'avatar-interview' ? `
AVATAR INTERVIEW CONTEXT:
- Hướng dẫn chọn avatar và cài đặt
- Giải thích quy trình phỏng vấn
- Troubleshooting lỗi voice/video
- Tips để có buổi phỏng vấn tốt
` : ''}

${context.page === 'jd-analysis' ? `
JD ANALYSIS CONTEXT:
- Hướng dẫn upload file JD
- Giải thích quá trình phân tích
- Cách chọn câu hỏi phù hợp
- Tips viết JD tốt
` : ''}

${context.page === 'quiz' ? `
QUIZ CONTEXT:
- Hướng dẫn chọn quiz phù hợp
- Giải thích scoring system
- Tips làm quiz hiệu quả
- Cách review và cải thiện
` : ''}

${context.page === 'dashboard' ? `
DASHBOARD CONTEXT:
- Giải thích các metrics
- Cách đọc skill assessment
- Tips cải thiện điểm số
- Goal setting và tracking
` : ''}

${context.page === 'payment' ? `
PAYMENT CONTEXT:
- Giải thích các gói dịch vụ
- Hướng dẫn thanh toán
- Quản lý subscription
- Refund và cancellation
` : ''}

${context.page === 'error' ? `
ERROR CONTEXT:
- Phân tích lỗi: ${context.error}
- Đưa ra giải pháp cụ thể
- Hướng dẫn troubleshooting
- Liên hệ support nếu cần
` : ''}

FORMAT TRẢ LỜI:
- Trả lời chính: Giải thích chi tiết, hướng dẫn cụ thể
- Gợi ý tiếp theo: 2-3 câu hỏi để tương tác
- Actions: Các hành động người dùng có thể thực hiện

Hãy trả lời câu hỏi: "${userMessage}"`;
  } else {
    // English prompt
    return `You are a professional AI Assistant for F.AI Interview - a comprehensive AI interview platform.

CORE PRINCIPLES:
- Respond in English, ${toneInstructions[tone]}
- Provide specific and practical guidance
- Combine knowledge about interviews, technology, and career development
- Always encourage users to use platform features

USER LEVEL GUIDANCE (${userLevel}):
${levelSpecificInstructions[userLevel]}

RESPONSE STYLE:
- Detail level: ${responseStyle === 'concise' ? 'Concise, focused on key points' : 'Detailed, comprehensive, including examples and step-by-step'}
- Technical level: ${technicalLevel === 'basic' ? 'Simple explanations, avoid complex jargon' : 'Use appropriate technical terms, provide advanced insights'}

CURRENT CONTEXT:
- Page: ${context.page || 'general'}
- User level: ${userLevel}
- Feature: ${context.feature || 'general'}
- Help type: ${context.helpType || 'general'}
${context.error ? `- Error: ${context.error}` : ''}
${context.assessmentType ? `- Assessment type: ${context.assessmentType}` : ''}
${context.previousQuestions && context.previousQuestions.length > 0 ? `- Previous questions: ${context.previousQuestions.slice(-2).join(', ')}` : ''}
${context.sessionDuration ? `- Session duration: ${Math.round(context.sessionDuration / 60000)} minutes` : ''}

MAIN PLATFORM FEATURES:

1. Avatar Interview (avatar-interview):
   - Interview with AI avatar with voice and video
   - Choose avatar, set language, level
   - Track progress and evaluate skills
   - Save interview history

2. JD Analysis (jd-analysis):
   - Upload job description (PDF/Word)
   - AI analyzes and creates suitable questions
   - Choose question type (technical/behavioral)
   - Save question sets for reuse

3. Quiz & Assessment (quiz):
   - Take quizzes by topic and level
   - EQ and technical assessment
   - Track scores and progress
   - View history and improve

4. Dashboard (dashboard):
   - Learning progress overview
   - Skill assessment and recommendations
   - Interview and quiz statistics
   - Goal tracking and achievements

5. Payment & Packages (payment):
   - Different service packages
   - PayOS payment
   - Subscription management
   - Payment history

6. Profile & Settings (profile):
   - Personal information management
   - Interview preferences setup
   - Avatar and theme customization
   - Privacy and security settings

CONTEXT-SPECIFIC GUIDANCE:

${context.page === 'avatar-interview' ? `
AVATAR INTERVIEW CONTEXT:
- Guide avatar selection and setup
- Explain interview process
- Troubleshoot voice/video issues
- Tips for successful interviews
` : ''}

${context.page === 'jd-analysis' ? `
JD ANALYSIS CONTEXT:
- Guide JD file upload
- Explain analysis process
- How to choose suitable questions
- Tips for writing effective JDs
` : ''}

${context.page === 'quiz' ? `
QUIZ CONTEXT:
- Guide quiz selection
- Explain scoring system
- Tips for effective quiz taking
- How to review and improve
` : ''}

${context.page === 'dashboard' ? `
DASHBOARD CONTEXT:
- Explain metrics
- How to read skill assessment
- Tips to improve scores
- Goal setting and tracking
` : ''}

${context.page === 'payment' ? `
PAYMENT CONTEXT:
- Explain service packages
- Payment guidance
- Subscription management
- Refund and cancellation
` : ''}

${context.page === 'error' ? `
ERROR CONTEXT:
- Analyze error: ${context.error}
- Provide specific solutions
- Troubleshooting guidance
- Contact support if needed
` : ''}

RESPONSE FORMAT:
- Main response: Detailed explanation, specific guidance
- Follow-up suggestions: 2-3 questions for interaction
- Actions: Actions users can take

Please answer the question: "${userMessage}"`;
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
  context: GlobalChatboxContext = {},
  userData?: any
): Promise<GlobalChatboxResponse> => {
  try {
    const systemPrompt = generateContextAwarePrompt(userMessage, context, userData);
    
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

    // Look for common suggestion patterns
    const suggestionPatterns = [
      /bạn có thể (.*?)(?:\.|$)/gi,
      /hãy thử (.*?)(?:\.|$)/gi,
      /nên (.*?)(?:\.|$)/gi
    ];

    suggestionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        suggestions.push(...matches.map((m: string) => m.trim()));
      }
    });

    // Generate context-aware actions
    if (context.page === 'avatar-interview') {
      actions.push(
        { type: 'navigate', label: 'Bắt đầu phỏng vấn', action: '/avatar-interview' },
        { type: 'help', label: 'Xem hướng dẫn chi tiết', action: 'show_avatar_guide' }
      );
    } else if (context.page === 'jd-analysis') {
      actions.push(
        { type: 'navigate', label: 'Upload JD', action: '/jd' },
        { type: 'help', label: 'Xem ví dụ JD', action: 'show_jd_example' }
      );
    } else if (context.page === 'quiz') {
      actions.push(
        { type: 'navigate', label: 'Làm Quiz', action: '/quiz' },
        { type: 'help', label: 'Xem lịch sử', action: 'show_quiz_history' }
      );
    }

    return {
      content: adjustedContent,
      suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
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
  userData?: any,
  onChunk?: (chunk: StreamingChatboxResponse) => void
): Promise<StreamingChatboxResponse> => {
  try {
    const systemPrompt = generateContextAwarePrompt(userMessage, context, userData);
    
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
    }

    // Bước 2: Main content từ AI
    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    const aiContent = response.choices[0].message.content;
    
    // Chia content thành các chunks nhỏ để stream
    const sentences = aiContent.split(/(?<=[.!?])\s+/);
    let streamedContent = currentContent;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (sentence.trim()) {
        streamedContent += (currentContent ? '\n\n' : '') + sentence;
        
        if (onChunk) {
          onChunk({
            content: streamedContent,
            isComplete: false
          });
        }
        
        // Delay giữa các câu để tạo cảm giác typing
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
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
    }

    // Extract suggestions và actions
    const suggestions: string[] = [];
    const actions: { type: string; label: string; action: string }[] = [];

    // Look for common suggestion patterns
    const suggestionPatterns = [
      /bạn có thể (.*?)(?:\.|$)/gi,
      /hãy thử (.*?)(?:\.|$)/gi,
      /nên (.*?)(?:\.|$)/gi
    ];

    suggestionPatterns.forEach(pattern => {
      const matches = aiContent.match(pattern);
      if (matches) {
        suggestions.push(...matches.map((m: string) => m.trim()));
      }
    });

    // Generate context-aware actions
    if (context.page === 'avatar-interview') {
      actions.push(
        { type: 'navigate', label: language === 'vi' ? 'Bắt đầu phỏng vấn' : 'Start Interview', action: '/avatar-interview' },
        { type: 'help', label: language === 'vi' ? 'Xem hướng dẫn chi tiết' : 'View Detailed Guide', action: 'show_avatar_guide' }
      );
    } else if (context.page === 'jd-analysis') {
      actions.push(
        { type: 'navigate', label: language === 'vi' ? 'Upload JD' : 'Upload JD', action: '/jd' },
        { type: 'help', label: language === 'vi' ? 'Xem ví dụ JD' : 'View JD Example', action: 'show_jd_example' }
      );
    } else if (context.page === 'quiz') {
      actions.push(
        { type: 'navigate', label: language === 'vi' ? 'Làm Quiz' : 'Take Quiz', action: '/quiz' },
        { type: 'help', label: language === 'vi' ? 'Xem lịch sử' : 'View History', action: 'show_quiz_history' }
      );
    }

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

export const getQuickHelpPrompts = (context: GlobalChatboxContext): string[] => {
  const prompts: { [key: string]: string[] } = {
    'avatar-interview': [
      'Cách bắt đầu phỏng vấn với avatar?',
      'Làm sao để chọn avatar phù hợp?',
      'Cách cài đặt ngôn ngữ và level?',
      'Troubleshooting lỗi voice/video'
    ],
    'jd-analysis': [
      'Cách upload file JD?',
      'Làm sao để tạo câu hỏi tốt?',
      'Cách chọn loại câu hỏi phù hợp?',
      'Tips viết JD hiệu quả'
    ],
    'quiz': [
      'Cách chọn quiz phù hợp?',
      'Giải thích scoring system',
      'Tips làm quiz hiệu quả',
      'Cách review kết quả'
    ],
    'dashboard': [
      'Giải thích các metrics',
      'Cách đọc skill assessment',
      'Tips cải thiện điểm số',
      'Cách set goals'
    ],
    'payment': [
      'So sánh các gói dịch vụ',
      'Hướng dẫn thanh toán',
      'Quản lý subscription',
      'Chính sách refund'
    ],
    'error': [
      'Cách khắc phục lỗi này?',
      'Có thể thử cách nào khác?',
      'Khi nào cần liên hệ support?'
    ]
  };

  return prompts[context.page || 'general'] || [
    'Hướng dẫn sử dụng platform',
    'Các tính năng chính',
    'Tips để có kết quả tốt nhất'
  ];
};

// Helper functions cho user preferences
export const createDefaultUserPreferences = (): GlobalChatboxContext['userPreferences'] => {
  return {
    language: 'en', // Mặc định là tiếng Anh
    responseStyle: 'detailed',
    technicalLevel: 'basic',
    tone: 'friendly'
  };
};

export const createUserContext = (
  page?: string,
  userLevel?: 'beginner' | 'intermediate' | 'advanced',
  customPreferences?: Partial<GlobalChatboxContext['userPreferences']>
): GlobalChatboxContext => {
  const defaultPrefs = createDefaultUserPreferences();
  
  return {
    page,
    userLevel: userLevel || 'beginner',
    userPreferences: { ...defaultPrefs, ...customPreferences } as Required<GlobalChatboxContext['userPreferences']>,
    previousQuestions: [],
    sessionDuration: 0
  };
};

// Function để cập nhật user preferences dựa trên behavior
export const updateUserPreferencesFromBehavior = (
  currentPreferences: GlobalChatboxContext['userPreferences'],
  userBehavior: {
    messageLength: number;
    technicalTerms: string[];
    responseTime: number;
    followUpQuestions: boolean;
  }
): GlobalChatboxContext['userPreferences'] => {
  const updated = { ...currentPreferences };
  
  // Điều chỉnh response style dựa trên độ dài tin nhắn
  if (userBehavior.messageLength > 100) {
    updated.responseStyle = 'detailed';
  } else if (userBehavior.messageLength < 30) {
    updated.responseStyle = 'concise';
  }
  
  // Điều chỉnh technical level dựa trên technical terms
  if (userBehavior.technicalTerms.length > 3) {
    updated.technicalLevel = 'advanced';
  } else if (userBehavior.technicalTerms.length === 0) {
    updated.technicalLevel = 'basic';
  }
  
  // Điều chỉnh tone dựa trên behavior
  if (userBehavior.followUpQuestions) {
    updated.tone = 'friendly';
  }
  
  return updated as Required<GlobalChatboxContext['userPreferences']>;
};

// Chatbot Settings Management
export const createDefaultChatbotSettings = (): ChatbotSettings => {
  return {
    language: 'en', // Fixed to English only
    responseStyle: 'detailed',
    technicalLevel: 'basic',
    tone: 'friendly',
    autoDetectLanguage: false, // Disable auto language detection
    enableSentimentAnalysis: true,
    enableContextMemory: true,
    maxResponseLength: 'medium',
    enableProactiveSuggestions: true,
    enableUserBehaviorTracking: true
  };
};

// Function để lưu settings vào localStorage
export const saveChatbotSettings = (settings: ChatbotSettings): void => {
  try {
    localStorage.setItem('chatbot-settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving chatbot settings:', error);
  }
};

// Function để load settings từ localStorage
export const loadChatbotSettings = (): ChatbotSettings => {
  try {
    const saved = localStorage.getItem('chatbot-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge với default settings để đảm bảo có đầy đủ properties
      return { ...createDefaultChatbotSettings(), ...parsed };
    }
  } catch (error) {
    console.error('Error loading chatbot settings:', error);
  }
  return createDefaultChatbotSettings();
};

// Function để reset settings về mặc định
export const resetChatbotSettings = (): ChatbotSettings => {
  const defaultSettings = createDefaultChatbotSettings();
  saveChatbotSettings(defaultSettings);
  return defaultSettings;
};

// Function để cập nhật một phần settings
export const updateChatbotSettings = (
  currentSettings: ChatbotSettings,
  updates: Partial<ChatbotSettings>
): ChatbotSettings => {
  const updated = { ...currentSettings, ...updates };
  saveChatbotSettings(updated);
  return updated;
};

// Function để apply settings vào context
export const applyChatboxSettingsToContext = (
  context: GlobalChatboxContext,
  settings: ChatbotSettings
): GlobalChatboxContext => {
  const updatedContext = { ...context };
  
  // Tạo userPreferences mặc định nếu chưa có
  const defaultPrefs = createDefaultUserPreferences();
  const currentPrefs = context.userPreferences ?? defaultPrefs;
  
  // Đảm bảo currentPrefs luôn có giá trị
  if (!currentPrefs) {
    updatedContext.userPreferences = defaultPrefs;
    return updatedContext;
  }
  
  // Fixed language to English only
  const language = 'en';
  
  // Apply tất cả settings vào userPreferences
  updatedContext.userPreferences = {
    language,
    responseStyle: settings.responseStyle ?? currentPrefs.responseStyle,
    technicalLevel: settings.technicalLevel ?? currentPrefs.technicalLevel,
    tone: settings.tone ?? currentPrefs.tone
  };
  
  return updatedContext;
};

// Add sendMessage function for the new chatbox
export const sendMessage = async (params: {
  message: string;
  context: any;
  language: string;
}) => {
  try {
    // Simple response for now - can be enhanced with actual AI processing
    const responses = [
      "I understand you're asking about that. Let me help you with that.",
      "That's a great question! Here's what I can tell you about it.",
      "I'd be happy to help you with that. Let me provide some information.",
      "Thanks for asking! Here's what I know about that topic.",
      "I can definitely help you with that. Let me explain.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      content: randomResponse,
      success: true
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return {
      content: "I'm sorry, I encountered an error. Please try again.",
      success: false
    };
  }
};
