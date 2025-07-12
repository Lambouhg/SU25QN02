import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import VideoPlayer from './VideoPlayer';
import ChatControls from './ChatControls';
import PreInterviewSetup from './PreInterviewSetup';
import VoiceInteraction from './VoiceInteraction';
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

// Local type definitions
type MessageType = 'user' | 'ai' | 'system';

interface Message {
  text: string;
  timestamp: number;
  isError?: boolean;
}

interface ConversationMessage extends Message {
  type: MessageType;
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

interface InteractiveAvatarProps {
  onEndSession: () => void;
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
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [message, setMessage] = useState('');
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [aiConversationHistory, setAiConversationHistory] = useState<ChatMessage[]>([]);
  const [positionKey, setPositionKey] = useState<string>(''); // Store key for AI
  const [positionType, setPositionType] = useState<string>(''); // Store type for AI
  const [positionId, setPositionId] = useState<string>(''); // Store _id for backend

  // Debug position state changes
  useEffect(() => {
    console.log('Position state updated:', { positionKey, positionType, positionId });
  }, [positionKey, positionType, positionId]);

  // Add useEffect to handle auth state
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log('User not signed in, redirecting to sign in page');
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
    speakText
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
      console.log('AI response:', text);
      addMessage(text, 'ai');
      console.log('Current conversation:', conversation);
      await speakText(text);
    },
    onError: (error: string) => {
      console.error('AI error:', error);
      addMessage(error, 'system', true);
    },
    onFollowUpQuestion: (question: string) => {
      console.log('Follow-up question:', question);
      addMessage(question, 'system');
    },
    onInterviewComplete: (progress) => handleInterviewCompleteInternal(progress),
  
    language: config.language === 'vi' ? 'vi-VN' : 'en-US'
  });

  // Update AI conversation history when conversation changes
  useEffect(() => {
    const messages = conversation as unknown as ConversationMessage[];
    const convertedHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : msg.type === 'ai' ? 'assistant' : 'system',
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
    setIsInterviewComplete(true);
    
    if (!isLoaded) {
      console.log('Auth state is still loading...');
      return;
    }
    
    if (!isSignedIn || !userId) {
      console.log('User not signed in. Auth state:', { isLoaded, isSignedIn, userId });
      router.push('/sign-in?redirect=/interview');
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
        positionKey, // Use key for evaluation
        positionId,
        config.language === 'vi' ? 'vi-VN' : 'en-US'
      );

      const messages = conversation as unknown as ConversationMessage[];
      const apiConversation = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : msg.type === 'ai' ? 'assistant' : 'system',
        content: msg.text,
        timestamp: msg.timestamp
      }));

      // Get auth token for request
      const token = await getToken();
      console.log('Making API request with auth:', { hasUserId: !!userId, hasToken: !!token });

      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId, // Include userId for validation
          positionId, // Save only the position ID
          language: config.language === 'vi' ? 'vi-VN' : 'en-US',
          startTime: new Date(conversation[0]?.timestamp || Date.now()),
          endTime: new Date(),
          conversationHistory: apiConversation,
          evaluation,
          progress,
          questionCount,
          coveredTopics: interviewState.coveredTopics,
          skillAssessment: interviewState.skillAssessment,
          status: 'completed' as const
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', { status: response.status, errorData });
        throw new Error(`Failed to save interview data: ${errorData?.error || response.statusText}`);
      }

      const savedInterview = await response.json();
      localStorage.setItem('currentInterviewId', savedInterview._id);
      
      await endSession();
      setIsAvatarTalking(false);
      setMessage('');
      onEndSession();
      router.push('/interview-review');
    } catch (error) {
      console.error('Error during interview completion:', error);
      addMessage(
        config.language === 'vi'
          ? 'Đã xảy ra lỗi khi lưu kết quả phỏng vấn. Vui lòng kiểm tra đăng nhập và thử lại.'
          : 'Error saving interview results. Please check your login and try again.',
        'system',
        true
      );
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
    interviewState
  ]);

  const handleEndSession = useCallback(async () => {
    try {
      await endSession();
      setIsAvatarTalking(false);
      setMessage('');
      clearConversation();
      addMessage('Session ended', 'system');
      onEndSession();
    } catch (error) {
      console.error('Error ending session:', error);
      addMessage('Failed to end session properly: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    }
  }, [endSession, onEndSession, addMessage, clearConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isAvatarTalking || isThinking || isInterviewComplete) return;

    try {
      const textToSpeak = message;
      setMessage('');
      addMessage(textToSpeak, 'user');
      await aiProcessMessage(textToSpeak);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Gửi tin nhắn thất bại: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    }
  }, [message, isAvatarTalking, isThinking, isInterviewComplete, addMessage, aiProcessMessage]);

  const handleSpeechResult = useCallback((text: string) => {
    if (!text.trim() || isAvatarTalking || isInterviewComplete) return;
    addMessage(text, 'user');
    aiProcessMessage(text).catch((error: Error) => {
      console.error('Error processing speech with AI:', error);
      addMessage('Failed to process speech: ' + error.message, 'system', true);
    });
  }, [isAvatarTalking, isInterviewComplete, addMessage, aiProcessMessage]);

  useEffect(() => {
    return () => {
      endSession().catch(console.error);
    };
  }, [endSession]);

  if (sessionState === SessionState.INACTIVE) {
    return (
      <PreInterviewSetup
        config={config}
        onConfigChange={setConfig}
        onStartInterview={initializeSession}
        sessionState={sessionState}
        AVATARS={AVATARS}
        STT_LANGUAGE_LIST={transformedLanguageList}
        interviewField={positionKey}
        interviewLevel={positionType}
        onFieldChange={setPositionKey}
        onLevelChange={setPositionType}
        onPositionIdChange={(id) => {
          console.log('Position ID changed:', id);
          setPositionId(id);
        }}
      />
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <VideoPlayer
        videoRef={videoRef}
        connectionQuality={connectionQuality}
        sessionState={sessionState}
        avatarId={config.avatarName}
        avatarName={AVATARS.find(a => a.avatar_id === config.avatarName)?.name || ''}
        SessionState={SessionState}
        onStopSession={handleEndSession}
        onStopavatar={() => setIsAvatarTalking(false)}
      />
      <Box sx={{ p: 2 }}>
        <VoiceInteraction 
          onSpeechResult={handleSpeechResult}
          disabled={sessionState !== SessionState.CONNECTED || isInterviewComplete}
          language={config.language === 'en' ? 'en-US' : 'vi-VN'}
          isAvatarTalking={isAvatarTalking}
        />
      </Box>      <ChatControls
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
  );
};

export default InteractiveAvatar;
