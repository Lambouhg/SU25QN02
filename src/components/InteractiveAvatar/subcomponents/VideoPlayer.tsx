"use client"
import React, { useState, useEffect } from 'react';
import { VolumeX, Mic, VideoIcon, Phone, MessageSquare, Settings } from 'lucide-react';
import { useAzureVoiceInteraction } from '@/hooks/useAzureVoiceInteraction';

// UI Components
interface ButtonProps {
  children: React.ReactNode;
  variant?: "default" | "ghost" | "outline" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = "default", size = "default", className = "", onClick, disabled, ...props }) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants = {
    default: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  }

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-8",
    icon: "w-12 h-12 p-0 rounded-full",
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "success" | "warning";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 bg-transparent",
    secondary: "bg-gray-800 text-white",
    success: "bg-emerald-400 text-white",
    warning: "bg-yellow-400 text-white",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  connectionQuality: string;
  sessionState: string;
  avatarId: string;
  avatarName: string;
  SessionState: {
    INACTIVE: string;
    CONNECTED: string;
    [key: string]: string;
  };
  onStopSession: () => void;
  onInterruptAvatar?: () => void;
  isAvatarTalking?: boolean;
  isInterrupting?: boolean;
  elapsedTime?: string;
  onSpeechResult: (text: string) => void;
  voiceDisabled?: boolean;
  voiceLanguage?: 'vi-VN' | 'en-US';
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  connectionQuality,
  sessionState,
  avatarId,
  avatarName,
  SessionState,
  onStopSession,
  onInterruptAvatar,
  isAvatarTalking = false,
  isInterrupting: externalIsInterrupting = false,
  elapsedTime,
  onSpeechResult,
  voiceDisabled = false,
  voiceLanguage = 'vi-VN'
}) => {
  const [isEnding, setIsEnding] = useState(false);
  const [localIsInterrupting, setLocalIsInterrupting] = useState(false);
  // VoiceInteraction state/logic
  const [error, setError] = useState<string | null>(null);
  // const [interimTranscript, setInterimTranscript] = useState<string>('');
  const {
    isListening,
    isInitializing,
    startListening,
    stopListening
  } = useAzureVoiceInteraction({
    onSpeechResult: (text: string) => {
      onSpeechResult(text);
    },
    onError: setError,
  // onInterimResult: setInterimTranscript,
    language: voiceLanguage,
    silenceTimeout: 2000
  });
  const toggleMicrophone = async () => {
    if (voiceDisabled) return;
    if (isAvatarTalking) return;
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };
 
  // Use external isInterrupting state if available, otherwise use local state
  const isInterrupting = externalIsInterrupting || localIsInterrupting;

  const handleEndSession = async () => {
    if (isEnding) return; // Prevent double-click
    
    if (window.confirm('Are you sure you want to end this session?')) {
      try {
        setIsEnding(true);
        console.log('VideoPlayer: User confirmed session end');
        
        // Call the parent's end session handler
        await onStopSession();
        
        console.log('VideoPlayer: Session ended successfully');
      } catch (error) {
        console.error('VideoPlayer: Error ending session:', error);
      } finally {
        setIsEnding(false);
      }
    }
  };

  const handleInterruptSpeech = React.useCallback(async () => {
    if (isInterrupting || !onInterruptAvatar) return; // Prevent double-click
    
    try {
      // Use local state only if external state is not provided
      if (!externalIsInterrupting) {
        setLocalIsInterrupting(true);
      }

      await onInterruptAvatar();

    } catch (error) {
      console.error('VideoPlayer: Error interrupting avatar speech:', error);
    } finally {
      // Reset local state only if external state is not provided
      if (!externalIsInterrupting) {
        setLocalIsInterrupting(false);
      }
    }
  }, [isInterrupting, onInterruptAvatar, externalIsInterrupting]);

  // Keyboard shortcut to interrupt avatar speech (ESC key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isAvatarTalking && !isInterrupting && onInterruptAvatar) {
        event.preventDefault();
        handleInterruptSpeech();
      }
    };

    // Only add listener when avatar is talking and connected
    if (isAvatarTalking && sessionState === SessionState.CONNECTED) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAvatarTalking, isInterrupting, sessionState, SessionState.CONNECTED, onInterruptAvatar, handleInterruptSpeech]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-slate-50 to-gray-100 shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm shadow-xl border-0 overflow-hidden">
          <div className="p-0 relative">
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden relative">
              {sessionState === SessionState.INACTIVE ? (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <h6 className="text-xl font-semibold">
                    Avatar {avatarId} ready to start
                  </h6>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Top-left: Main participant info */}
              <div className="absolute top-6 left-6">
                <div className="flex items-center gap-3 bg-white/10 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                  <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10 text-white/80 text-sm items-center justify-center">
                    {avatarName?.[0] ?? 'A'}
                  </div>
                  <span className="text-sm font-medium">{avatarName}</span>
                  {sessionState === SessionState.CONNECTED}
                  {elapsedTime && (
                    <Badge variant="outline" className="ml-2 text-white border-white/30">
                      {elapsedTime}
                    </Badge>
                  )}
                  {sessionState === SessionState.CONNECTED && connectionQuality !== 'UNKNOWN' && (
                    <Badge variant="outline" className="ml-2 text-white border-white/30">
                      {connectionQuality}
                    </Badge>
                  )}
                </div>
              </div>

              

              {/* Bottom-center: Control bar */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full backdrop-blur-md border border-white/20">
                  {isAvatarTalking && onInterruptAvatar && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-white hover:bg-white/20"
                      onClick={handleInterruptSpeech}
                      disabled={isInterrupting}
                      title="Stop avatar speaking (ESC)"
                    >
                      {isInterrupting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <VolumeX className="w-5 h-5" />
                      )}
                    </Button>
                  )}

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={toggleMicrophone}
                    disabled={voiceDisabled || isAvatarTalking || isInitializing}
                    title={isListening ? 'Stop speaking' : 'Start speaking'}
                  >
                    {isInitializing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => {}}
                    title="Toggle video"
                  >
                    <VideoIcon className="w-5 h-5" />
                  </Button>

                  <Button 
                    size="icon" 
                    variant="danger"
                    onClick={handleEndSession}
                    disabled={isEnding}
                    title="End call"
                  >
                    {isEnding ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                  </Button>

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => {}}
                    title="Messages"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => {}}
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
                {error && (
                  <div className="mt-2 text-center text-red-500 text-xs">{error}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Conversation Section */}
      <div className="flex-1 px-6 pb-6 bg-gradient-to-br from-slate-50 to-gray-100 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
            <span className="text-sm font-semibold text-gray-700">Live Conversation</span>
          </div>
          <p className="text-gray-800 leading-relaxed font-medium">
            {isAvatarTalking ? "Avatar is speaking..." : "Ready for your response..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
