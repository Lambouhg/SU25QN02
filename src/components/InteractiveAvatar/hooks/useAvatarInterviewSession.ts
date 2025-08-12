import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useConversation } from './useConversation';
import { useAvatarControl } from './useAvatarControl';
import { useAIConversation } from './useAIConversation';
import { useInterviewApi } from './useInterviewApi';
import { useInterviewSession } from './useInterviewSession';
import { generateInterviewEvaluation } from '@/services/evaluationService';
import { AVATARS } from '../HeygenConfig';
import { ChatMessage } from '@/services/openaiService';
import { AvatarQuality, VoiceEmotion, StartAvatarRequest, ElevenLabsModel } from '@heygen/streaming-avatar';

// Local type definitions
interface ConversationMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface ApiConversationMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

interface Position {
  id: string;
  key: string;
  positionName: string;
  level: string;
  displayName: string;
  order: number;
}

export interface Interview {
  id: string;
  userId: string;
  positionId: string;
  position: {
    positionName: string;
    level: string;
    displayName: string;
  };
  language: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: string;
  progress: number;
  questionCount: number;
  coveredTopics: string[];
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  evaluation?: {
    overallRating: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    recommendations?: string[];
  };
  skillAssessment?: Record<string, number>;
}

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  voice: {
    rate: 1.0,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5
  },
  language: 'vi',
};

