import React, { useCallback, useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { startVoiceRecognition, stopVoiceRecognition } from '@/utils/speech/voiceInteractionUtils';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface VoiceInteractionProps {
  onSpeechResult: (text: string) => void;
  disabled?: boolean;
  language?: 'vi-VN' | 'en-US';
  isAvatarTalking?: boolean;
}

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
  onSpeechResult,
  disabled = false,
  language = 'vi-VN',
  isAvatarTalking = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [recognizer, setRecognizer] = useState<sdk.SpeechRecognizer | null>(null);
  const [error, setError] = useState<string | null>(null);  const stopRecognizer = useCallback(async () => {
    if (!recognizer) return;
    
    // Ngắt kết nối ngay lập tức
    recognizer.recognized = () => {};
    recognizer.recognizing = () => {};
    recognizer.canceled = () => {};
    recognizer.sessionStarted = () => {};
    recognizer.sessionStopped = () => {};

    try {
      await stopVoiceRecognition(recognizer);
    } catch (err) {
      console.error('Error stopping recognition:', err);
      const msg = language === 'vi-VN'
        ? 'Lỗi khi dừng micro. Vui lòng thử lại.'
        : 'Error stopping microphone. Please try again.';
      setError(msg);
    } finally {
      setRecognizer(null);
    }
  }, [recognizer, language]);

  const stopListening = useCallback(async () => {
    console.log('Stopping listening...');
    // Reset state immediately
    setIsListening(false);
    setIsInitializing(false);
    setError(null);

    // Cleanup recognizer after state reset
    await stopRecognizer();
  }, [stopRecognizer]);
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;    } catch (err) {
      if (err instanceof Error) {
        const msg = language === 'vi-VN' 
          ? 'Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt' 
          : 'Please allow microphone access in browser settings';
        setError(msg);
      }
      return false;
    }
  }, [language]);
  const startListening = useCallback(async () => {
    if (disabled || isAvatarTalking) return;
    
    // Check microphone permission first
    const hasMicPermission = await checkMicrophonePermission();
    if (!hasMicPermission) return;

    setIsInitializing(true);
    setError(null);
    
    try {
      // Make sure any existing recognizer is stopped
      await stopRecognizer();

      const speechRecognizer = await startVoiceRecognition(
        (text) => {
          console.log('Speech recognized:', text);
          onSpeechResult(text);
        },
        (error) => {
          console.error('Speech recognition error:', error);
          const msg = language === 'vi-VN'
            ? 'Lỗi nhận dạng giọng nói. Vui lòng thử lại.'
            : 'Speech recognition failed. Please try again.';
          setError(msg);
          setIsListening(false);
          setIsInitializing(false);
          setRecognizer(null);
        },
        language
      );

      if (speechRecognizer) {
        setRecognizer(speechRecognizer);
        setIsListening(true);
      } else {
        throw new Error(language === 'vi-VN' 
          ? 'Không thể khởi tạo nhận dạng giọng nói' 
          : 'Failed to initialize speech recognition');
      }
    } catch (err) {
      console.error('Start listening error:', err);
      const msg = language === 'vi-VN'
        ? 'Không thể bắt đầu nhận dạng giọng nói. Vui lòng thử lại.'
        : 'Could not start speech recognition. Please try again.';
      setError(msg);
      setIsListening(false);
      setRecognizer(null);
    } finally {
      setIsInitializing(false);
    }
  }, [disabled, isAvatarTalking, language, onSpeechResult, stopRecognizer, checkMicrophonePermission]);  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognizer) {
        stopListening().catch(console.error);
      }
    };
  }, [recognizer, stopListening]);

  // Stop listening when avatar starts talking
  useEffect(() => {
    if (isAvatarTalking && isListening) {
      stopListening().catch(console.error);
    }
  }, [isAvatarTalking, isListening, stopListening]);

  const getTooltipTitle = () => {
    if (isInitializing) return language === 'vi-VN' ? 'Đang khởi tạo...' : 'Initializing...';
    if (error) return error;
    if (isListening) return language === 'vi-VN' ? 'Dừng nghe' : 'Stop listening';
    return language === 'vi-VN' ? 'Bắt đầu nghe' : 'Start listening';
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>      <Tooltip title={getTooltipTitle()}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={toggleListening}
            // Only disable when trying to turn ON the mic
            disabled={!isListening && (disabled || isAvatarTalking)}
            color={error ? 'error' : isListening ? 'secondary' : 'default'}
            sx={{ position: 'relative' }}
          >
            {isInitializing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isListening ? <MicIcon /> : <MicOffIcon />
            )}
          </IconButton>
          {(isListening || isInitializing) && (
            <CircularProgress
              size={44}
              color="secondary"
              sx={{
                position: 'absolute',
                top: -2,
                left: -2,
                opacity: 0.3,
                animation: isInitializing ? 'none' : undefined,
              }}
            />
          )}
        </Box>
      </Tooltip>
      <Tooltip title={isSpeakerOn ? 'Tắt loa' : 'Bật loa'}>
        <IconButton
          onClick={toggleSpeaker}
          disabled={disabled}
          color={isSpeakerOn ? 'primary' : 'default'}
        >
          {isSpeakerOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default VoiceInteraction;
