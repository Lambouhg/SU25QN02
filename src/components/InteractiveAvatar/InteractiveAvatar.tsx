import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import VideoPlayer from './subcomponents/VideoPlayer';
import ChatControls from './subcomponents/ChatControls';
import PreInterviewSetup from './subcomponents/PreInterviewSetup';
import VoiceInteraction from './subcomponents/VoiceInteraction';
import { AVATARS, STT_LANGUAGE_LIST, SessionState} from './HeygenConfig';
import { generateInterviewEvaluation } from '@/services/evaluationService';
import { ChatMessage } from '@/services/openaiService';
import { 
  AvatarQuality,
  VoiceEmotion,
  StartAvatarRequest,
  ElevenLabsModel,
} from '@heygen/streaming-avatar';
import { useMemoizedFn } from 'ahooks';
import { useConversation } from './hooks/useConversation';
import { useAvatarControl } from './hooks/useAvatarControl';
import { useAIConversation } from './hooks/useAIConversation';
import { useInterviewApi } from './hooks/useInterviewApi';
import { useInterviewSession } from './hooks/useInterviewSession';

// Local type definitions
interface ConversationMessage {
  id: string;
  sender: 'user' | 'ai' | 'system'; // Use string literals for now
  text: string;
  timestamp: string;
  isError?: boolean;
}

// API conversation message format for database
interface ApiConversationMessage {
  role: 'user' | 'ai' | 'system'; // Use string literals for now
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

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  voice: {
    rate: 1.0,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5
  },
  language: "vi",
};

// Định nghĩa hoặc import type Interview
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

interface InteractiveAvatarProps {
  onEndSession: (data: Interview) => void;
}

// Language list is already in the correct format
const transformedLanguageList = STT_LANGUAGE_LIST;

