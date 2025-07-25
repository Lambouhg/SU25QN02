import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { StopCircle, VolumeX } from 'lucide-react';

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
  elapsedTime
}) => {
  const [isEnding, setIsEnding] = useState(false);
  const [localIsInterrupting, setLocalIsInterrupting] = useState(false);
  
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
    <Box sx={{ position: 'relative', width: '100%', height: '60vh', minHeight: '400px' }}>
      {sessionState === SessionState.INACTIVE ? (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: 'white',
          }}
        >
          <Typography variant="h6">
            Avatar {avatarId} ready to start
          </Typography>
        </Box>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />
      )}

      {/* Controls Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '8px 16px',
          borderRadius: '20px'
        }}
      >
        {/* Timer and Connection Quality */}
        {elapsedTime && sessionState === SessionState.CONNECTED && (
          <>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
              {elapsedTime}
            </Typography>
            <Box sx={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </>
        )}
        
        {/* Connection Quality - Always show when connected */}
        {sessionState === SessionState.CONNECTED && connectionQuality !== 'UNKNOWN' && (
          <Typography variant="body2" sx={{ color: 'white' }}>
            {connectionQuality}
          </Typography>
        )}

        {/* Stop Speaking Button - Show when avatar is talking */}
        {isAvatarTalking && sessionState === SessionState.CONNECTED && onInterruptAvatar && (
          <>
            <Box sx={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <Button
              variant="outlined"
              size="small"
              onClick={handleInterruptSpeech}
              disabled={isInterrupting}
              startIcon={isInterrupting ? <CircularProgress size={12} color="inherit" /> : <VolumeX />}
              title="Click or press ESC to stop avatar speaking"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '12px',
                minWidth: '90px',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {isInterrupting ? 'Stopping...' : 'Stop'}
            </Button>
          </>
        )}

        {/* Alternative: Always show button for testing */}
        {sessionState === SessionState.CONNECTED && onInterruptAvatar && !isAvatarTalking && (
          <>
            <Box sx={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <Button
              variant="outlined"
              size="small"
              onClick={handleInterruptSpeech}
              disabled={!isAvatarTalking || isInterrupting}
              startIcon={<VolumeX />}
              title="Avatar is not speaking"
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.5)',
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '12px',
                minWidth: '90px'
              }}
            >
              Stop (disabled)
            </Button>
          </>
        )}
        
      </Box>

      {/* Avatar Name and Status */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {/* Speaking indicator */}
          {isAvatarTalking && (
            <Box
              sx={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                  '50%': {
                    opacity: 0.5,
                    transform: 'scale(1.2)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                }
              }}
            />
          )}
          <Typography variant="body2" sx={{ color: 'white' }}>
            {avatarName} {isAvatarTalking ? '(Speaking...)' : ''}
          </Typography>
        </Box>
        {sessionState === SessionState.CONNECTED && (
          <Button
            variant="contained"
            color="error"
            onClick={handleEndSession}
            disabled={isEnding}
            size="small"
            startIcon={isEnding ? <CircularProgress size={16} color="inherit" /> : <StopCircle />}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              minWidth: '120px'
            }}
          >
            {isEnding ? 'Ending...' : 'End Session'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default VideoPlayer;
