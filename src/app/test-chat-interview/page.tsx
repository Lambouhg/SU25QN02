'use client';

import React, { useState } from 'react';
import { processInterviewResponse, InterviewConfig } from '@/services/avatarInterviewService/Avatar-AI';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: {
    questionCount: number;
    interviewProgress: number;
    currentScore: number;
    isFromQuestionBank?: boolean;
    currentTopic?: string;
  };
}

export default function ChatInterviewTestPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  // Interview Configuration
  const testConfig: InterviewConfig = {
    field: 'Frontend Development',
    level: 'junior',
    language: 'vi-VN',
    specialization: 'React Developer',
    selectedSkills: ['React'],
    customSkills: ['Redux', 'Next.js']
  };

  const startInterview = async () => {
    setIsLoading(true);
    try {
      // Start with greeting message
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are conducting a professional interview for a ${testConfig.field} position at ${testConfig.level} level.`,
        timestamp: new Date().toISOString()
      };

      const greetingMessage: ChatMessage = {
        role: 'assistant', 
        content: `Xin chào! Tôi là AI phỏng vấn cho vị trí ${testConfig.field} - ${testConfig.specialization}. Tôi sẽ điều chỉnh câu hỏi dựa trên kỹ năng bạn đã chọn: ${testConfig.selectedSkills?.join(', ')}. Bạn có thể bắt đầu bằng cách giới thiệu về bản thân và kinh nghiệm không?`,
        timestamp: new Date().toISOString(),
        metadata: {
          questionCount: 0,
          interviewProgress: 0,
          currentScore: 0
        }
      };

      setMessages([systemMessage, greetingMessage]);
      setInterviewStarted(true);
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Convert messages to the format expected by processInterviewResponse
      const conversationHistory = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Add the current user message
      conversationHistory.push({
        role: 'user',
        content: userInput
      });

      console.log('🔄 Sending to processInterviewResponse:', {
        userMessage: userInput,
        historyLength: conversationHistory.length,
        config: testConfig
      });

      // Call the interview processing function
      const response = await processInterviewResponse(
        userInput,
        conversationHistory,
        testConfig.language,
        testConfig
      );

      console.log('✅ Response from processInterviewResponse:', {
        questionCount: response.questionCount,
        progress: response.interviewProgress,
        isComplete: response.isInterviewComplete,
        currentTopic: response.currentTopic
      });

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        metadata: {
          questionCount: response.questionCount,
          interviewProgress: response.interviewProgress,
          currentScore: response.currentScore,
          currentTopic: response.currentTopic
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check if interview is complete
      if (response.isInterviewComplete) {
        setInterviewComplete(true);
        console.log('🎯 Interview completed!');
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setUserInput('');
    setInterviewStarted(false);
    setInterviewComplete(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold">🤖 Chat Interview Test</h1>
            <p className="text-blue-100 mt-1">
              Test Follow-up Questions System trực tiếp với data thật
            </p>
          </div>

          {/* Interview Config Display */}
          <div className="bg-blue-50 p-4 border-b">
            <h3 className="font-semibold mb-2">📋 Interview Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Position:</span> {testConfig.field} - {testConfig.specialization}
              </div>
              <div>
                <span className="font-medium">Level:</span> {testConfig.level}
              </div>
              <div>
                <span className="font-medium">Language:</span> {testConfig.language}
              </div>
              <div>
                <span className="font-medium">Selected Skills:</span> {testConfig.selectedSkills?.join(', ')}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {!interviewStarted && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nhấn &quot;Start Interview&quot; để bắt đầu test</p>
                <button
                  onClick={startInterview}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium"
                >
                  {isLoading ? 'Starting...' : 'Start Interview'}
                </button>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : message.role === 'system'
                    ? 'bg-gray-200 text-gray-600 text-sm'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.role === 'system' && (
                    <div className="font-semibold text-xs mb-1">SYSTEM</div>
                  )}
                  
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.metadata && (
                    <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                      <div className="flex justify-between">
                        <span>Q: {message.metadata.questionCount}/10</span>
                        <span>{message.metadata.interviewProgress}%</span>
                      </div>
                      {message.metadata.currentTopic && (
                        <div className="mt-1">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {message.metadata.currentTopic}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>AI đang phân tích và tạo câu hỏi...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          {interviewStarted && !interviewComplete && (
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu trả lời của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Interview Complete */}
          {interviewComplete && (
            <div className="border-t p-4 bg-green-50">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 Phỏng vấn hoàn thành!
                </h3>
                <p className="text-green-700 mb-4">
                  Bạn đã trả lời đủ 10 câu hỏi. Cảm ơn bạn đã tham gia test!
                </p>
                <button
                  onClick={resetChat}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Test lại
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💡 Test các scenario: mention React, nói &quot;tôi chưa biết&quot;, performance issues, etc.
              </div>
              <button
                onClick={resetChat}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Reset Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}