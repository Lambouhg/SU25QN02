import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { StopCircle } from 'lucide-react';

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
  onStopavatar: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  connectionQuality,
  sessionState,
  avatarId,
  avatarName,
  SessionState,
  onStopSession
}) => {
  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      onStopSession();
    }
  };

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
        <Typography variant="body2" sx={{ color: 'white' }}>
          {connectionQuality}
        </Typography>
        
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
            borderRadius: '20px'
          }}
        >
          <Typography variant="body2" sx={{ color: 'white' }}>
            {avatarName}
          </Typography>
        </Box>
        {sessionState === SessionState.CONNECTED && (
          <Button
            variant="contained"
            color="error"
            onClick={handleEndSession}
            size="small"
            startIcon={<StopCircle />}
            sx={{
              borderRadius: '20px',
              textTransform: 'none'
            }}
          >
            End Session
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default VideoPlayer;
