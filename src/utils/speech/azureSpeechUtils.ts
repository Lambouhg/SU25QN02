import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

if (!process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || !process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION) {
  throw new Error("Azure Speech credentials are not configured");
}

// Log configuration (remove in production)
console.log('Speech Config:', {
  region: process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION,
  keyLength: process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY?.length
});

// Create speech config
const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
  process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
);

// Set security options
speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");
speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "1000");
speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_EnableAudioLogging, "true");

export const startSpeechRecognition = (onResult: (text: string) => void, onError: (err: any) => void, language = 'en-US') => {
  try {
    // Create a new speech config for each recognition session
    const sessionConfig = sdk.SpeechConfig.fromSubscription(
      process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
      process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
    );
    sessionConfig.speechRecognitionLanguage = language;
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(sessionConfig, audioConfig);
    recognizer.recognized = (_: any, e: any) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        onResult(e.result.text);
      }
    };
    recognizer.canceled = (_: any, e: any) => {
      console.log('Speech recognition canceled:', {
        reason: e.reason,
        errorCode: e.errorCode,
        errorDetails: e.errorDetails
      });
      if (e.reason === sdk.CancellationReason.Error) {
        onError(e.errorDetails || 'Speech recognition failed');
      }
    };
    recognizer.connected = () => {
      console.log('Speech recognition connected successfully');
    };
    recognizer.disconnected = (_: any, e: any) => {
      console.log('Speech recognition disconnected:', e);
    };
    recognizer.startContinuousRecognitionAsync(
      () => {
        console.log("Speech recognition started successfully");
      },
      (error: any) => {
        console.error("Error starting speech recognition:", error);
        onError(error);
      }
    );
    return recognizer;
  } catch (error) {
    console.error("Error in startSpeechRecognition:", error);
    onError(error);
    return null;
  }
};

export const stopSpeechRecognition = (recognizer: any) => {
  if (!recognizer) {
    console.warn('No recognizer to stop');
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    try {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log("Speech recognition stopped successfully");
          try {
            recognizer.close();
            resolve();
          } catch (closeError) {
            console.error("Error closing recognizer:", closeError);
            resolve();
          }
        },
        (error: any) => {
          console.error("Error stopping speech recognition:", {
            error,
            errorMessage: error?.message,
            errorCode: error?.code
          });
          try {
            recognizer.close();
          } catch (closeError) {
            console.error("Error closing recognizer after stop error:", closeError);
          }
          reject(error);
        }
      );
    } catch (error) {
      console.error("Error in stopSpeechRecognition:", error);
      try {
        recognizer.close();
      } catch (closeError) {
        console.error("Error closing recognizer after exception:", closeError);
      }
      reject(error);
    }
  });
};

export const speechToText = async (language = 'en-US') => {
  return new Promise<string>((resolve, reject) => {
    try {
      const sessionConfig = sdk.SpeechConfig.fromSubscription(
        process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
        process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
      );
      sessionConfig.speechRecognitionLanguage = language;
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(sessionConfig, audioConfig);
      recognizer.recognizeOnceAsync(
        (result: any) => {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(result.text);
          } else {
            reject(new Error("Speech recognition failed"));
          }
          recognizer.close();
        },
        (error: any) => {
          console.error("Error in speechToText:", error);
          reject(error);
          recognizer.close();
        }
      );
    } catch (error) {
      console.error("Error in speechToText:", error);
      reject(error);
    }
  });
};

export const textToSpeech = async (text: string, language = 'vi-VN', voiceName = 'vi-VN-HoaiMyNeural') => {
  return new Promise<void>((resolve, reject) => {
    try {
      const sessionConfig = sdk.SpeechConfig.fromSubscription(
        process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
        process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
      );
      sessionConfig.speechSynthesisLanguage = language;
      sessionConfig.speechSynthesisVoiceName = voiceName;
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(sessionConfig, audioConfig);
      synthesizer.synthesisStarted = () => {
        console.log('Speech synthesis started');
      };
      synthesizer.synthesisCompleted = () => {
        console.log('Speech synthesis completed');
        resolve();
      };
      synthesizer.SynthesisCanceled = (_: any, e: any) => {
        console.error('Speech synthesis canceled:', e);
        reject(new Error(`Speech synthesis canceled: ${e.errorDetails || 'Unknown error'}`));
      };
      synthesizer.speakTextAsync(
        text,
        (result: any) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log('Speech synthesis successful');
            synthesizer.close();
            resolve();
          } else {
            console.error('Speech synthesis failed:', result);
            synthesizer.close();
            reject(new Error(`Speech synthesis failed: ${result.errorDetails || 'Unknown error'}`));
          }
        },
        (error: any) => {
          console.error('Speech synthesis error:', error);
          synthesizer.close();
          reject(error);
        }
      );
    } catch (error) {
      console.error('Error in textToSpeech:', error);
      reject(error);
    }
  });
};
