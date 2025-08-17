import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '@/services/openaiService';
import { processInterviewResponse, startInterview, InterviewResponse } from '@/services/Avatar-AI';

interface InterviewState {
  coveredTopics: string[];
  skillAssessment: {
    technical: number;
    communication: number;
    problemSolving: number;
  };
  progress: number;
}

interface InterviewCompleteResult {
  progress: number;
  reason?: string;
}

interface UseAIConversationProps {
  onAnswer: (text: string) => Promise<void>;
  onError: (error: string) => void;
  onFollowUpQuestion?: (question: string) => void;
  onInterviewComplete?: (result: InterviewCompleteResult) => void;
  onEndSession?: () => void; // callback cleanup Heygen/avatar session khi auto-prompt kết thúc
  language: 'en-US' | 'vi-VN';
  isInterviewComplete?: boolean; // Trạng thái phỏng vấn từ bên ngoài
}

// Constants for auto-prompt feature
const AUTO_PROMPT_DELAY = 30000; // 20 seconds
const MAX_AUTO_PROMPTS = 3; // Maximum number of auto prompts before ending interview

// Initial state for interview metrics
const initialInterviewState: InterviewState = {
  coveredTopics: [],
  skillAssessment: {
    technical: 1,
    communication: 1,
    problemSolving: 1
  },
  progress: 0
};

