import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Brain, Award } from 'lucide-react';

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
  onSpeechToggle: () => void;
  onMessageChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  messageListRef: React.RefObject<HTMLDivElement>;
  handleKeyPress: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onEndInterview: () => void;
  duration: number;
}

export const InterviewChat: React.FC<InterviewChatProps> = ({
  position,
  conversation,
  message,
  isAiThinking,
  onMessageChange,
  onSendMessage,
  messageListRef,
  handleKeyPress,
  onEndInterview,
  duration,
}) => {
  const [secondsLeft, setSecondsLeft] = React.useState(duration * 60);
  React.useEffect(() => {
    setSecondsLeft(duration * 60);
  }, [duration]);
  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const timer = `${mm}:${ss}`;

  // Fake scores for demo (replace with real-time logic if available)
  const scores = {
    communication: 0,
    logic: 0,
    language: 0,
  };

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation, messageListRef]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cột trái: Chat + header + timer */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1">Phỏng vấn đang diễn ra</h2>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <Badge variant="outline">{position}</Badge>
            <span className="inline-flex items-center gap-1"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg> {timer}</span>
          </div>
        </div>
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4 overflow-y-auto" ref={messageListRef} style={{ maxHeight: 400 }}>
            {conversation.map((msg, idx) => (
              <div key={msg.id} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-yellow-300 text-yellow-900'}`}> 
                  <div className="text-xs font-medium mb-1">{msg.sender === 'user' ? 'Bạn' : 'AI Interviewer'}</div>
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="mb-4 flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-muted border border-yellow-300 text-yellow-900 max-w-[80%]">
                  <div className="text-xs font-medium mb-1">AI Interviewer</div>
                  <div>AI đang suy nghĩ...</div>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t flex items-center gap-2">
            <Textarea
              placeholder="Nhập câu trả lời của bạn..."
              value={message}
              onChange={onMessageChange}
              onKeyDown={handleKeyPress}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none"
              disabled={isAiThinking}
            />
            <Button onClick={onSendMessage} disabled={!message.trim() || isAiThinking} className="h-12 px-6">Gửi</Button>
          </div>
        </Card>
      </div>
      {/* Cột phải: Card chấm điểm real-time */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Real-time Scoring</CardTitle>
            <div className="text-muted-foreground text-xs">Based on your responses</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Communication Clarity</span>
                <span className="font-bold text-red-500">{scores.communication}%</span>
              </div>
              <Progress value={scores.communication} />
              <div className="text-xs text-muted-foreground">Needs improvement</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Logical Reasoning</span>
                <span className="font-bold text-red-500">{scores.logic}%</span>
              </div>
              <Progress value={scores.logic} />
              <div className="text-xs text-muted-foreground">Needs improvement</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Language Fluency</span>
                <span className="font-bold text-red-500">{scores.language}%</span>
              </div>
              <Progress value={scores.language} />
              <div className="text-xs text-muted-foreground">Needs improvement</div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={onEndInterview}>End Interview Early</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 