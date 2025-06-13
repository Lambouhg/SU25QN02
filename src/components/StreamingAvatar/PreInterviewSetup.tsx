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
  interviewField: string;
  interviewLevel: string;
  onFieldChange: (field: string) => void;
  onLevelChange: (level: string) => void;
}

const INTERVIEW_FIELDS = [
  { value: 'frontend', label: 'Frontend Development' },
  { value: 'backend', label: 'Backend Development' },
  { value: 'fullstack', label: 'Fullstack Development' },
  { value: 'devops', label: 'DevOps Engineering' },
  { value: 'mobile', label: 'Mobile Development' },
  { value: 'ai', label: 'AI/Machine Learning' },
];

const INTERVIEW_LEVELS = [
  { value: 'junior', label: 'Junior (0-2 năm)' },
  { value: 'mid', label: 'Mid-level (2-4 năm)' },
  { value: 'senior', label: 'Senior (4-8 năm)' },
  { value: 'lead', label: 'Tech Lead (8+ năm)' },
];

const PreInterviewSetup: React.FC<PreInterviewSetupProps> = ({
  config,
  onConfigChange,
  onStartInterview,
  sessionState,
  AVATARS,
  STT_LANGUAGE_LIST,
  interviewField,
  interviewLevel,
  onFieldChange,
  onLevelChange,
}) => {
  const handleConfigChange = useCallback(<K extends keyof StartAvatarRequest>(
    key: K,
    value: StartAvatarRequest[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  // Common styles
  const commonTransition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  const commonBorderRadius = '16px';

  // Select component styles
  const selectStyles = {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#E0E7FF',
    borderRadius: commonBorderRadius,
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    transition: commonTransition,
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      transform: 'translateY(-2px)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
    },
    '& .MuiSelect-icon': {
      color: '#818CF8',
    },
    '& .MuiSelect-select': {
      padding: '16px',
    },
    '& .MuiMenuItem-root': {
      color: '#E0E7FF',
      fontSize: '0.95rem',
      padding: '12px 16px',
      transition: commonTransition,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        transform: 'translateX(5px)',
      },
      '&.Mui-selected': {
        backgroundColor: 'rgba(129, 140, 248, 0.2)',
        '&:hover': {
          backgroundColor: 'rgba(129, 140, 248, 0.3)',
        },
      },
    },
  };

  // Label styles
  const labelStyles = {
    color: '#E0E7FF',
    fontSize: '0.9rem',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#818CF8',
    },
  };

  // Button styles
  const buttonStyles = {
    background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
    color: '#ffffff',
    fontSize: '1.1rem',
    padding: '16px',
    borderRadius: commonBorderRadius,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'none',
    transition: commonTransition,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(129, 140, 248, 0.4)',
      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.12)',
      color: 'rgba(255, 255, 255, 0.3)',
      boxShadow: 'none',
    },
  };

  return (
    <Box sx={{ 
      p: 4,
      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top right, rgba(129, 140, 248, 0.1), transparent 40%)',
        pointerEvents: 'none',
      },
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          color: '#E0E7FF',
          mb: 4,
          textAlign: 'center',
          fontWeight: 700,
          letterSpacing: '0.5px',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '4px',
            background: 'linear-gradient(90deg, #818CF8, #6366F1)',
            borderRadius: '2px',
          },
        }}
      >
        Cài đặt phỏng vấn
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        '@media (min-width: 600px)': {
          maxWidth: '500px',
          mx: 'auto',
        },
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Interview Field Selection */}
        <FormControl fullWidth>
          <InputLabel sx={labelStyles}>Lĩnh vực</InputLabel>
          <Select
            value={interviewField}
            onChange={(e) => onFieldChange(e.target.value)}
            sx={selectStyles}
          >
            {INTERVIEW_FIELDS.map((field) => (
              <MenuItem key={field.value} value={field.value}>
                {field.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Experience Level Selection */}
        <FormControl fullWidth>
          <InputLabel sx={labelStyles}>Cấp độ kinh nghiệm</InputLabel>
          <Select
            value={interviewLevel}
            onChange={(e) => onLevelChange(e.target.value)}
            sx={selectStyles}
          >
            {INTERVIEW_LEVELS.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Avatar Selection */}
        <FormControl fullWidth>
          <InputLabel sx={labelStyles}>Avatar</InputLabel>
          <Select
            value={config.avatarName}
            onChange={(e) => handleConfigChange('avatarName', e.target.value)}
            sx={selectStyles}
          >
            {AVATARS.map((avatar) => (
              <MenuItem key={avatar.avatar_id} value={avatar.avatar_id}>
                {avatar.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Language Selection */}
        <FormControl fullWidth>          
          <InputLabel sx={labelStyles}>Ngôn ngữ</InputLabel>
          <Select
            value={config.language || ''}
            onChange={(e) => handleConfigChange('language', e.target.value)}
            displayEmpty
            sx={selectStyles}
          >            
            <MenuItem value="" disabled>
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
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={() => onStartInterview()}
            disabled={sessionState === SessionState.CONNECTING}
            fullWidth
            sx={buttonStyles}
          >
            {sessionState === SessionState.CONNECTING ? 'Đang kết nối...' : 'Bắt đầu phỏng vấn'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PreInterviewSetup;