const InteractiveAvatar: React.FC<InteractiveAvatarProps> = ({ 
  onEndSession
}) => {
  const router = useRouter();
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [connectionQuality, setConnectionQuality] = useState('UNKNOWN');
  const [positions, setPositions] = useState<Position[]>([]);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [message, setMessage] = useState('');
  const [aiConversationHistory, setAiConversationHistory] = useState<ChatMessage[]>([]);
  const [positionKey, setPositionKey] = useState<string>(''); // Store key for AI
  const [positionType, setPositionType] = useState<string>(''); // Store type for AI
  const [positionId, setPositionId] = useState<string>(''); // Store _id for backend
  const [positionName, setPositionName] = useState<string>(''); // Store name for UI display
  const isPositionsFetching = useRef(false);

  const { fetchPositions, saveInterview } = useInterviewApi();

  // Thay thế các state liên quan đến session bằng hook useInterviewSession
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

  // Fetch positions once when component mounts
  useEffect(() => {
    const fetchPositionsOnce = async () => {
      if (isPositionsFetching.current) {
        return;
      }
      isPositionsFetching.current = true;
      try {
        const data: Position[] = await fetchPositions();
        setPositions(data);
      } catch (error) {
        console.error('❌ Error fetching positions:', error);
      } finally {
        isPositionsFetching.current = false;
      }
    };
    fetchPositionsOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, no dependencies

  // Add useEffect to handle auth state
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
    interviewState
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
    onInterviewComplete: (progress) => handleInterviewCompleteInternal(progress),
  
    language: config.language === 'vi' ? 'vi-VN' : 'en-US'
  });

  // Update AI conversation history when conversation changes
  useEffect(() => {
    const messages = conversation as unknown as ConversationMessage[];
    const convertedHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 
            msg.sender === 'ai' ? 'assistant' : 'system',
      content: msg.text
    }));
    setAiConversationHistory(convertedHistory);
  }, [conversation]);

  // Ensure interviewField and interviewLevel are selected before starting the session
  const initializeSession = useMemoizedFn(async () => {
    if (!positionKey) {
      console.error('Please select a position before starting the interview.');
      return;
    }

    try {
      setIsInterviewComplete(false);
      // Start timer
      setInterviewStartTime(new Date());
      setElapsedTime(0);
      
      // Start the avatar session
      await startSession(config);

      // Start interview with AI using field and level
      await aiStartNewInterview(
       positionKey, // Provide more context about the field
        positionType // e.g., "Senior"
      );
    } catch (error) {
      console.error('Error starting session:', error);
      addMessage('Failed to start session: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    }
  });

  const handleInterviewCompleteInternal = useCallback(async (progress: number) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setIsInterviewComplete(true);
    if (!isLoaded) {
      setIsSubmitting(false);
      return;
    }
    if (!isSignedIn || !userId) {
      router.push('/sign-in?redirect=/interview');
      setIsSubmitting(false);
      return;
    }
    const completionMessage = config.language === 'vi' 
      ? `Phỏng vấn đã hoàn thành với tiến độ ${progress}%. Cảm ơn bạn đã tham gia buổi phỏng vấn! Đang chuyển đến trang đánh giá...`
      : `Interview completed with progress ${progress}%. Thank you for participating in the interview! Redirecting to evaluation...`;
    try {
      addMessage(completionMessage, 'system');
      await speakText(completionMessage);
      const evaluation = await generateInterviewEvaluation(
        aiConversationHistory,
        positionKey,
        positionId,
        config.language === 'vi' ? 'vi-VN' : 'en-US'
      );
      // Transform conversation history for API
      const messages = conversation as unknown as ConversationMessage[];
      const apiConversation: ApiConversationMessage[] = messages.map(msg => ({
        role: msg.sender, // Now using InterviewMessageRole enum directly
        content: msg.text,
        timestamp: msg.timestamp // Already in ISO string format
      }));
      // Calculate interview duration in seconds using consistent timer
      const startTime = interviewStartTime || new Date(messages[0].timestamp);
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      // Get auth token
      const token = await getToken();
      // Create request data
      const requestData = {
        positionId,
        language: config.language === 'vi' ? 'vi-VN' : 'en-US',
        startTime: interviewStartTime || startTime, // Use consistent start time
        endTime,
        duration,
        conversationHistory: apiConversation,
        evaluation,
        questionCount: questionCount,
        coveredTopics: interviewState.coveredTopics,
        skillAssessment: interviewState.skillAssessment,
        progress,
        status: 'completed'  // Set status to completed
      };
      // Save interview results
      if (!token) throw new Error('No auth token');
      const savedInterview = await saveInterview(requestData, token);
      // Lấy id từ các trường có thể có trong response
      const interviewId = savedInterview.id || savedInterview._id || savedInterview.interviewId;
      if (!interviewId) throw new Error('Không lấy được id buổi phỏng vấn!');
      await endSession();
      setIsAvatarTalking(false);
      setMessage('');
      onEndSession({
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
      });
      // Không render overlay loading, không redirect, không render UI review ở đây nữa
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
    }
  }, [
    userId,
    isLoaded,
    isSignedIn,
    getToken,
    config,
    addMessage,
    speakText,
    aiConversationHistory,
    positionKey,
    positionId,
    conversation,
    endSession,
    onEndSession,
    router,
    questionCount,
    interviewState,
    isSubmitting, // Add isSubmitting to dependencies
    interviewStartTime,
    saveInterview,
    setIsInterviewComplete,
    setIsSubmitting,
    positionName,
    positionType
  ]);

  const handleInterruptAvatar = useCallback(async () => {
    try {
      if (isAvatarTalking && canInterrupt()) {
        await stopAvatarSpeaking();
      }
    } catch (error) {
      console.error('Error interrupting avatar:', error);
    }
  }, [isAvatarTalking, canInterrupt, stopAvatarSpeaking]);

  const handleEndSession = useCallback(async () => {
    try {
      // Step 1: Reset states first (following sample code pattern)
      setIsAvatarTalking(false);
      setMessage('');
      
      // Step 2: Stop avatar session
      await endSession();
      
      // Step 3: Clear conversation and add end message
      clearConversation();
      addMessage('Session ended', 'system');
      
      // Step 4: Reset timer (interview-specific cleanup)
      setInterviewStartTime(null);
      setElapsedTime(0);
      
      // Step 5: Notify parent component
      onEndSession({
        id: '', // No ID for a new session
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
      // Không render overlay loading, không render UI review ở đây nữa
      
    } catch (error) {
      console.error('Error ending session:', error);
      addMessage('Failed to end session properly: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
      // Even if there's an error, ensure cleanup
      setIsAvatarTalking(false);
      setMessage('');
      setInterviewStartTime(null);
      setElapsedTime(0);
    }
  }, [endSession, onEndSession, addMessage, clearConversation, userId, config.language, setElapsedTime, setInterviewStartTime]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isAvatarTalking || isThinking || isInterviewComplete) return;
    try {
      const textToSpeak = message;
      setMessage('');
      addMessage(textToSpeak, 'user');
      // Map conversation to ChatMessage format and pass to aiProcessMessage
      const mappedHistory = [...conversation, {
      id: '', // not needed for AI
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
    if (!text.trim()) {
      return;
    }
    if (isAvatarTalking) {
      return;
    }
    if (isInterviewComplete) {
      return;
    }
    addMessage(text, 'user');
    // Map conversation to ChatMessage format and pass to aiProcessMessage
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

  useEffect(() => {
    return () => {
      endSession().catch(console.error);
    };
  }, [endSession]);

  // Xóa overlay loading khỏi return
  return (
    <>
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* UI chính */}
        {/* ... giữ nguyên phần render UI cũ ... */}
        {sessionState === SessionState.INACTIVE ? (
          <PreInterviewSetup
            config={config}
            onConfigChange={setConfig}
            onStartInterview={initializeSession}
            sessionState={sessionState}
            AVATARS={AVATARS}
            STT_LANGUAGE_LIST={transformedLanguageList}
            interviewField={positionName} // Display positionName in UI
            interviewLevel={positionType}
            onFieldChange={(selectedPositionName) => {
              // When position name is selected, update display name
              setPositionName(selectedPositionName);
              // Don't set positionKey here, wait for level selection
            }}
            onLevelChange={setPositionType}
            onPositionIdChange={(id) => {
              setPositionId(id);
            }}
            onPositionKeyChange={setPositionKey} // Add new prop for setting the key
            positions={positions}
          />
        ) : (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <VideoPlayer
              videoRef={videoRef}
              connectionQuality={connectionQuality}
              sessionState={sessionState}
              avatarId={config.avatarName}
              avatarName={AVATARS.find(a => a.avatar_id === config.avatarName)?.name || ''}
              SessionState={SessionState}
              onStopSession={handleEndSession}
              onInterruptAvatar={handleInterruptAvatar}
              isAvatarTalking={isAvatarTalking}
              isInterrupting={isInterrupting}
              elapsedTime={formatElapsedTime(elapsedTime)}
            />
            <Box sx={{ p: 2 }}>
              <VoiceInteraction 
                onSpeechResult={handleSpeechResult}
                disabled={sessionState !== SessionState.CONNECTED || isInterviewComplete || isSubmitting}
                language={config.language === 'en' ? 'en-US' : 'vi-VN'}
                isAvatarTalking={isAvatarTalking}
              />
            </Box>
            <ChatControls
              sessionState={sessionState}
              inputText={message}
              setInputText={setMessage}
              isAvatarTalking={isAvatarTalking}
              conversation={conversation}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
              isInterviewComplete={isInterviewComplete}
              questionCount={questionCount}
              skillAssessment={interviewState.skillAssessment}
              coveredTopics={interviewState.coveredTopics}
              progress={interviewState.progress || 0}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default InteractiveAvatar;
