import { useState, useCallback, useRef, useEffect } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { startVoiceRecognition, stopVoiceRecognition, SpeechRecognitionError } from '@/utils/speech/voiceInteractionUtils';

interface UseAzureVoiceInteractionProps {
  onSpeechResult: (text: string) => void;
  onError?: (error: string) => void;
  onInterimResult?: (text: string) => void;
  language?: 'vi-VN' | 'en-US';
  silenceTimeout?: number;
}

export const useAzureVoiceInteraction = ({
  onSpeechResult,
  onError,
  onInterimResult,
  language = 'vi-VN',
  silenceTimeout = 3000
}: UseAzureVoiceInteractionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');

  const clearSilenceTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    clearSilenceTimeout();

    if (isFinal) {
      // Append to accumulated transcript
      transcriptRef.current = (transcriptRef.current + ' ' + text).trim();
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        if (transcriptRef.current) {
          onSpeechResult(transcriptRef.current);
          transcriptRef.current = '';
        }
      }, silenceTimeout);
    } else {
      // Update interim results
      onInterimResult?.(text);
    }
  }, [onSpeechResult, onInterimResult, silenceTimeout, clearSilenceTimeout]);

  const stopRecognizer = useCallback(async () => {
    clearSilenceTimeout();
    
    if (recognizerRef.current) {
      await stopVoiceRecognition(recognizerRef.current);
      recognizerRef.current = null;
    }

    // Send any remaining transcript
    if (transcriptRef.current) {
      onSpeechResult(transcriptRef.current);
      transcriptRef.current = '';
    }
  }, [onSpeechResult, clearSilenceTimeout]);

  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      const msg = language === 'vi-VN' 
        ? 'Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt' 
        : 'Please allow microphone access in browser settings';
      onError?.(msg);
      return false;
    }
  }, [language, onError]);

  const startListening = useCallback(async () => {
    const hasMicPermission = await checkMicrophonePermission();
    if (!hasMicPermission) return;

    setIsInitializing(true);
    
    try {
      // Stop any existing recognizer
      await stopRecognizer();

      // Reset transcript
      transcriptRef.current = '';

      // Start new recognition
      const newRecognizer = await startVoiceRecognition(
        (text) => handleSpeechResult(text, true),
        (error: SpeechRecognitionError) => {
          const errorMessage = error.message || (language === 'vi-VN'
            ? 'Lỗi nhận dạng giọng nói. Vui lòng thử lại.'
            : 'Speech recognition failed. Please try again.');
          onError?.(errorMessage);
          setIsListening(false);
          setIsInitializing(false);
        },
        language
      );

      if (newRecognizer) {
        recognizerRef.current = newRecognizer;
        setIsListening(true);
      }
    } catch (error) {
      const msg = language === 'vi-VN'
        ? `Không thể khởi tạo nhận dạng giọng nói: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
        : `Could not initialize speech recognition: ${error instanceof Error ? error.message : 'Unknown error'}`;
      onError?.(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [language, onError, stopRecognizer, handleSpeechResult, checkMicrophonePermission]);

  const stopListening = useCallback(async () => {
    setIsListening(false);
    setIsInitializing(false);
    await stopRecognizer();
  }, [stopRecognizer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimeout();
      if (recognizerRef.current) {
        stopVoiceRecognition(recognizerRef.current).catch(console.error);
      }
    };
  }, [clearSilenceTimeout]);

  return {
    isListening,
    isInitializing,
    startListening,
    stopListening
  };
};
