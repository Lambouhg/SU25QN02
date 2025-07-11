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
  // No maxQuestions parameter needed anymore
  language?: 'en-US' | 'vi-VN';
}

export const useAIConversation = ({
  onAnswer,
  onError,
  onFollowUpQuestion,
  onInterviewComplete,  language = 'en-US' as const
}: UseAIConversationProps) => {
  const [isThinking, setIsThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [questionCount, setQuestionCount] = useState(0);  const [interviewState, setInterviewState] = useState<InterviewState>({
    coveredTopics: [],
    skillAssessment: {
      technical: 0,
      communication: 0,
      problemSolving: 0
    },
    progress: 0
  });

  const updateInterviewState = useCallback((response: InterviewResponse) => {
    if (response.completionDetails) {      setInterviewState(prev => ({
        coveredTopics: response.completionDetails?.coveredTopics || prev.coveredTopics,
        skillAssessment: response.completionDetails?.skillAssessment || prev.skillAssessment,
        progress: response.interviewProgress
      }));
    }
  }, []);

  const startNewInterview = useCallback(async (field: string, level: string) => {
    console.log('Starting new interview with:', { field, level });
    // Reset state
    setConversationHistory([]);
    try {
      setIsThinking(true);
      setQuestionCount(0);      setInterviewState({
        coveredTopics: [],
        skillAssessment: {
          technical: 0,
          communication: 0,
          problemSolving: 0
        },
        progress: 0
      });

      const systemMessage: ChatMessage = {
        role: 'system',
        content: `Position: ${field} at ${level} level\nLanguage: ${language}`
      };

      setConversationHistory([systemMessage]);

      const initialResponse = await startInterview({
        field,
        level,
        language
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: initialResponse.answer
      };
      setConversationHistory(prev => [...prev, assistantMessage]);

      updateInterviewState(initialResponse);
      await onAnswer(initialResponse.answer);
      
      return initialResponse;
    } catch (error) {
      console.error('Error starting interview:', error);
      onError('Failed to start interview: ' + (error instanceof Error ? error.message : String(error)));
      throw error;
    } finally {
      setIsThinking(false);
    }
  }, [language, onAnswer, onError, updateInterviewState]);
  const processMessage = useCallback(async (text: string) => {
    try {
      setIsThinking(true);
      
      const nextUserMessage: ChatMessage = {
        role: 'user',
        content: text
      };

      setConversationHistory(prev => [...prev, nextUserMessage]);
      const response = await processInterviewResponse(text, conversationHistory, language);

      const nextAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer
      };
      setConversationHistory(prev => [...prev, nextAssistantMessage]);

      setQuestionCount(prev => prev + 1);
      updateInterviewState(response);
      
      if (response.followUpQuestion && onFollowUpQuestion) {
        onFollowUpQuestion(response.followUpQuestion);
      }

      await onAnswer(response.answer);

      if (response.isInterviewComplete && onInterviewComplete) {
        onInterviewComplete(response.interviewProgress);
      }

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError(errorMessage);
      throw error;
    } finally {
      setIsThinking(false);
    }
  }, [conversationHistory, language, onAnswer, onError, onFollowUpQuestion, onInterviewComplete, updateInterviewState]);

  const clearConversation = useCallback(() => {
    setConversationHistory([]);
    setQuestionCount(0);    setInterviewState({
      coveredTopics: [],
      skillAssessment: {
        technical: 0,
        communication: 0,
        problemSolving: 0
      },
      progress: 0
    });
  }, []);

  return {
    isThinking,
    conversationHistory,
    questionCount,
    interviewState,
    startNewInterview,
    processMessage,
    clearConversation
  };
};
