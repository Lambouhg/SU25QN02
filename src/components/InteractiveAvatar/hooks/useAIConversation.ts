import { useState, useCallback } from 'react';
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

interface UseAIConversationProps {
  onAnswer: (text: string) => Promise<void>;
  onError: (error: string) => void;
  onFollowUpQuestion?: (question: string) => void;
  onInterviewComplete?: (progress: number) => void;
  language: 'en-US' | 'vi-VN';
}

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
  language
}: UseAIConversationProps) => {
  const [isThinking, setIsThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewState, setInterviewState] = useState<InterviewState>(initialInterviewState);

  const updateInterviewState = useCallback((response: InterviewResponse) => {
    if (response.completionDetails) {
      setInterviewState(prev => ({
        coveredTopics: response.completionDetails?.coveredTopics || prev.coveredTopics,
        skillAssessment: response.completionDetails?.skillAssessment || prev.skillAssessment,
        progress: response.interviewProgress
      }));

      // Check if interview is complete
      if (response.isInterviewComplete && onInterviewComplete) {
        onInterviewComplete(response.interviewProgress);
      }
    }
  }, [onInterviewComplete]);

  const startNewInterview = useCallback(async (field: string, level: string) => {
    setIsThinking(true);

    try {
      // Reset all states
      setConversationHistory([]);
      setQuestionCount(0);
      setInterviewState(initialInterviewState);

      // Set initial system context
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `Position: ${field} at ${level} level\nLanguage: ${language}`
      };
      setConversationHistory([systemMessage]);

      // Get initial question from AI
      const response = await startInterview({
        field,
        level,
        language
      });

      if (!response || !response.answer) {
        throw new Error('Failed to get initial question');
      }

      // Process initial response
      updateInterviewState(response);
      await onAnswer(response.answer);
      setQuestionCount(1);

    } catch (error) {
      console.error('Error starting interview:', error);
      onError(language === 'vi-VN' 
        ? 'Không thể bắt đầu phỏng vấn. Vui lòng thử lại.'
        : 'Could not start the interview. Please try again.');
    } finally {
      setIsThinking(false);
    }
  }, [language, onAnswer, onError, updateInterviewState]);

  
  const processMessage = useCallback(
    async (text: string, externalHistory?: ChatMessage[]): Promise<void> => {
      if (!text.trim()) return;

      // Use externalHistory if provided, otherwise use local state
      const baseHistory = externalHistory ?? conversationHistory;

      setIsThinking(true);
      try {
        // Add user message to history if not already present (only if using local state)
        let updatedHistory: ChatMessage[];
        if (externalHistory) {
          updatedHistory = externalHistory;
        } else {
          const nextUserMessage: ChatMessage = {
            role: 'user',
            content: text
          };
          updatedHistory = [...baseHistory, nextUserMessage];
        }
        
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

        // Update question count
        setQuestionCount(prev => prev + 1);

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
      updateInterviewState
    ]
  );

  return {
    isThinking,
    processMessage,
    startNewInterview,
    questionCount,
    interviewState
  };
};
