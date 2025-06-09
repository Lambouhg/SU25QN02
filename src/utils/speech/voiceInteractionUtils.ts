import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export interface SpeechRecognitionError extends Error {
  code?: string;
  details?: string;
}

const createSpeechConfig = (language?: string) => {
  const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    console.error('Azure Speech credentials missing:', { 
      hasKey: !!speechKey, 
      hasRegion: !!speechRegion 
    });
    throw new Error("Azure Speech credentials are not configured. Please check your environment variables.");
  }

  try {
    const config = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    
    if (language) {
      config.speechRecognitionLanguage = language;
    }
    
    return config;
  } catch (err) {
    console.error('Error creating speech config:', err);
    throw new Error(`Failed to create speech config: ${typeof err === 'object' && err !== null && 'message' in err ? (err as Error).message : String(err)}`);
  }
};

const createSpeechError = (message: string, details?: unknown): SpeechRecognitionError => {
  const error: SpeechRecognitionError = new Error(message);
  error.details = typeof details === 'object' && details !== null && 'message' in details 
    ? (details as Error).message 
    : String(details);
  return error;
};

export const startVoiceRecognition = async (
  onResult: (text: string) => void, 
  onError: (err: SpeechRecognitionError) => void, 
  language = 'en-US'
): Promise<sdk.SpeechRecognizer | null> => {
  try {
    const sessionConfig = createSpeechConfig(language);
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(sessionConfig, audioConfig);

    // Setup all event handlers before starting recognition
    recognizer.recognized = (_, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
        const text = e.result.text.trim();
        if (text) {
          console.log('Recognition result:', text);
          onResult(text);
        }
      }
    };

    recognizer.recognizing = (_, e) => {
      if (e.result.reason === sdk.ResultReason.NoMatch) {
        console.log('No speech could be recognized');
      } else {
        console.log('Recognizing:', e.result.text);
      }
    };

    recognizer.canceled = (_, e) => {
      const error = createSpeechError('Voice recognition canceled');
      error.code = e.errorCode?.toString();
      error.details = e.errorDetails;
      
      console.log('Voice recognition canceled:', {
        reason: e.reason,
        errorCode: e.errorCode,
        errorDetails: e.errorDetails
      });
      
      if (e.reason === sdk.CancellationReason.Error) {
        onError(error);
      }
    };

    recognizer.sessionStarted = (_, e) => {
      console.log('Voice recognition session started:', e);
    };

    recognizer.sessionStopped = (_, e) => {
      console.log('Voice recognition session stopped:', e);
    };

    // Start continuous recognition and wait for it to be ready
    await new Promise<void>((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log("Voice recognition started successfully");
          resolve();
        },
        (err) => {
          console.error("Error starting voice recognition:", err);
          const error = createSpeechError('Failed to start voice recognition', err);
          onError(error);
          try {
            recognizer.close();
          } catch (closeErr) {
            console.error("Error closing recognizer after start error:", closeErr);
          }
          reject(err);
        }
      );
    });

    return recognizer;
  } catch (err) {
    console.error("Error in startVoiceRecognition:", err);
    const error = createSpeechError('Failed to initialize voice recognition', err);
    onError(error);
    return null;
  }
};

// Helper function to check if recognizer is disposed
const isRecognizerDisposed = (recognizer: sdk.SpeechRecognizer): boolean => {
  try {
    // Attempting to access any property will throw if disposed
    void recognizer.recognizing;
    return false;
  } catch {
    return true;
  }
};

export const stopVoiceRecognition = async (recognizer: sdk.SpeechRecognizer): Promise<void> => {
  if (!recognizer) {
    console.warn('No recognizer to stop');
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const cleanup = async () => {
      try {
        if (!isRecognizerDisposed(recognizer)) {
          // Remove all event handlers by setting them to no-op functions
          recognizer.recognized = () => {};
          recognizer.recognizing = () => {};
          recognizer.canceled = () => {};
          recognizer.sessionStarted = () => {};
          recognizer.sessionStopped = () => {};

          await new Promise<void>((resolveStop) => {
            recognizer.stopContinuousRecognitionAsync(
              () => {
                try {
                  recognizer.close();
                } catch (closeErr) {
                  console.debug("Recognizer close error (expected):", closeErr);
                }
                resolveStop();
              },
              (stopErr) => {
                console.debug("Stop recognition error (expected):", stopErr);
                try {
                  recognizer.close();
                } catch (closeErr) {
                  console.debug("Recognizer close error (expected):", closeErr);
                }
                resolveStop();
              }
            );
          });
        }
      } catch (err) {
        console.debug("Cleanup error (expected):", err);
      } finally {
        resolve();
      }
    };

    // Set a timeout to ensure cleanup happens even if the stop operation hangs
    const timeoutId = setTimeout(() => {
      cleanup().catch(console.error);
    }, 2000);

    cleanup().catch(console.error).finally(() => {
      clearTimeout(timeoutId);
    });
  });
};
