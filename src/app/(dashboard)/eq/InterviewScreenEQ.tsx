import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, MessageCircle, Send, Clock, AlertCircle } from 'lucide-react';

interface InterviewScreenEQProps {
  selectedCategory: string;
  conversation: Array<{ role: string; content: string }>;
  message: string;
  isAiThinking: boolean;
  onSendMessage: () => void;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onEndInterview: (minutesLeft: number) => void;
  messageListRef: React.RefObject<HTMLDivElement | null>;
  duration: number;
  realTimeScores: Record<string, number>;
  lastFeedback: string | null;
}

export default function InterviewScreenEQ({
  selectedCategory,
  conversation,
  message,
  isAiThinking,
  onSendMessage,
  onMessageChange,
  onEndInterview,
  messageListRef,
  duration,
  realTimeScores,
  lastFeedback
}: InterviewScreenEQProps) {
  const [remainingTime, setRemainingTime] = React.useState(duration * 60); // Convert to seconds

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onEndInterview(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onEndInterview]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Heart className="h-5 w-5 text-purple-600" />
              EQ Interview - {selectedCategory}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-mono text-lg font-semibold text-gray-700">
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>
          <Progress 
            value={((duration * 60 - remainingTime) / (duration * 60)) * 100} 
            className="mt-2"
          />
        </CardHeader>
      </Card>

      {/* Real-time Scores */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="text-lg font-semibold text-gray-900">Real-time EQ Assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Emotional Awareness</h3>
            <Badge 
              variant="outline" 
              className={`${getScoreBgColor(realTimeScores.emotionalAwareness)} ${getScoreColor(realTimeScores.emotionalAwareness)} border-current`}
            >
              {realTimeScores.emotionalAwareness}%
            </Badge>
          </div>
          <div className="text-center p-4 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Conflict Resolution</h3>
            <Badge 
              variant="outline" 
              className={`${getScoreBgColor(realTimeScores.conflictResolution)} ${getScoreColor(realTimeScores.conflictResolution)} border-current`}
            >
              {realTimeScores.conflictResolution}%
            </Badge>
          </div>
          <div className="text-center p-4 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Communication</h3>
            <Badge 
              variant="outline" 
              className={`${getScoreBgColor(realTimeScores.communication)} ${getScoreColor(realTimeScores.communication)} border-current`}
            >
              {realTimeScores.communication}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {lastFeedback && (
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              EQ Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="prose prose-sm max-w-none text-gray-700">
              <pre className="whitespace-pre-wrap font-sans">{lastFeedback}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-lg font-semibold text-gray-900">Interview Conversation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={messageListRef}
            className="h-96 overflow-y-auto p-4 space-y-4"
          >
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={onMessageChange}
                placeholder="Type your response here..."
                className="flex-1 min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
              />
              <Button
                onClick={onSendMessage}
                disabled={!message.trim() || isAiThinking}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* End Interview Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => onEndInterview(Math.floor(remainingTime / 60))}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          End Interview
        </Button>
      </div>
    </div>
  );
}
