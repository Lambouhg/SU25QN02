import { useRef, useState, useCallback } from 'react';
import StreamingAvatar, {
  StreamingEvents,
  StartAvatarRequest,
  TaskType
} from '@heygen/streaming-avatar';

// Define event types
type StreamReadyEvent = CustomEvent<MediaStream>;
type UserTalkingMessageEvent = CustomEvent<{ text: string }>;
type UserEndMessageEvent = CustomEvent<{ text: string }>;
type AvatarEndMessageEvent = CustomEvent<{ text: string }>;
type ConnectionQualityChangedEvent = CustomEvent<string>;
import { SessionState } from '../HeygenConfig';

interface UseAvatarControlProps {
  onAvatarTalkingChange: (isTalking: boolean) => void;
  onConnectionQualityChange: (quality: string) => void;
  onTranscriptUpdate: (text: string) => void;
  onTranscriptFinalize: (text: string) => void;
  onTranscriptStart: () => void;
  onAvatarMessage: (text: string) => void;
  onError: (message: string) => void;
}

export const useAvatarControl = ({
  onAvatarTalkingChange,
  onConnectionQualityChange,
  onTranscriptUpdate,
  onTranscriptFinalize,
  onTranscriptStart,
  onAvatarMessage,
  onError
}: UseAvatarControlProps) => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.INACTIVE);
  const avatarRef = useRef<StreamingAvatar>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
  };
  // Initialize avatar with event handlers
  const initAvatar = useCallback(async (token: string): Promise<StreamingAvatar> => {
    try {
      const avatar = new StreamingAvatar({
        token,
        basePath: process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.heygen.com'
      });      avatar.on(StreamingEvents.STREAM_READY, (event: StreamReadyEvent) => {
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

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        onAvatarTalkingChange(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        onAvatarTalkingChange(false);
      });

      avatar.on(StreamingEvents.CONNECTION_QUALITY_CHANGED, (e: ConnectionQualityChangedEvent) => {
        onConnectionQualityChange(e.detail);
      });

      avatar.on(StreamingEvents.USER_START, () => {
        onTranscriptStart();
      });

      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event: UserTalkingMessageEvent) => {
        onTranscriptUpdate(event.detail.text);
      });

      avatar.on(StreamingEvents.USER_END_MESSAGE, (event: UserEndMessageEvent) => {
        if (event.detail.text) {
          onTranscriptFinalize(event.detail.text);
        }
      });

      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event: AvatarEndMessageEvent) => {
        if (event.detail.text) {
          onAvatarMessage(event.detail.text);
        }
      });

      avatar.on('error', (error) => {
        console.error('Avatar error:', error);
        onError(error.message);
        setSessionState(SessionState.INACTIVE);
      });

      avatarRef.current = avatar;
      return avatar;
    } catch (error) {
      console.error('Error initializing avatar:', error);
      throw error;
    }
  }, [
    onAvatarTalkingChange,
    onConnectionQualityChange,
    onTranscriptStart,
    onTranscriptUpdate,
    onTranscriptFinalize,
    onAvatarMessage,
    onError
  ]);
  const startSession = useCallback(async (config: StartAvatarRequest) => {
    try {
      setSessionState(SessionState.CONNECTING);
      const token = await fetchAccessToken();
      const avatar = await initAvatar(token);
      
      console.log('Starting avatar with config:', config);
      await avatar.createStartAvatar(config);
      
      // Don't return avatar instance since we manage it internally
      return;
    } catch (error) {
      console.error('Error starting session:', error);
      setSessionState(SessionState.INACTIVE);
      throw error;
    }
  }, [initAvatar]);

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
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (avatarRef.current) {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.REPEAT
      });
    }
  }, []);

  return {
    sessionState,
    videoRef,
    startSession,
    endSession,
    speakText
  };
};
