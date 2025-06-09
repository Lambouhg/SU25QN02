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
  const [isStopping, setIsStopping] = useState(false);
  const [isAutoMicEnabled, setIsAutoMicEnabled] = useState(true);
  const [recognizer, setRecognizer] = useState<sdk.SpeechRecognizer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopListening = useCallback(async () => {
    if (!recognizer || isStopping) return;

    setError(null);
    setIsStopping(true);
    try {
      await stopVoiceRecognition(recognizer);
    } finally {
      setRecognizer(null);
      setIsListening(false);
      setIsStopping(false);
    }
  }, [recognizer, isStopping]);

  const startListening = useCallback(async () => {
    if (disabled || (isAutoMicEnabled && isAvatarTalking) || isStopping) return;

    // Stop any existing recognition first
    if (recognizer) {
      await stopListening();
    }
    
    setIsInitializing(true);
    setError(null);

    try {
      const speechRecognizer = await startVoiceRecognition(
        (text) => {
          console.log('Speech recognized:', text);
          onSpeechResult(text);
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setError(error.message || 'Speech recognition failed');
          setIsListening(false);
          setRecognizer(null);
        },
        language
      );

      if (speechRecognizer) {
        setRecognizer(speechRecognizer);
        setIsListening(true);
      } else {
        throw new Error('Failed to initialize speech recognition');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start speech recognition');
      setIsListening(false);
      setRecognizer(null);
    } finally {
      setIsInitializing(false);
    }
  }, [disabled, isAvatarTalking, isStopping, language, onSpeechResult, recognizer, stopListening, isAutoMicEnabled]);

  const toggleListening = useCallback(() => {
    setIsAutoMicEnabled(false); // Disable auto mode when manually toggling
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognizer) {
        stopVoiceRecognition(recognizer).catch(console.error);
      }
    };
  }, [recognizer]);

  // Handle avatar talking state changes
  useEffect(() => {
    if (isAutoMicEnabled) {
      if (isAvatarTalking && isListening) {
        // Stop listening when avatar starts talking
        stopListening().catch(console.error);
      } else if (!isAvatarTalking && !isListening && !disabled) {
        // Start listening when avatar stops talking
        startListening().catch(console.error);
      }
    }
  }, [isAvatarTalking, isListening, disabled, stopListening, startListening, isAutoMicEnabled]);

  const getTooltipTitle = () => {
    if (isInitializing) return 'Initializing speech recognition...';
    if (error) return error;
    if (isListening) return language === 'vi-VN' ? 'Dừng nghe' : 'Stop listening';
    return language === 'vi-VN' ? 'Bắt đầu nghe' : 'Start listening';
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title={getTooltipTitle()}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={toggleListening}
            disabled={disabled || (isAutoMicEnabled && isAvatarTalking) || isInitializing}
            color={error ? 'error' : isListening ? 'secondary' : 'default'}
            sx={{ position: 'relative' }}
          >
            {isInitializing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isListening ? <MicIcon /> : <MicOffIcon />
            )}
          </IconButton>
          {isListening && (
            <CircularProgress
              size={44}
              color="secondary"
              sx={{
                position: 'absolute',
                top: -2,
                left: -2,
                opacity: 0.3,
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
