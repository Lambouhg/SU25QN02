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
  isReviewing?: boolean; // Thêm prop để biết đang review
  reviewCountdown?: number; // Thêm countdown  
  officialQuestionCount?: number; // Số câu hỏi đã hỏi
  maxQuestions?: number; // Số câu hỏi tối đa
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
  isReviewing = false,
  reviewCountdown = 0,
  officialQuestionCount = 0,
  maxQuestions = 10,
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
        <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 p-[1px] shadow-sm">
          <div className="rounded-xl bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-xl font-semibold">Interview in Progress</h2>
              <Badge variant="outline">{position}</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Question {officialQuestionCount}/{maxQuestions}
              </Badge>
              <span className={`ml-auto inline-flex items-center gap-1 font-mono text-lg ${timerColor}`}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {timer}
              </span>
              {isReviewing && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
                  Review Time: {reviewCountdown}s
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4 overflow-y-auto" ref={messageListRef} style={{ maxHeight: 400 }}>
            {filteredConversation.map((msg) => (
              <div key={msg.id} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
                <div className={`rounded-2xl px-4 py-3 max-w-[80%] shadow ${msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-800'}`}>
                  <div className="text-[11px] font-medium opacity-70 mb-1">{msg.sender === 'user' ? 'You' : 'AI Interviewer'}</div>
                  <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-800 max-w-[60%] shadow">
                  <div className="text-[11px] font-medium opacity-70 mb-1">AI Interviewer</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t flex items-center gap-2">
            <Textarea
              placeholder={isReviewing ? "Please wait while reviewing..." : "Enter your answer..."}
              value={message}
              onChange={onMessageChange}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500"
              disabled={isAiThinking || isReviewing}
            />
            <Button 
              onClick={onSendMessage} 
              disabled={!message.trim() || isAiThinking || isReviewing} 
              className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </Button>
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
            <CardTitle>Interview Progress</CardTitle>
            <div className="text-muted-foreground text-xs">
              Questions answered: {officialQuestionCount}/{maxQuestions}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar cho số câu hỏi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Question Progress</span>
                <span className="font-bold text-blue-500">
                  {Math.round((officialQuestionCount / maxQuestions) * 100)}%
                </span>
              </div>
              <Progress value={(officialQuestionCount / maxQuestions) * 100} />
            </div>
            
            {/* Real-time scores */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Real-time Scoring</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Fundamental Knowledge</span>
                    <span className="font-bold text-blue-500">{Math.round(scores.fundamental)}%</span>
                  </div>
                  <ScoreBar value={scores.fundamental} color="bg-blue-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Logical Reasoning</span>
                    <span className="font-bold text-red-500">{Math.round(scores.logic)}%</span>
                  </div>
                  <ScoreBar value={scores.logic} color="bg-red-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Language Fluency</span>
                    <span className="font-bold text-red-500">{Math.round(scores.language)}%</span>
                  </div>
                  <ScoreBar value={scores.language} color="bg-green-500" />
                </div>
              </div>
            </div>
            
            {!isReviewing && (
              <Button variant="outline" className="w-full mt-4" onClick={() => {
                if (onEndInterview) {
                  const minutesLeft = secondsLeft / 60;
                  onEndInterview(minutesLeft);
                }
              }}>End Interview Early</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Compact score bar with rounded background and colored fill
const ScoreBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-blue-500' }) => {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`${color} h-full transition-all`}
          style={{ width: `${safe}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-gray-500">Score: {safe}/100</div>
    </div>
  );
};