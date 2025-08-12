import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Send, MessageSquareText, TrendingUp, Lightbulb, Users } from 'lucide-react';
import { SessionState } from '../HeygenConfig';

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system'; // Use string literals instead of enum for now
  text: string;
  timestamp: string;
  isError?: boolean;
  isPartial?: boolean; // Add this field to match useConversation
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
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCountRef = useRef<number>(conversation.length);

  // Chỉ scroll trong panel chat khi có tin nhắn mới
  useEffect(() => {
    if (conversation.length > prevMsgCountRef.current && chatPanelRef.current) {
      chatPanelRef.current.scrollTo({
        top: chatPanelRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    prevMsgCountRef.current = conversation.length;
  }, [conversation.length]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isAvatarTalking && !isThinking) {
      event.preventDefault();
      onSendMessage();
    }
  };

  // Calculate progress percentage
  const progressPercentage = questionCount && questionCount > 0 ? progress : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
      {/* Chat Section */}
      <Card className="flex flex-col flex-1 h-full bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-200">
          <CardTitle className="text-xl font-bold flex items-center text-gray-900">
            <MessageSquareText className="w-5 h-5 mr-2 text-blue-500" />
            Hội thoại phỏng vấn
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div ref={chatPanelRef} className="flex-1 p-4 max-h-[400px] overflow-y-auto space-y-4 bg-gray-50">
            {conversation.map((msg, index) => {
              if (!msg || !msg.sender || !msg.text) return null;
              const isUser = msg.sender === 'user';
              // const isAI = msg.sender === 'ai';
              const align = isUser ? 'justify-end' : 'justify-start';
              return (
                <div key={msg.id || index} className={`mb-4 flex ${align}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 border border-yellow-300 text-yellow-900'}`}>
                    <div className="text-xs font-medium mb-1">{isUser ? 'Bạn' : 'AI Interviewer'}</div>
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                </div>
              );
            })}
            {/* Hiệu ứng loading khi avatar đang trả lời */}
            {isThinking && (
              <div className="mb-4 flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-gray-100 border border-yellow-300 text-yellow-900 max-w-[80%]">
                  <div className="text-xs font-medium mb-1">AI Interviewer</div>
                  <div>AI is thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t flex items-center gap-2">
            <Textarea
              placeholder={
                isInterviewComplete
                  ? 'Phỏng vấn đã kết thúc'
                  : isAvatarTalking
                  ? 'Đang nói...'
                  : isThinking
                  ? 'Đang suy nghĩ...'
                  : 'Nhập câu trả lời của bạn...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking || isInterviewComplete}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-gray-100 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              ref={inputRef}
            />
            <Button
              onClick={() => onSendMessage()}
              disabled={!inputText.trim() || sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking || isInterviewComplete}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              <Send className="w-5 h-5" />
              <span className="sr-only">Gửi tin nhắn</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card className="flex flex-col w-full max-w-xs bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold flex items-center text-gray-900">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Tiến độ phỏng vấn
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          {/* Overall Progress */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                Tiến độ
              </Label>
              <span className="text-sm text-gray-500">
                Số câu hỏi: {questionCount}/10
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2 bg-gray-200" />
            <div className="text-xs text-gray-500 text-right">{progressPercentage.toFixed(0)}% hoàn thành</div>
          </div>

          {/* Skill Assessment */}
          {skillAssessment && (
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" />
                Đánh giá kỹ năng
              </Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                  Kỹ thuật: {skillAssessment.technical}/10
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                  Giao tiếp: {skillAssessment.communication}/10
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                  Giải quyết vấn đề: {skillAssessment.problemSolving}/10
                </Badge>
              </div>
            </div>
          )}

          {/* Covered Topics */}
          {coveredTopics && coveredTopics.length > 0 && (
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <Users className="w-4 h-4 mr-1 text-purple-500" />
                Chủ đề đã đề cập
              </Label>
              <div className="flex flex-wrap gap-2">
                {coveredTopics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatControls;