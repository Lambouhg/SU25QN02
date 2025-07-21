import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Send, MessageSquareText, TrendingUp, Lightbulb, Users } from 'lucide-react';
import { SessionState } from '../HeygenConfig';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug conversation structure
  useEffect(() => {
   
    if (conversation && conversation.length > 0) {
    }
  }, [conversation]);

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
          <div className="flex-1 p-4 h-[calc(60vh)] overflow-y-auto space-y-4 bg-gray-50">
            {conversation.map((message, index) => {
              if (!message || !message.sender || !message.text) {
                return null;
              }
              const isUser = message.sender === 'user';
              const isAI = message.sender === 'ai';
              
              const bubbleColor = isUser
                ? 'bg-blue-500 text-white'
                : isAI
                ? 'bg-gray-100 text-gray-900'
                : 'bg-yellow-50 text-yellow-800 italic border border-yellow-200';
              const align = isUser ? 'justify-end' : 'justify-start';
              const borderRadius = isUser
                ? 'rounded-xl rounded-br-none'
                : isAI
                ? 'rounded-xl rounded-bl-none'
                : 'rounded-xl';
              const shadow = isUser
                ? 'shadow-md'
                : isAI
                ? 'shadow'
                : '';
              const errorStyle = message.isError ? 'bg-red-500 text-white' : '';
              const time = message.timestamp ? dayjs(message.timestamp).format('HH:mm') : '';
              const fullTime = message.timestamp ? dayjs(message.timestamp).format('YYYY-MM-DD HH:mm:ss') : '';
              return (
                <div key={message.id || index} className={`flex ${align}`}>
                  <div className="flex flex-col items-end max-w-[80%]">
                    <div
                      className={`p-3 ${bubbleColor} ${borderRadius} ${shadow} text-sm ${errorStyle} break-words`}
                      style={{ wordBreak: 'break-word', minWidth: 40 }}
                    >
                      {message.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Tooltip title={fullTime} arrow>
                        <span className="text-xs text-gray-400 select-none">
                          {time}
                        </span>
                      </Tooltip>
                      {message.isPartial && (
                        <span className="text-xs text-blue-400 ml-1">Đang gửi...</span>
                      )}
                      {message.isError && (
                        <span className="text-xs text-red-400 ml-1">Lỗi</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Input
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
                className="flex-1 bg-gray-100 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                ref={inputRef}
              />
              <Button
                onClick={() => onSendMessage()}
                size="icon"
                disabled={!inputText.trim() || sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking || isInterviewComplete}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                <Send className="w-5 h-5" />
                <span className="sr-only">Gửi tin nhắn</span>
              </Button>
            </div>
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