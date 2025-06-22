import React, { useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress, LinearProgress } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { SessionState } from './HeygenConfig';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isError?: boolean;
  isThinking?: boolean;
}

interface SkillAssessment {
  technical: number;
  communication: number;
  problemSolving: number;
}

interface ChatControlsProps {
  sessionState: SessionState;
  inputText: string;
  setInputText: (text: string) => void;
  isAvatarTalking: boolean;
  conversation: Message[];
  onSendMessage: () => Promise<void>;
  isThinking?: boolean;
  isInterviewComplete?: boolean;
  questionCount?: number;
  skillAssessment?: SkillAssessment;
  coveredTopics?: string[];
  progress?: number;  // Add progress prop
}

const ChatControls: React.FC<ChatControlsProps> = ({
  sessionState,
  inputText,
  setInputText,
  isAvatarTalking,
  conversation,
  onSendMessage,
  isThinking = false,
  isInterviewComplete = false,
  questionCount = 0,
  skillAssessment,
  coveredTopics = [],
  progress = 0
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isAvatarTalking && !isThinking) {
      event.preventDefault();
      onSendMessage();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      maxHeight: '50vh',
      bgcolor: 'background.default',
      gap: 2
    }}>
      {/* Chat Section */}
      <Box sx={{ 
        flex: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0, // Prevent overflow
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {conversation.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  maxWidth: '80%',
                  p: 1,
                  bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                  color: message.sender === 'user' ? 'white' : 'text.primary',
                  borderRadius: 1,
                  boxShadow: 1,
                  ...(message.isError && {
                    bgcolor: 'error.main',
                    color: 'white'
                  })
                }}
              >
                <Typography variant="body2">
                  {message.text}
                </Typography>
                {message.isThinking && (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                )}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking || isInterviewComplete}
              placeholder={
                isInterviewComplete
                  ? "Phỏng vấn đã kết thúc"
                  : isAvatarTalking
                  ? "Đang nói..."
                  : isThinking
                  ? "Đang suy nghĩ..."
                  : "Nhập câu trả lời của bạn..."
              }
              inputRef={inputRef}
              multiline
              maxRows={4}
              size="small"
            />
            <IconButton 
              onClick={() => onSendMessage()}
              disabled={!inputText.trim() || sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking || isInterviewComplete}
              color="primary"
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Progress Section */}
      <Box sx={{ 
        flex: 1,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: '250px',
        maxWidth: '300px'
      }}>
        <Typography variant="h6" gutterBottom>
          Tiến độ phỏng vấn
        </Typography>
        
        {/* Overall Progress */}
        <Box>
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="textSecondary">
              Số câu hỏi: {questionCount}/10
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Skill Assessment */}
        {skillAssessment && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Đánh giá kỹ năng
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Kỹ thuật</Typography>
                  <Typography variant="caption">{skillAssessment.technical}/10</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={skillAssessment.technical * 10} 
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Giao tiếp</Typography>
                  <Typography variant="caption">{skillAssessment.communication}/10</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={skillAssessment.communication * 10} 
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Giải quyết vấn đề</Typography>
                  <Typography variant="caption">{skillAssessment.problemSolving}/10</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={skillAssessment.problemSolving * 10} 
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Covered Topics */}
        {coveredTopics.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Chủ đề đã đề cập
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {coveredTopics.map((topic, index) => (
                <Box 
                  key={index}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    boxShadow: 1
                  }}
                >
                  {topic}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatControls;