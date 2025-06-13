import React, { useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress } from '@mui/material';
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

interface ChatControlsProps {
  sessionState: SessionState;
  inputText: string;
  setInputText: (text: string) => void;
  isAvatarTalking: boolean;
  conversation: Message[];
  onSendMessage: () => Promise<void>;
  isThinking?: boolean;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  sessionState,
  inputText,
  setInputText,
  isAvatarTalking,
  conversation,
  onSendMessage,
  isThinking = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSendMessage();
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Messages Container */}
      <Box
        sx={{
          height: '300px',
          overflowY: 'auto',
          mb: 2,
          p: 2,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 2
        }}
      >
        {conversation.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Typography
              variant="body1"
              sx={{
                p: 2,
                maxWidth: '70%',
                backgroundColor: msg.sender === 'user' ? '#4A5568' : '#2D3748',
                color: 'white',
                borderRadius: 1,
                ...(msg.isError && {
                  backgroundColor: '#E53E3E',
                })
              }}
            >
              {msg.text}
            </Typography>
          </Box>
        ))}
        {isThinking && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2
            }}
          >
            <CircularProgress size={20} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              AI đang suy nghĩ...
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Container */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn của bạn..."
          disabled={sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.05)',
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
        <IconButton
          onClick={onSendMessage}
          disabled={!inputText.trim() || sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking}
          sx={{
            color: 'white',
            '&.Mui-disabled': {
              color: 'rgba(255,255,255,0.3)',
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatControls;
