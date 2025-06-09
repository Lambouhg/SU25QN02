import React, { useCallback } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Typography } from '@mui/material';
import { SessionState } from './HeygenConfig';
import { StartAvatarRequest } from '@heygen/streaming-avatar';

interface PreInterviewSetupProps {
  config: StartAvatarRequest;
  onConfigChange: (config: StartAvatarRequest) => void;
  onStartInterview: () => Promise<void>;
  sessionState: SessionState;
  AVATARS: Array<{ avatar_id: string; name: string }>;
  STT_LANGUAGE_LIST: Array<{ label: string; value: string; key: string }>;
}

const PreInterviewSetup: React.FC<PreInterviewSetupProps> = ({
  config,
  onConfigChange,
  onStartInterview,
  sessionState,
  AVATARS,
  STT_LANGUAGE_LIST,
}) => {
  const handleConfigChange = useCallback(<K extends keyof StartAvatarRequest>(
    key: K,
    value: StartAvatarRequest[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
        Cài đặt Avatar
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Avatar Selection */}
        <FormControl fullWidth>
          <InputLabel sx={{ color: 'white' }}>Avatar</InputLabel>
          <Select
            value={config.avatarName}
            onChange={(e) => handleConfigChange('avatarName', e.target.value)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.87)',
              },
            }}
          >
            {AVATARS.map((avatar) => (
              <MenuItem key={avatar.avatar_id} value={avatar.avatar_id}>
                {avatar.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Language Selection */}
        <FormControl fullWidth>          <InputLabel sx={{ color: 'white' }}>Ngôn ngữ</InputLabel>
          <Select
            value={config.language || ''}
            onChange={(e) => handleConfigChange('language', e.target.value)}
            displayEmpty
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.87)',
              },
            }}
          >            <MenuItem value="" disabled>
              <em>Chọn ngôn ngữ</em>
            </MenuItem>
            {STT_LANGUAGE_LIST.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Start Button */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onStartInterview()}
            disabled={sessionState === SessionState.CONNECTING}
            fullWidth
          >
            {sessionState === SessionState.CONNECTING ? 'Đang kết nối...' : 'Bắt đầu trò chuyện'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PreInterviewSetup;