export const useAIConversation = ({
  onAnswer,
  onError,
  onFollowUpQuestion,
  onInterviewComplete,
  onEndSession,
  language,
  isInterviewComplete = false
}: UseAIConversationProps) => {
  const [isThinking, setIsThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewState, setInterviewState] = useState<InterviewState>(initialInterviewState);
  
  // Auto-prompt states
  const [autoPromptCount, setAutoPromptCount] = useState(0);
  const autoPromptCountRef = useRef(0);
  const autoPromptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTime = useRef<number>(Date.now());

  // Keep autoPromptCountRef in sync with state
  useEffect(() => {
    autoPromptCountRef.current = autoPromptCount;
  }, [autoPromptCount]);

  // Clear auto-prompt timer
  const clearAutoPromptTimer = useCallback(() => {
    if (autoPromptTimerRef.current) {
      clearTimeout(autoPromptTimerRef.current);
      autoPromptTimerRef.current = null;
    }
  }, []);

  // Reset toàn bộ session/phỏng vấn như khi nhấn End Session ở useAvatarInterviewSession
  const resetInterviewSession = useCallback(() => {
    clearAutoPromptTimer();
    setAutoPromptCount(0);
    setConversationHistory([]);
    setQuestionCount(0);
    setInterviewState(initialInterviewState);
    setIsThinking(false);
    // Nếu có message state ở ngoài, callback sẽ reset tiếp
    // Nếu cần reset thêm state khác, thêm vào đây
  }, [clearAutoPromptTimer]);

  // Start auto-prompt timer (public, only call sau khi avatar dừng nói)
  const startAutoPromptTimer = useCallback(() => {
    clearAutoPromptTimer();
    autoPromptTimerRef.current = setTimeout(async () => {
      const currentCount = autoPromptCountRef.current;
      
      // Check if interview is already complete - if so, don't send auto-prompt
      if (isInterviewComplete || interviewState.progress >= 100) {
        clearAutoPromptTimer();
        setAutoPromptCount(0);
        return;
      }
      
      // Check if maximum auto prompts reached
      if (currentCount >= MAX_AUTO_PROMPTS) {
        // Khi hết auto-prompt, cleanup session như nút End Session, không lưu kết quả
        resetInterviewSession();
        if (onEndSession) {
          onEndSession();
        }
        return;
      }

      // Generate AI-powered auto-prompt message
      try {
        const promptInstructions = language === 'vi-VN' 
          ? `INSTRUCTION: Ứng viên chưa trả lời câu hỏi sau ${AUTO_PROMPT_DELAY/1000} giây. Đây là lần nhắc nhở thứ ${currentCount + 1}/${MAX_AUTO_PROMPTS}. Hãy tạo ra MỘT lời nhắc nhở ngắn gọn, thân thiện để khuyến khích ứng viên trả lời. ${currentCount === 0 ? 'Lần đầu tiên nên nhẹ nhàng.' : currentCount === 1 ? 'Lần thứ hai nên rõ ràng hơn.' : 'Lần cuối cùng nên quyết đoán nhưng lịch sự.'}`
          : `INSTRUCTION: The candidate hasn't answered after ${AUTO_PROMPT_DELAY/1000} seconds. This is prompt ${currentCount + 1}/${MAX_AUTO_PROMPTS}. Generate ONE brief, friendly reminder to encourage the candidate to respond. ${currentCount === 0 ? 'First time should be gentle.' : currentCount === 1 ? 'Second time should be clearer.' : 'Final time should be decisive but polite.'}`;

        const response = await processInterviewResponse(promptInstructions, conversationHistory, language);
        setAutoPromptCount(prev => {
          autoPromptCountRef.current = prev + 1;
          return prev + 1;
        });
        await onAnswer(response.answer);

        // If this was the last allowed prompt, end interview immediately
        if (currentCount + 1 >= MAX_AUTO_PROMPTS) {
          clearAutoPromptTimer();
          setAutoPromptCount(0);
          if (onInterviewComplete) {
            onInterviewComplete({ progress: 100 });
          }
          if (onEndSession) {
            onEndSession();
          }
        } else {
        // Không tự động start lại timer ở đây nữa, chỉ start lại khi avatar dừng nói (bên ngoài gọi)
        }
      } catch (error) {
        console.error('Error generating AI auto-prompt:', error);
        // Fallback to default messages if AI fails
        const promptMessages = language === 'vi-VN' ? [
          'Bạn có cần thêm thời gian để suy nghĩ không? Hãy chia sẻ suy nghĩ của bạn.',
          'Tôi hiểu câu hỏi này có thể khó. Bạn có thể trả lời theo cách hiểu của mình.',
          'Đây là lần cuối tôi hỏi lại. Bạn có muốn tiếp tục phỏng vấn không?'
        ] : [
          'Do you need more time to think? Please share your thoughts.',
          'I understand this question might be challenging. You can answer based on your understanding.',
          'This is my final prompt. Would you like to continue the interview?'
        ];

        const promptMessage = promptMessages[currentCount] || promptMessages[promptMessages.length - 1];
        setAutoPromptCount(prev => {
          autoPromptCountRef.current = prev + 1;
          return prev + 1;
        });
        await onAnswer(promptMessage);

        // If this was the last allowed prompt, end interview immediately
        if (currentCount + 1 >= MAX_AUTO_PROMPTS) {
          clearAutoPromptTimer();
          setAutoPromptCount(0);
          if (onInterviewComplete) {
            onInterviewComplete({ progress: 100 });
          }
        } else {
        // Không tự động start lại timer ở đây nữa, chỉ start lại khi avatar dừng nói (bên ngoài gọi)
        }
      }
    }, AUTO_PROMPT_DELAY);
  }, [language, onAnswer, onInterviewComplete, clearAutoPromptTimer, conversationHistory, onEndSession, resetInterviewSession, autoPromptCountRef, interviewState.progress, isInterviewComplete]);

  // Reset auto-prompt when user responds
  const resetAutoPrompt = useCallback(() => {
    console.log('Resetting auto-prompt. Current count:', autoPromptCount);
    clearAutoPromptTimer();
    setAutoPromptCount(0);
    lastActivityTime.current = Date.now();
  }, [clearAutoPromptTimer, autoPromptCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAutoPromptTimer();
    };
  }, [clearAutoPromptTimer]);

  const updateInterviewState = useCallback((response: InterviewResponse) => {
    if (response.completionDetails) {
      setInterviewState(prev => ({
        coveredTopics: response.completionDetails?.coveredTopics || prev.coveredTopics,
        skillAssessment: response.completionDetails?.skillAssessment || prev.skillAssessment,
        progress: response.interviewProgress
      }));

      // Check if interview is complete
      if (response.isInterviewComplete && onInterviewComplete) {
        clearAutoPromptTimer(); // Clear timer when interview completes
        setAutoPromptCount(0); // Reset auto prompt count
        onInterviewComplete({ progress: response.interviewProgress });
        return; // Exit early to prevent further processing
      }
    }
  }, [onInterviewComplete, clearAutoPromptTimer]);

  const startNewInterview = useCallback(async (field: string, level: string, specialization?: string, minExperience?: number, maxExperience?: number) => {
    setIsThinking(true);
    resetAutoPrompt(); // Reset auto-prompt for new interview

    try {
      // Reset all states
      setConversationHistory([]);
      setQuestionCount(0);
      setInterviewState(initialInterviewState);
      setAutoPromptCount(0);

      // Set initial system context with detailed logging
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `Position: ${field}${specialization ? ` - ${specialization}` : ''} at ${level} level\nExperience: ${minExperience !== undefined && maxExperience !== undefined ? `${minExperience}-${maxExperience} years` : 'unspecified'}\nLanguage: ${language}`
      };
      
      console.log('🎯 Starting interview with field:', field, 'specialization:', specialization, 'level:', level, 'experience:', `${minExperience}-${maxExperience} years`);
      console.log('📝 System message created:', systemMessage.content);
      
      setConversationHistory([systemMessage]);

      // Get initial question from AI
      const response = await startInterview({
        field,
        level,
        language,
        specialization,
        minExperience,
        maxExperience
      });

      if (!response || !response.answer) {
        throw new Error('Failed to get initial question');
      }

      console.log('🤖 AI Initial response:', response.answer);
      console.log('📊 Response details:', { currentTopic: response.currentTopic, progress: response.interviewProgress });

      // Process initial response
      updateInterviewState(response);
      await onAnswer(response.answer);
      
      // Set initial question count to 0 since this is just the greeting/introduction
      // AI will manage the actual question count based on meaningful questions asked
      setQuestionCount(0);
      
        // Không tự động start auto-prompt timer ở đây nữa, chỉ start khi avatar dừng nói (bên ngoài gọi)

    } catch (error) {
      console.error('Error starting interview:', error);
      onError(language === 'vi-VN' 
        ? 'Không thể bắt đầu phỏng vấn. Vui lòng thử lại.'
        : 'Could not start the interview. Please try again.');
    } finally {
      setIsThinking(false);
    }
  }, [language, onAnswer, onError, updateInterviewState, resetAutoPrompt]);

  
  const processMessage = useCallback(
    async (text: string, externalHistory?: ChatMessage[]): Promise<void> => {
      if (!text.trim()) return;

      // Reset auto-prompt when user responds
      resetAutoPrompt();

      // Use externalHistory if provided, otherwise use local state
      const baseHistory = externalHistory ?? conversationHistory;
      
      // Ensure system message is preserved when using external history
      let updatedHistory: ChatMessage[];
      if (externalHistory) {
        // Check if external history has system message
        const hasSystemMessage = externalHistory.some(msg => msg.role === 'system');
        console.log('🔍 External history check - has system message:', hasSystemMessage);
        console.log('📝 External history length:', externalHistory.length);
        
        if (!hasSystemMessage && conversationHistory.length > 0) {
          // Add our system message from local history
          const systemMessage = conversationHistory.find(msg => msg.role === 'system');
          if (systemMessage) {
            updatedHistory = [systemMessage, ...externalHistory];
            console.log('✅ Added system message to external history:', systemMessage.content);
          } else {
            updatedHistory = externalHistory;
            console.log('⚠️ No system message found in local history');
          }
        } else {
          updatedHistory = externalHistory;
          if (hasSystemMessage) {
            const systemMsg = externalHistory.find(msg => msg.role === 'system');
            console.log('✅ Using existing system message:', systemMsg?.content);
          }
        }
      } else {
        // Add user message to local history
        const nextUserMessage: ChatMessage = {
          role: 'user',
          content: text
        };
        updatedHistory = [...baseHistory, nextUserMessage];
        console.log('📝 Using local history with user message');
      }
      
      setIsThinking(true);
      try {
        setConversationHistory(updatedHistory);

        // Process response with updated history
        const response = await processInterviewResponse(text, updatedHistory, language);

        if (!response || !response.answer) {
          throw new Error('Failed to get AI response');
        }

        // Add AI response to history
        const nextAssistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.answer
        };
        setConversationHistory(prev => [...prev, nextAssistantMessage]);

        // Update interview state
        updateInterviewState(response);
        await onAnswer(response.answer);

        // Handle follow-up question if present
        if (response.followUpQuestion && onFollowUpQuestion) {
          onFollowUpQuestion(response.followUpQuestion);
        }

        // Use question count from AI response instead of manual calculation
        // AI knows exactly how many technical questions have been asked
        setQuestionCount(response.questionCount || 0);
        
        // Không tự động start auto-prompt timer ở đây nữa, chỉ start khi avatar dừng nói (bên ngoài gọi)

      } catch (error) {
        console.error('Error processing message:', error);
        onError(
          language === 'vi-VN'
            ? 'Có lỗi xảy ra khi xử lý câu trả lời. Vui lòng thử lại.'
            : 'Error processing your answer. Please try again.'
        );
      } finally {
        setIsThinking(false);
      }
    },
    [
      language,
      conversationHistory,
      onAnswer,
      onError,
      onFollowUpQuestion,
      updateInterviewState,
      resetAutoPrompt
    ]
  );

  return {
    isThinking,
    processMessage,
    startNewInterview,
    questionCount,
    interviewState,
    // Auto-prompt states
    autoPromptCount,
    isAutoPromptActive: autoPromptTimerRef.current !== null,
    resetAutoPrompt,
    startAutoPromptTimer,
    clearAutoPromptTimer,
    resetInterviewSession
  };
};