export function useAvatarInterviewSession({ onEndSession }: { onEndSession: (data: Interview) => void }) {
  const router = useRouter();
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [connectionQuality, setConnectionQuality] = useState('UNKNOWN');
  const [positions, setPositions] = useState<Position[]>([]);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [message, setMessage] = useState('');
  const [aiConversationHistory, setAiConversationHistory] = useState<ChatMessage[]>([]);
  const [positionKey, setPositionKey] = useState<string>('');
  const [positionType, setPositionType] = useState<string>('');
  const [positionId, setPositionId] = useState<string>('');
  const [positionName, setPositionName] = useState<string>('');
  const [pendingInterviewEnd, setPendingInterviewEnd] = useState<null | { progress: number; reason?: string }>(null);
  const [isSavingInterview, setIsSavingInterview] = useState(false);
  const [isInitializingInterview, setIsInitializingInterview] = useState(false);
  const isPositionsFetching = useRef(false);

  const { fetchPositions, saveInterview } = useInterviewApi();
  const {
    isInterviewComplete,
    setIsInterviewComplete,
    isSubmitting,
    setIsSubmitting,
    interviewStartTime,
    setInterviewStartTime,
    elapsedTime,
    setElapsedTime,
    formatElapsedTime,
  } = useInterviewSession();

  useEffect(() => {
    const fetchPositionsOnce = async () => {
      if (isPositionsFetching.current) return;
      isPositionsFetching.current = true;
      try {
        const data: Position[] = await fetchPositions();
        setPositions(data);
      } catch (error) {
        console.error('Error fetching positions:', error);
      } finally {
        isPositionsFetching.current = false;
      }
    };
    fetchPositionsOnce();
  }, [fetchPositions]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=/interview');
    }
  }, [isLoaded, isSignedIn, router]);

  const {
    conversation,
    addMessage,
    updateTranscript,
    finalizeTranscript,
    clearPartialMessages,
    clearConversation
  } = useConversation();

  const {
    sessionState,
    videoRef,
    startSession,
    endSession,
    speakText,
    stopAvatarSpeaking,
    canInterrupt,
    isInterrupting
  } = useAvatarControl({
    onAvatarTalkingChange: setIsAvatarTalking,
    onConnectionQualityChange: setConnectionQuality,
    onTranscriptUpdate: updateTranscript,
    onTranscriptFinalize: finalizeTranscript,
    onTranscriptStart: clearPartialMessages,
    onAvatarMessage: (text) => addMessage(text, 'ai'),
    onError: (message) => addMessage(message, 'system', true)
  });



  const {
    isThinking,
    processMessage: aiProcessMessage,
    startNewInterview: aiStartNewInterview,
    questionCount,
    interviewState,
    autoPromptCount,
    isAutoPromptActive,
    resetAutoPrompt,
    startAutoPromptTimer,
    clearAutoPromptTimer,
    resetInterviewSession
  } = useAIConversation({
    onAnswer: async (text: string) => {
      addMessage(text, 'ai');
      await speakText(text);
    },
    onError: (error: string) => {
      console.error('AI error:', error);
      addMessage(error, 'system', true);
    },
    onFollowUpQuestion: (question: string) => {
      addMessage(question, 'system');
    },
    onInterviewComplete: (result) => {
      // Set interview as complete
      setIsInterviewComplete(true);
      // Nếu kết thúc do auto-prompt timeout thì thêm reason
      if (result && typeof result === 'object' && result.progress === 100 && !result.reason) {
        setPendingInterviewEnd({ ...result, reason: 'timeout' });
      } else {
        setPendingInterviewEnd(result);
      }
    },
    language: config.language === 'vi' ? 'vi-VN' : 'en-US',
    isInterviewComplete: isInterviewComplete
  });


  // Effect: Start auto-prompt timer only after avatar stops talking
  const prevIsAvatarTalking = useRef(isAvatarTalking);

  // Đặt handleEndSession lên trước để tránh lỗi hoisting

  useEffect(() => {
    // Khi avatar vừa chuyển từ nói sang im lặng, bắt đầu auto-prompt timer
    if (prevIsAvatarTalking.current && !isAvatarTalking && !isThinking && !isInterviewComplete) {
      // Chỉ start auto-prompt timer nếu phỏng vấn chưa kết thúc
      startAutoPromptTimer();
    }
    // Nếu avatar bắt đầu nói lại, clear timer
    if (isAvatarTalking) {
      clearAutoPromptTimer();
    }
    // Nếu phỏng vấn đã kết thúc, clear timer
    if (isInterviewComplete) {
      clearAutoPromptTimer();
    }
    prevIsAvatarTalking.current = isAvatarTalking;
  }, [isAvatarTalking, isThinking, isInterviewComplete, startAutoPromptTimer, clearAutoPromptTimer]);

  // Reset auto-prompt timer khi user trả lời (gọi resetAutoPrompt như cũ)

  useEffect(() => {
    const messages = conversation as unknown as ConversationMessage[];
    const convertedHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 
            msg.sender === 'ai' ? 'assistant' : 'system',
      content: msg.text
    }));
    setAiConversationHistory(convertedHistory);
  }, [conversation]);

  const initializeSession = useCallback(async () => {
    // Kiểm tra điều kiện bắt buộc
    if (!positionName || !positionType) {
      addMessage('Vui lòng chọn đầy đủ vị trí và cấp bậc trước khi bắt đầu phỏng vấn.', 'system', true);
      return;
    }
    setIsInitializingInterview(true);
    try {
      setIsInterviewComplete(false);
      setInterviewStartTime(new Date());
      setElapsedTime(0);
      await startSession(config);
      
      // Normalize position name for AI to avoid confusion
      const normalizedPosition = positionName
        .replace(/\s*Developer?\s*/gi, '') // Remove "Developer" or "Dev"
        .replace(/\s*Engineer?\s*/gi, '') // Remove "Engineer"
        .trim();
      
      console.log('Starting interview with normalized position:', normalizedPosition, 'level:', positionType);
      await aiStartNewInterview(normalizedPosition, positionType);
    } catch (error) {
      console.error('Error starting session:', error);
      addMessage('Failed to start session: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    } finally {
      setIsInitializingInterview(false);
    }
  }, [positionName, positionType, setIsInterviewComplete, setInterviewStartTime, setElapsedTime, startSession, config, aiStartNewInterview, addMessage]);

  const handleInterviewCompleteInternal = useCallback(async (progress: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
   // Bắt đầu loading lưu kết quả
    setIsInterviewComplete(true);
    if (!isLoaded) {
      setIsSubmitting(false);
      setIsSavingInterview(false);
      return;
    }
    if (!isSignedIn || !userId) {
      router.push('/sign-in?redirect=/interview');
      setIsSubmitting(false);
      setIsSavingInterview(false);
      return;
    }
    try {
      const evaluation = await generateInterviewEvaluation(
        aiConversationHistory,
        positionName,  // Use positionName instead of positionKey
        positionType,  // Use positionType as level
        config.language === 'vi' ? 'vi-VN' : 'en-US'
      );
      const messages = conversation as unknown as ConversationMessage[];
      // Ensure every message has a valid timestamp string
      const apiConversation: ApiConversationMessage[] = messages.map(msg => ({
        role: msg.sender,
        content: msg.text,
        timestamp: (msg.timestamp && typeof msg.timestamp === 'string') ? msg.timestamp : new Date().toISOString()
      }));
      // Fallback for startTime if missing or invalid
      let startTime: Date;
      if (interviewStartTime) {
        startTime = interviewStartTime;
      } else if (messages[0] && messages[0].timestamp && !isNaN(Date.parse(messages[0].timestamp))) {
        startTime = new Date(messages[0].timestamp);
      } else {
        startTime = new Date();
      }
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const token = await getToken();
      const requestData = {
        positionId,
        language: config.language === 'vi' ? 'vi-VN' : 'en-US',
        startTime: interviewStartTime || startTime,
        endTime,
        duration,
        conversationHistory: apiConversation,
        evaluation,
        questionCount: questionCount,
        coveredTopics: interviewState.coveredTopics,
        skillAssessment: interviewState.skillAssessment,
        progress,
        status: 'completed'
      };
      setIsSavingInterview(true); 
      if (!token) throw new Error('No auth token');
      console.log('Saving interview with data:', requestData);
      const savedInterview = await saveInterview(requestData, token);
      console.log('Saved interview response:', savedInterview);
      const interviewId = savedInterview.id || savedInterview._id || savedInterview.interviewId;
      if (!interviewId) {
        console.error('Interview response:', savedInterview);
        throw new Error('Không lấy được id buổi phỏng vấn!');
      }
      await endSession();
      setIsAvatarTalking(false);
      setMessage('');
      
      // Tự động chuyển đến trang evaluation sau khi lưu thành công
      // Thêm delay ngắn để người dùng thấy thông báo "Đã lưu thành công"
      console.log('Redirecting to evaluation page with interviewId:', interviewId);
      setTimeout(() => {
        const evaluationUrl = `/avatar-interview/evaluation?id=${interviewId}`;
        console.log('Navigating to:', evaluationUrl);
        // Sử dụng window.location.href để đảm bảo chuyển hướng hoạt động
        window.location.href = evaluationUrl;
      }, 1000);
      
      // Gọi onEndSession sau khi đã setup chuyển hướng
      const interviewData = {
        id: interviewId || '',
        userId: userId || '',
        positionId: positionId || '',
        position: {
          positionName: positionName || '',
          level: positionType || '',
          displayName: positionName || ''
        },
        language: config.language || '',
        startTime: (interviewStartTime || startTime) ?? new Date(),
        endTime: endTime ?? new Date(),
        duration: duration ?? 0,
        status: 'completed',
        progress: progress ?? 0,
        questionCount: questionCount ?? 0,
        coveredTopics: interviewState.coveredTopics ?? [],
        conversationHistory: apiConversation ?? [],
        evaluation: evaluation,
        skillAssessment: interviewState.skillAssessment
      };
      
      // Gọi onEndSession với data để component cha có thể xử lý
      onEndSession(interviewData);
    } catch (error) {
      console.error('Error during interview completion:', error);
      addMessage(
        config.language === 'vi'
          ? 'Đã xảy ra lỗi khi lưu kết quả phỏng vấn. Vui lòng kiểm tra đăng nhập và thử lại.'
          : 'Error saving interview results. Please check your login and try again.',
        'system',
        true
      );
    } finally {
      setIsSubmitting(false);
      setIsSavingInterview(false); // Kết thúc loading lưu kết quả
    }
  }, [isSubmitting, setIsSubmitting, setIsInterviewComplete, isLoaded, isSignedIn, userId, router, aiConversationHistory, positionName, positionId, config, conversation, interviewStartTime, getToken, saveInterview, questionCount, interviewState, endSession, setIsAvatarTalking, setMessage, onEndSession, positionType, addMessage]);


  // Đặt handleEndSession lên trước để tránh lỗi hoisting
  const isEndingSession = useRef(false);

  const handleEndSession = useCallback(async () => {
    if (isEndingSession.current) return;
    isEndingSession.current = true;
    try {
      if (isAvatarTalking && stopAvatarSpeaking) {
        await stopAvatarSpeaking();
        // Đợi một chút để đảm bảo avatar đã dừng hoàn toàn
        await new Promise(res => setTimeout(res, 300));
      }
      resetInterviewSession();
      setIsAvatarTalking(false);
      setMessage('');
      await endSession();
      clearConversation();
      addMessage('Session ended', 'system');
      setInterviewStartTime(null);
      setElapsedTime(0);
      onEndSession({
        id: '',
        userId: userId || '',
        positionId: '',
        position: {
          positionName: '',
          level: '',
          displayName: ''
        },
        language: config.language || '',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        status: 'cancelled',
        progress: 0,
        questionCount: 0,
        coveredTopics: [],
        conversationHistory: [],
        evaluation: undefined,
        skillAssessment: undefined
      });
    } catch (error) {
      console.error('Error ending session:', error);
      addMessage('Failed to end session properly: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
      setIsAvatarTalking(false);
      setMessage('');
      setInterviewStartTime(null);
      setElapsedTime(0);
    }
  }, [isAvatarTalking, stopAvatarSpeaking, resetInterviewSession, endSession, onEndSession, addMessage, clearConversation, userId, config.language, setElapsedTime, setInterviewStartTime]);

  useEffect(() => {
    if (pendingInterviewEnd !== null && !isAvatarTalking) {
      const timeout = setTimeout(async () => {
        if (pendingInterviewEnd.reason === 'timeout') {
          // Gọi handleEndSession để reset toàn bộ UI và state như khi nhấn nút End Session
          await handleEndSession();
        } else {
          handleInterviewCompleteInternal(pendingInterviewEnd.progress);
        }
        setPendingInterviewEnd(null);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [pendingInterviewEnd, isAvatarTalking, handleInterviewCompleteInternal, handleEndSession]);

  const handleInterruptAvatar = useCallback(async () => {
    try {
      if (isAvatarTalking && canInterrupt()) {
        await stopAvatarSpeaking();
      }
    } catch (error) {
      console.error('Error interrupting avatar:', error);
    }
  }, [isAvatarTalking, canInterrupt, stopAvatarSpeaking]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isAvatarTalking || isThinking || isInterviewComplete) return;
    try {
      const textToSpeak = message;
      setMessage('');
      addMessage(textToSpeak, 'user');
      const mappedHistory = [...conversation, {
        id: '',
        sender: 'user',
        text: textToSpeak,
        timestamp: new Date().toISOString()
      }].map(msg => ({
        role: msg.sender === 'user' ? 'user' : msg.sender === 'ai' ? 'assistant' : 'system' as 'user' | 'assistant' | 'system',
        content: msg.text
      }));
      await aiProcessMessage(textToSpeak, mappedHistory);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Gửi tin nhắn thất bại: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    }
  }, [message, isAvatarTalking, isThinking, isInterviewComplete, addMessage, aiProcessMessage, conversation]);

  const handleSpeechResult = useCallback((text: string) => {
    if (!text.trim()) return;
    if (isAvatarTalking) return;
    if (isInterviewComplete) return;
    addMessage(text, 'user');
    const mappedHistory = [...conversation, {
      id: '',
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    }].map(msg => ({
      role: msg.sender === 'user' ? 'user' : msg.sender === 'ai' ? 'assistant' : 'system' as 'user' | 'assistant' | 'system',
      content: msg.text
    }));
    setTimeout(() => {
      aiProcessMessage(text, mappedHistory).catch((error) => {
        console.error('Error processing speech with AI:', error);
        addMessage('Failed to process speech: ' + error.message, 'system', true);
      });
    }, 0);
  }, [isAvatarTalking, isInterviewComplete, addMessage, aiProcessMessage, conversation]);

  return {
    config, setConfig,
    connectionQuality,
    positions,
    isAvatarTalking,
    message, setMessage,
    aiConversationHistory,
    positionKey, setPositionKey,
    positionType, setPositionType,
    positionId, setPositionId,
    positionName, setPositionName,
    pendingInterviewEnd, setPendingInterviewEnd,
    isInterviewComplete,
    isSubmitting,
    interviewStartTime,
    elapsedTime,
    formatElapsedTime,
    sessionState,
    videoRef,
    initializeSession,
    handleEndSession,
    handleSendMessage,
    handleSpeechResult,
    conversation,
    addMessage,
    isThinking,
    interviewState,
    questionCount,
    handleInterruptAvatar,
    canInterrupt,
    isInterrupting,
    isSavingInterview,
    isInitializingInterview,
    // Auto-prompt states
    autoPromptCount,
    isAutoPromptActive,
    resetAutoPrompt,
  }; 
} 