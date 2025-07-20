import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
}

interface InterviewChatProps {
  position: string;
  conversation: ChatMessage[];
  message: string;
  isAiThinking: boolean;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  messageListRef: React.RefObject<HTMLDivElement | null>;
  onEndInterview?: (timeLeft: number) => void;
  duration: number;
  realTimeScores: {
    fundamental: number;
    logic: number;
    language: number;
    suggestions: {
      fundamental: string;
      logic: string;
      language: string;
    };
  };
  lastFeedback?: string | null;
}

export const InterviewChat: React.FC<InterviewChatProps> = ({
  position,
  conversation,
  message,
  isAiThinking,
  onMessageChange,
  onSendMessage,
  messageListRef,
  onEndInterview,
  duration,
  realTimeScores,
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

  // Sử dụng realTimeScores nếu có, fallback về 0
  const scores = realTimeScores || {
    fundamental: 0,
    logic: 0,
    language: 0,
    suggestions: {
      fundamental: '',
      logic: '',
      language: ''
    }
  };

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation, messageListRef]);

  // Find the latest AI evaluation message (contains '**Đánh giá câu trả lời:**')
  const latestEvaluation = [...conversation].reverse().find(
    (msg) => msg.sender === 'ai' && msg.text && msg.text.includes('**Đánh giá câu trả lời:**')
  );

  // Lọc conversation để KHÔNG render đánh giá trong khung chat
  const filteredConversation = conversation.filter(
    (msg) => !(msg.sender === 'ai' && msg.text && msg.text.includes('**Đánh giá câu trả lời:**'))
  );

  React.useEffect(() => {
    if (secondsLeft === 0 && onEndInterview) {
      onEndInterview(0);
    }
  }, [secondsLeft, onEndInterview]);

  // Timer color logic
  const percentLeft = secondsLeft / (duration * 60);
  let timerColor = 'text-green-600';
  if (percentLeft <= 0.33) {
    timerColor = 'text-red-600';
  } else if (percentLeft <= 0.66) {
    timerColor = 'text-yellow-500';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cột trái: Chat + header + timer */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1">Interview in Progress</h2>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <Badge variant="outline">{position}</Badge>
            <span className={`inline-flex items-center gap-1 font-mono text-lg ${timerColor}`}><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg> {timer}</span>
          </div>
        </div>
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4 overflow-y-auto" ref={messageListRef} style={{ maxHeight: 400 }}>
            {filteredConversation.map((msg) => (
              <div key={msg.id} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-yellow-300 text-yellow-900'}`}> 
                  <div className="text-xs font-medium mb-1">{msg.sender === 'user' ? 'You' : 'AI Interviewer'}</div>
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="mb-4 flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-muted border border-yellow-300 text-yellow-900 max-w-[80%]">
                  <div className="text-xs font-medium mb-1">AI Interviewer</div>
                  <div>AI is thinking...</div>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t flex items-center gap-2">
            <Textarea
              placeholder="Enter your answer..."
              value={message}
              onChange={onMessageChange}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none"
              disabled={isAiThinking}
            />
            <Button onClick={onSendMessage} disabled={!message.trim() || isAiThinking} className="h-12 px-6">Send</Button>
          </div>
        </Card>
        {latestEvaluation && (
          <div className="mt-4 max-w-xl mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#bbf7d0"/><path d="M8 13l2.5 2.5L16 10" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="font-semibold text-lg text-green-700">Answer Evaluation</span>
            </div>
            <div className="space-y-2">
              {latestEvaluation.text.split('\n').map((line, idx) => {
                if (line.trim().startsWith('- **Strengths:**')) {
                  return <div key={idx} className="flex items-center gap-2 mt-2 mb-1"><span className="text-green-600"><svg width='18' height='18' fill='none' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' fill='#bbf7d0'/><path d='M6 10.5l2 2L14 8' stroke='#059669' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg></span><span className="font-semibold text-green-700">Strengths</span></div>;
                }
                if (line.trim().startsWith('- **Areas for Improvement:**')) {
                  return <div key={idx} className="flex items-center gap-2 mt-2 mb-1"><span className="text-orange-500"><svg width='18' height='18' fill='none' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' fill='#fef3c7'/><path d='M10 6v4' stroke='#ea580c' strokeWidth='2' strokeLinecap='round'/><circle cx='10' cy='14' r='1' fill='#ea580c'/></svg></span><span className="font-semibold text-orange-700">Areas for Improvement</span></div>;
                }
                if (line.trim().startsWith('- **Suggestions:**')) {
                  return <div key={idx} className="flex items-center gap-2 mt-2 mb-1"><span className="text-blue-600"><svg width='18' height='18' fill='none' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' fill='#dbeafe'/><path d='M10 6v4' stroke='#2563eb' strokeWidth='2' strokeLinecap='round'/><circle cx='10' cy='14' r='1' fill='#2563eb'/></svg></span><span className="font-semibold text-blue-700">Suggestions</span></div>;
                }
                if (line.trim().startsWith('- ')) {
                  // Bullet points, color by previous section
                  let color = 'text-gray-800';
                  let icon = null;
                  for (let i = idx - 1; i >= 0; i--) {
                    if (latestEvaluation.text.split('\n')[i].includes('Strengths')) { color = 'text-green-700'; icon = <svg className="inline mr-1" width='14' height='14' fill='none' viewBox='0 0 16 16'><circle cx='8' cy='8' r='8' fill='#bbf7d0'/><path d='M5 8.5l2 2L11 6' stroke='#059669' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>; break; }
                    if (latestEvaluation.text.split('\n')[i].includes('Areas for Improvement')) { color = 'text-orange-700'; icon = <svg className="inline mr-1" width='14' height='14' fill='none' viewBox='0 0 16 16'><circle cx='8' cy='8' r='8' fill='#fef3c7'/><path d='M8 5v3' stroke='#ea580c' strokeWidth='2' strokeLinecap='round'/><circle cx='8' cy='11' r='1' fill='#ea580c'/></svg>; break; }
                    if (latestEvaluation.text.split('\n')[i].includes('Suggestions')) { color = 'text-blue-700'; icon = <svg className="inline mr-1" width='14' height='14' fill='none' viewBox='0 0 16 16'><circle cx='8' cy='8' r='8' fill='#dbeafe'/><path d='M8 5v3' stroke='#2563eb' strokeWidth='2' strokeLinecap='round'/><circle cx='8' cy='11' r='1' fill='#2563eb'/></svg>; break; }
                  }
                  return <div key={idx} className={`flex items-start gap-2 ml-6 ${color}`}><span>{icon}</span><span>{line.replace('- ', '')}</span></div>;
                }
                // Other lines
                if (line.trim() !== '') {
                  return <div key={idx} className="text-base text-gray-800 mb-1">{line.replace(/\*\*/g, '')}</div>;
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
      {/* Right column: Real-time scoring card */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Real-time Scoring</CardTitle>
            <div className="text-muted-foreground text-xs">Based on your responses</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Fundamental Knowledge</span>
                <span className="font-bold text-blue-500">{scores.fundamental * 10}%</span>
              </div>
              <Progress value={scores.fundamental * 10} />
              <div className="text-xs text-muted-foreground">{scores.suggestions.fundamental || 'Needs improvement'}</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Logical Reasoning</span>
                <span className="font-bold text-red-500">{scores.logic * 10}%</span>
              </div>
              <Progress value={scores.logic * 10} />
              <div className="text-xs text-muted-foreground">{scores.suggestions.logic || 'Needs improvement'}</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Language Fluency</span>
                <span className="font-bold text-red-500">{scores.language * 10}%</span>
              </div>
              <Progress value={scores.language * 10} />
              <div className="text-xs text-muted-foreground">{scores.suggestions.language || 'Needs improvement'}</div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => {
  if (onEndInterview) {
    const minutesLeft = secondsLeft / 60;
    onEndInterview(minutesLeft);
  }
}}>End Interview Early</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};