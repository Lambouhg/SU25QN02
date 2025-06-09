"use client";

import React, { useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Typography, Box, Divider, TextField, IconButton, Button, Switch, FormControlLabel, Tooltip, Avatar } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AndroidIcon from '@mui/icons-material/Android';
import { MessageList, MessageItem, MessageContent, StyledPaper } from './styles';

interface ChatMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
}

interface InterviewChatProps {
  position: string;
  isSpeechEnabled: boolean;
  voiceLanguage: 'vi-VN' | 'en-US';
  isListening: boolean;
  isSpeakerOn: boolean;
  isAiSpeaking: boolean;
  conversation: ChatMessage[];
  message: string;
  isAiThinking: boolean;
  onToggleLanguage: () => void;
  onToggleSpeechRecognition: () => void;
  onToggleSpeaker: () => void;
  onSpeechToggle: (event: ChangeEvent<HTMLInputElement>) => void;
  onMessageChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  messageListRef: React.RefObject<HTMLDivElement>;
  handleKeyPress: (event: KeyboardEvent<HTMLDivElement>) => void;
}

const InterviewChat = ({
  position,
  isSpeechEnabled,
  voiceLanguage,
  isListening,
  isSpeakerOn,
  isAiSpeaking,
  conversation,
  message,
  isAiThinking,
  onToggleLanguage,
  onToggleSpeechRecognition,
  onToggleSpeaker,
  onSpeechToggle,
  onMessageChange,
  onSendMessage,
  messageListRef,
  handleKeyPress
}: InterviewChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          Vị trí: {position}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={isSpeechEnabled}
                onChange={onSpeechToggle}
                color="primary"
              />
            }
            label="Tương tác giọng nói"
          />
          {isSpeechEnabled && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={onToggleLanguage}
              >
                {voiceLanguage === 'vi-VN' ? '🇻🇳 VI' : '🇺🇸 EN'}
              </Button>
              <Tooltip title={isListening ? "Dừng nghe" : "Bắt đầu nghe"}>
                <IconButton 
                  color={isListening ? "secondary" : "default"} 
                  onClick={onToggleSpeechRecognition}
                  disabled={isAiSpeaking}
                >
                  {isListening ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={isSpeakerOn ? "Tắt loa" : "Bật loa"}>
                <IconButton 
                  color={isSpeakerOn ? "primary" : "default"} 
                  onClick={onToggleSpeaker}
                >
                  {isSpeakerOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
      <StyledPaper elevation={3}>        <MessageList ref={messageListRef}>
          {conversation.map((msg: ChatMessage) => (
            <MessageItem key={msg.id} sender={msg.sender}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.sender === 'ai' && (
                  <Avatar sx={{ width: 30, height: 30 }}>
                    <AndroidIcon fontSize="small" />
                  </Avatar>
                )}
                <Typography variant="body2" color="text.secondary">
                  {msg.sender === 'user' ? 'Bạn' : 'AI Interviewer'}
                </Typography>
                {msg.sender === 'user' && (
                  <Avatar sx={{ width: 30, height: 30 }}>
                    <AccountCircleIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
              <MessageContent sender={msg.sender} sx={msg.isError ? { backgroundColor: '#ffebee' } : {}}>
                <Typography variant="body1">{msg.text}</Typography>
              </MessageContent>
            </MessageItem>
          ))}
          {isAiThinking && (
            <MessageItem sender="ai">
              <Typography variant="body2" color="text.secondary">AI đang suy nghĩ...</Typography>
            </MessageItem>
          )}
        </MessageList>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Nhập câu trả lời của bạn..."
            multiline
            maxRows={3}
            value={message}
            onChange={onMessageChange}
            onKeyPress={handleKeyPress}
            disabled={isAiThinking || (isListening && isSpeechEnabled)}
          />
          {isSpeechEnabled && (
            <Tooltip title={isListening ? "Dừng nghe" : "Nói"}>
              <IconButton 
                color={isListening ? "secondary" : "primary"} 
                sx={{ ml: 1 }}
                onClick={onToggleSpeechRecognition}
                disabled={isAiThinking || isAiSpeaking}
              >
                {isListening ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </Tooltip>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ ml: isSpeechEnabled ? 1 : 2, height: 56 }} 
            onClick={onSendMessage}
            disabled={!message.trim() || isAiThinking}
          >
            Gửi
          </Button>
        </Box>
      </StyledPaper>
    </>
  );
};

export default InterviewChat;
