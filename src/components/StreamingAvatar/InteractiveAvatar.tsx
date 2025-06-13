import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import VideoPlayer from './VideoPlayer';
import ChatControls from './ChatControls';
import PreInterviewSetup from './PreInterviewSetup';
import VoiceInteraction from './VoiceInteraction';
import { AVATARS, STT_LANGUAGE_LIST, SessionState} from './HeygenConfig';
import StreamingAvatar, { 
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion,
  StartAvatarRequest,
  ElevenLabsModel,
  TaskType
} from '@heygen/streaming-avatar';
import { useMemoizedFn } from 'ahooks';
import { ChatMessage } from '@/services/openaiService';
import { processInterviewResponse, startInterview } from '@/services/azureAiService';

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

// Unique message ID counter
let messageCounter = 0;

const generateMessageId = () => {
  return `${Date.now()}_${++messageCounter}`;
};

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isError?: boolean;
  isPartial?: boolean;
}

interface InteractiveAvatarProps {
  onEndSession: () => void;
}

// Language list is already in the correct format
const transformedLanguageList = STT_LANGUAGE_LIST; // Already has {code, name} format

const InteractiveAvatar: React.FC<InteractiveAvatarProps> = ({ onEndSession }) => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.INACTIVE);
  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [interviewField, setInterviewField] = useState<string>('frontend');
  const [interviewLevel, setInterviewLevel] = useState<string>('junior');
  const [connectionQuality, setConnectionQuality] = useState('UNKNOWN');
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [aiConversationHistory, setAiConversationHistory] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar>(null);  const addMessage = useMemoizedFn((text: string, sender: string, isError = false) => {
    setConversation(prev => [...prev, {
      id: generateMessageId(),
      sender,
      text,
      timestamp: new Date().toISOString(),
      isError
    }]);
  });

  const fetchAccessToken = async () => {
    try {
      const response = await fetch('/api/heygen-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to get token');
      }
      const token = await response.text();
      return token;
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
    }
  };  const handleTranscriptUpdate = useCallback((text: string) => {
    if (text) {
      // Find and update or add partial message
      setConversation(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.isPartial) {
          return [...prev.slice(0, -1), { ...lastMsg, text }];
        }
        return [...prev, {
          id: generateMessageId(),
          sender: 'user',
          text,
          timestamp: new Date().toISOString(),
          isPartial: true
        }];
      });
    }
  }, []);

  const initAvatar = useCallback(async (token: string) => {
    try {
      const avatar = new StreamingAvatar({
        token,
        basePath: process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.heygen.com'
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('>>>>> Stream ready:', event.detail);
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          setSessionState(SessionState.CONNECTED);
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('>>>>> Stream disconnected');
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          setSessionState(SessionState.INACTIVE);
        }
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log('>>>>> Avatar started talking', e);
        setIsAvatarTalking(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log('>>>>> Avatar stopped talking', e);
        setIsAvatarTalking(false);
      });

      avatar.on(StreamingEvents.CONNECTION_QUALITY_CHANGED, (e) => {
        setConnectionQuality(e.detail);
      });      avatar.on(StreamingEvents.USER_START, () => {
        // Remove any existing partial messages
        setConversation(prev => prev.filter(msg => !msg.isPartial));
      });

      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        handleTranscriptUpdate(event.detail.text);
      });

      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        if (event.detail.text) {
          // Remove any partial messages and add the final one
          setConversation(prev => [
            ...prev.filter(msg => !msg.isPartial),
            {
              id: generateMessageId(),
              sender: 'user',
              text: event.detail.text,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      });

      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, () => {
        // Optionally handle partial avatar responses
      });

      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        if (event.detail.text) {
          addMessage(event.detail.text, 'ai');
        }
      });

      avatar.on('error', (error) => {
        console.error('Avatar error:', error);
        addMessage(error.message, 'system', true);
        setSessionState(SessionState.INACTIVE);
      });

      avatarRef.current = avatar;
      return avatar;
    } catch (error) {
      console.error('Error initializing avatar:', error);
      throw error;
    }
  }, [handleTranscriptUpdate, addMessage]);
  
  const startSession = useMemoizedFn(async () => {
    try {
      setSessionState(SessionState.CONNECTING);
      const token = await fetchAccessToken();
      const avatar = await initAvatar(token);
      
      console.log('Starting avatar with config:', config);
      await avatar.createStartAvatar(config);      // Start interview with AI greeting
      const initialResponse = await startInterview({
        field: interviewField,
        level: interviewLevel,
        language: config.language === 'vi' ? 'vi-VN' : 'en-US'
      });
      
      // Add AI greeting to conversation
      addMessage(initialResponse.answer, 'ai');
      
      // Make avatar speak the greeting
      await avatar.speak({
        text: initialResponse.answer,
        taskType: TaskType.REPEAT
      });

    } catch (error) {
      console.error('Error starting session:', error);
      addMessage('Failed to start session: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
      setSessionState(SessionState.INACTIVE);
    }
  });

  const endSession = useCallback(async () => {
    try {
      if (avatarRef.current) {
        await avatarRef.current.stopAvatar();
        avatarRef.current = null;
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      setSessionState(SessionState.INACTIVE);
      setIsAvatarTalking(false);
      setMessage('');
      setConversation([]);
      addMessage('Session ended', 'system');
      onEndSession();
    } catch (error) {
      console.error('Error ending session:', error);
      addMessage('Failed to end session properly: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    }
  }, [onEndSession, addMessage]);
  const processMessageWithAI = useCallback(async (text: string) => {
    try {
      setIsThinking(true);
      
      // Add user message to AI conversation history
      const userMessage: ChatMessage = { role: 'user', content: text };
      setAiConversationHistory(prev => [...prev, userMessage]);

      // Process with Azure OpenAI
      const aiResponse = await processInterviewResponse(
        text, 
        aiConversationHistory,
        config.language === 'vi' ? 'vi-VN' : 'en-US'
      );

      // Add AI response to conversation history
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: aiResponse.answer 
      };
      setAiConversationHistory(prev => [...prev, assistantMessage]);

      // Make avatar speak the AI response
      if (avatarRef.current && !isAvatarTalking) {
        await avatarRef.current.speak({
          text: aiResponse.answer,
          taskType: TaskType.REPEAT
        });
      }

      // Add the response to the UI conversation
      addMessage(aiResponse.answer, 'ai');

      // If there is a follow-up question, add it as a system message
      if (aiResponse.followUpQuestion) {
        addMessage(aiResponse.followUpQuestion, 'system');
      }
    } catch (error) {
      console.error('Error processing message with AI:', error);
      addMessage('Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.', 'system', true);
    } finally {
      setIsThinking(false);
    }
  }, [aiConversationHistory, isAvatarTalking, addMessage, config.language]);
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !avatarRef.current || isAvatarTalking || isThinking) return;

    try {
      const textToSpeak = message;
      setMessage(''); // Clear input first

      // Add message to conversation
      const newMessage = {
        id: generateMessageId(),
        sender: 'user',
        text: textToSpeak,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, newMessage]);

      // Process with AI and get response
      await processMessageWithAI(textToSpeak);

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Gửi tin nhắn thất bại: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    }
  }, [message, isAvatarTalking, isThinking, addMessage, processMessageWithAI, avatarRef]);
  const handleSpeechResult = useCallback((text: string) => {
    if (!text.trim() || !avatarRef.current || isAvatarTalking) return;

    // Add user's speech to conversation
    const newMessage = {
      id: generateMessageId(),
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    };
    setConversation(prev => [...prev, newMessage]);

    // Process with AI and get response
    processMessageWithAI(text).catch(error => {
      console.error('Error processing speech with AI:', error);
      addMessage('Failed to process speech: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    });
  }, [isAvatarTalking, addMessage, processMessageWithAI, avatarRef]);

  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        endSession();
      }
    };
  }, [endSession]);
  if (sessionState === SessionState.INACTIVE) {    return (
      <PreInterviewSetup
        config={config}
        onConfigChange={setConfig}
        onStartInterview={startSession}
        sessionState={sessionState}
        AVATARS={AVATARS}
        STT_LANGUAGE_LIST={transformedLanguageList}
        interviewField={interviewField}
        interviewLevel={interviewLevel}
        onFieldChange={setInterviewField}
        onLevelChange={setInterviewLevel}
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
        onStopSession={endSession}
      />
      <Box sx={{ p: 2 }}>
        <VoiceInteraction 
          onSpeechResult={handleSpeechResult}
          disabled={sessionState !== SessionState.CONNECTED}
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
      />
    </Box>
  );
};

export default InteractiveAvatar;
