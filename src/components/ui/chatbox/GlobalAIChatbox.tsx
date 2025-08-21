"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Paperclip,
  Smile,
  Mic,
  Image as ImageIcon,
  Video,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { sendMessage } from '@/services/globalChatboxService';

interface ChatMessageType {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

interface GlobalAIChatboxProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage?: string;
  currentContext?: any;
}

const GlobalAIChatbox: React.FC<GlobalAIChatboxProps> = ({
  isOpen,
  onToggle,
  currentPage = 'general',
  currentContext = {}
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [language] = useState<'en' | 'vi'>('en'); // Fixed to English only
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Remove language loading from localStorage
  // useEffect(() => {
  //   const savedLanguage = localStorage.getItem('chatbot-language');
  //   if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
  //     setLanguage(savedLanguage);
  //   }
  // }, []);

  // Remove language saving to localStorage
  // useEffect(() => {
  //   localStorage.setItem('chatbot-language', language);
  // }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && !hasShownWelcome) {
      // Add welcome message only once
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        content: `Hello! I'm your AI assistant. How can I help you today? I can assist with interview preparation, job descriptions, quizzes, and more.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
      setHasShownWelcome(true);
    }
  }, [messages.length, hasShownWelcome]);

  const handleResetChat = () => {
    setMessages([]);
    setChatHistory([]);
    setHasShownWelcome(false); // Reset the flag so welcome message can show again
    localStorage.removeItem('globalChatHistory');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage({
        message: inputMessage,
        context: {
          page: currentPage,
          ...currentContext
        },
        language: language
      });

      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'w-96 h-[32rem]' : 'w-80 h-[28rem]'
    }`}>
      {/* Header - Facebook Messenger Style */}
      <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-500 font-bold text-sm">AI</span>
          </div>
          <div>
            <div className="font-semibold text-sm">AI Assistant</div>
            <div className="text-xs text-blue-100">Active now</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Remove language selector - only show English */}
          <span className="px-2 py-1 text-xs bg-white/20 text-white rounded-full text-xs">
            🇺🇸 EN
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleResetChat} 
            className="text-white hover:bg-white/20 rounded-full p-1 h-6 w-6" 
            title="Reset Chat"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(v => !v)} 
            className="text-white hover:bg-white/20 rounded-full p-1 h-6 w-6" 
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle} 
            className="text-white hover:bg-white/20 rounded-full p-1 h-6 w-6" 
            title="Close"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Always show full content - no minimize */}
      <>
        {/* Messages Area - Dynamic height based on expand state */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50" style={{ 
          height: isExpanded ? '400px' : '320px' 
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-200 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Facebook Messenger Style */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            {/* Simplified Input Area - Only Essential Icons */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            
            {/* Essential Action Buttons Only */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                <Smile className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 h-8 w-8 bg-blue-500 text-white hover:bg-blue-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default GlobalAIChatbox;


