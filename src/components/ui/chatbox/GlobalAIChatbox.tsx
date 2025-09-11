"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { GlobalChatboxContext } from '@/services/globalChatboxService';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  RefreshCw,
  Smile,
  Square,
  ArrowDown
} from 'lucide-react';
import { processGlobalChatboxMessageStreaming, StreamingChatboxResponse } from '@/services/globalChatboxService';

interface ChatMessageType {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  suggestions?: string[];
  actions?: {
    type: string;
    label: string;
    action: string;
  }[];
}

interface GlobalAIChatboxProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage?: string;
  currentContext?: Partial<GlobalChatboxContext>;
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
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('globalChatHistory');
    console.log('Loading chat history:', savedHistory);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('Parsed history:', parsedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedHistory.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
          setHasShownWelcome(true);
          setIsHistoryLoaded(true);
          console.log('Loaded chat history successfully');
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    } else {
      console.log('No saved chat history found');
    }
    setIsHistoryLoaded(true); // Mark as loaded even if no history
  }, []); // Only run once on mount

  // Show welcome message if no history and not shown yet (only after history is loaded)
  useEffect(() => {
    if (isHistoryLoaded && messages.length === 0 && !hasShownWelcome) {
      console.log('Creating welcome message');
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        content: language === 'vi'
          ? 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể hỗ trợ bạn luyện phỏng vấn, mô tả công việc, làm quiz và nhiều hơn nữa. Bạn cần tôi giúp gì?'
          : `Hello! I'm your AI assistant. I can help with interview preparation, job descriptions, quizzes, and more. How can I help you today?`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
      setHasShownWelcome(true);
    }
  }, [isHistoryLoaded, messages.length, hasShownWelcome, language]);

  // Save chat history to localStorage whenever messages change (but not on initial load)
  useEffect(() => {
    if (messages.length > 0) {
      console.log('Saving chat history:', messages);
      localStorage.setItem('globalChatHistory', JSON.stringify(messages));
      console.log('Saved to localStorage');
    }
  }, [messages]);
  
  // Quick help prompts based on current page and language
  const getQuickHelpPrompts = () => {
    if (language === 'vi') {
      const viPrompts: { [key: string]: string[] } = {
        'avatar-interview': [
          'Cách bắt đầu phỏng vấn với avatar?',
          'Làm sao để chọn avatar phù hợp?',
          'Cách cài đặt ngôn ngữ và level?',
          'Khắc phục sự cố voice/video'
        ],
        'jd-analysis': [
          'Cách upload file JD?',
          'Làm sao để tạo câu hỏi tốt?',
          'Cách chọn loại câu hỏi?',
          'Mẹo viết JD hiệu quả'
        ],
        'quiz': [
          'Cách chọn quiz phù hợp?',
          'Hiểu hệ thống chấm điểm',
          'Mẹo làm quiz hiệu quả',
          'Cách xem lại kết quả'
        ],
        'assessment': [
          'Cách bắt đầu đánh giá kỹ năng?',
          'Làm sao để chọn loại assessment?',
          'Hiểu kết quả đánh giá EQ/Technical',
          'Cách cải thiện điểm số'
        ],
        'review': [
          'Cách sử dụng flash card hiệu quả?',
          'Làm sao để shuffle flash card?',
          'Cách lọc flash card theo bookmark?',
          'Mẹo học tập với flash card'
        ],
        'dashboard': [
          'Giải thích các chỉ số',
          'Cách đọc đánh giá kỹ năng',
          'Mẹo cải thiện điểm số',
          'Cách đặt mục tiêu'
        ],
        'payment': [
          'So sánh các gói dịch vụ',
          'Hướng dẫn thanh toán',
          'Quản lý gói đăng ký',
          'Chính sách hoàn tiền'
        ]
      };
      return viPrompts[currentPage] || [
        'Hướng dẫn sử dụng nền tảng',
        'Tổng quan tính năng chính',
        'Mẹo để đạt kết quả tốt'
      ];
    }
    const enPrompts: { [key: string]: string[] } = {
      'avatar-interview': [
        'How to start an avatar interview?',
        'How to choose the right avatar?',
        'How to set language and level?',
        'Troubleshooting voice/video issues'
      ],
      'jd-analysis': [
        'How to upload JD file?',
        'How to create good questions?',
        'How to choose question types?',
        'Tips for writing effective JDs'
      ],
      'quiz': [
        'How to choose the right quiz?',
        'Understanding scoring system',
        'Tips for effective quiz taking',
        'How to review results'
      ],
      'assessment': [
        'How to start skill assessment?',
        'How to choose assessment type?',
        'Understanding EQ/Technical results',
        'How to improve scores'
      ],
      'review': [
        'How to use flash cards effectively?',
        'How to shuffle flash cards?',
        'How to filter flash cards by bookmark?',
        'Study tips with flash cards'
      ],
      'dashboard': [
        'Understanding metrics',
        'How to read skill assessment',
        'Tips to improve scores',
        'How to set goals'
      ],
      'payment': [
        'Comparing service packages',
        'Payment guidance',
        'Subscription management',
        'Refund policy'
      ]
    };
    return enPrompts[currentPage] || [
      'How to use this platform',
      'Main features overview',
      'Tips for best results'
    ];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isNearBottom);
      setScrollPosition(scrollTop);
    }
  };

  useEffect(() => {
    // Chỉ auto scroll khi có tin nhắn mới và không đang generate
    if (!isGenerating && !isTyping) {
      // Kiểm tra xem user có đang ở gần bottom không
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        // Chỉ scroll nếu user đang ở gần bottom
        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages, isGenerating, isTyping]);


  const handleResetChat = () => {
    setMessages([]);
    setHasShownWelcome(false); // Reset the flag so welcome message can show again
    setIsHistoryLoaded(false); // Reset history loaded flag
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
    setIsGenerating(true);

    // Create AbortController for stopping generation
    const controller = new AbortController();
    setAbortController(controller);

    // Create initial AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: ChatMessageType = {
      id: aiMessageId,
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, initialAiMessage]);
    setIsTyping(true);

    try {
      // Use streaming function instead of regular sendMessage
      // Helper to safely read user level from metadata without using any
      const getUserLevelFromMetadata = (metadata: unknown): 'beginner' | 'intermediate' | 'advanced' => {
        if (metadata && typeof metadata === 'object' && 'level' in metadata) {
          const lvl = (metadata as { level?: unknown }).level;
          if (lvl === 'beginner' || lvl === 'intermediate' || lvl === 'advanced') {
            return lvl;
          }
        }
        return 'beginner';
      };

      await processGlobalChatboxMessageStreaming(
        inputMessage,
        {
          page: currentPage,
          userPreferences: {
            language: language,
            responseStyle: 'detailed',
            technicalLevel: 'basic',
            tone: 'friendly'
          },
          userLevel: getUserLevelFromMetadata(user?.publicMetadata),
          ...currentContext
        },
        (chunk: StreamingChatboxResponse) => {
          // Check if generation was stopped
          if (controller.signal.aborted) {
            return;
          }
          
          // Update the AI message with streaming content
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: chunk.content,
                  suggestions: chunk.suggestions,
                  actions: chunk.actions
                }
              : msg
          ));
          
          // Update typing state based on completion
          if (chunk.isComplete) {
            setIsTyping(false);
          }
        },
        controller.signal
      );
    } catch (error) {
      if (controller.signal.aborted) {
        // Generation was stopped by user
        const stoppedMessage: ChatMessageType = {
          id: aiMessageId,
          content: 'Generation stopped.',
          sender: 'ai',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? stoppedMessage : msg
        ));
      } else {
        console.error('Error sending message:', error);
        const errorMessage: ChatMessageType = {
          id: aiMessageId,
          content: 'Sorry, I encountered an error. Please try again.',
          sender: 'ai',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? errorMessage : msg
        ));
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setIsTyping(false);
      setIsLoading(false);
      setAbortController(null);
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
      isExpanded ? 'w-[28rem] h-[40rem]' : 'w-80 h-[28rem]'
    }`}>
      {/* Header - Facebook Messenger Style */}
      <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-500 font-bold text-sm">AI</span>
          </div>
                     <div>
             <div className="font-semibold text-sm">Chat Box</div>
             <div className="text-xs text-blue-100">{language === 'vi' ? 'Đang hoạt động' : 'Active now'}</div>
           </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Remove language selector - only show English */}
          <span className="px-2 py-1 text-xs bg-white/20 text-white rounded-full text-xs cursor-pointer select-none" onClick={() => setLanguage(prev => prev === 'en' ? 'vi' : 'en')} title={language === 'en' ? 'Chuyển sang tiếng Việt' : 'Switch to English'}>
            {language === 'en' ? '🇺🇸 EN' : '🇻🇳 VI'}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleResetChat} 
            className="text-white hover:bg-white/20 rounded-full p-1 h-6 w-6" 
            title={language === 'vi' ? 'Làm mới cuộc trò chuyện' : 'Reset Chat'}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(v => !v)} 
            className="text-white hover:bg-white/20 rounded-full p-1 h-6 w-6" 
            title={isExpanded ? (language === 'vi' ? 'Thu nhỏ' : 'Minimize') : (language === 'vi' ? 'Mở rộng' : 'Expand')}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle} 
            className="text-white hover:bg-white/20 rounded-full p-1 h-6 w-6" 
            title={language === 'vi' ? 'Đóng' : 'Close'}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Always show full content - no minimize */}
      <>
        {/* Messages Area - Dynamic height based on expand state */}
                 <div 
           ref={messagesContainerRef}
           className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 relative" 
           style={{ 
             height: isExpanded ? '520px' : '320px' 
           }}
           onScroll={handleScroll}
         >
          {/* Quick Help Prompts - Show only when no messages or first message is welcome */}
          {messages.length <= 1 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-600 mb-2">{language === 'vi' ? 'Gợi ý nhanh:' : 'Quick Help:'}</div>
              <div className="flex flex-wrap gap-2">
                {getQuickHelpPrompts().slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-gray-600">{language === 'vi' ? 'Gợi ý:' : 'Suggestions:'}</div>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInputMessage(suggestion)}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-gray-600">{language === 'vi' ? 'Thao tác nhanh:' : 'Quick Actions:'}</div>
                    <div className="flex flex-wrap gap-2">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (action.type === 'navigate') {
                              window.location.href = action.action;
                            } else if (action.type === 'help') {
                              setInputMessage(language === 'vi' ? `Hỗ trợ về ${action.label}` : `Help with ${action.label}`);
                            }
                          }}
                          className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {(isTyping || (isLoading && !isGenerating)) && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-200 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{language === 'vi' ? 'AI đang nhập...' : 'AI is typing...'}</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
          
          {/* Scroll to bottom button - follows scroll position */}
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              className="absolute p-2 h-8 w-8 bg-blue-500 text-white hover:bg-blue-600 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110 hover:shadow-xl"
              style={{
                right: '16px',
                bottom: `${Math.max(20, Math.min(380, scrollPosition + 80))}px`,
                transform: 'translateY(-50%)',
                opacity: 0.9
              }}
              title={language === 'vi' ? 'Cuộn xuống cuối' : 'Scroll to bottom'}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          )}
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
                placeholder={language === 'vi' ? 'Nhập tin nhắn...' : 'Type a message...'}
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
                 onClick={isGenerating ? handleStopGeneration : handleSendMessage}
                 disabled={!inputMessage.trim() && !isGenerating}
                 className={`p-2 h-8 w-8 rounded-full transition-all duration-200 ${
                   isGenerating 
                     ? 'bg-red-500 text-white hover:bg-red-600' 
                     : 'bg-blue-500 text-white hover:bg-blue-600'
                 } disabled:opacity-50 disabled:cursor-not-allowed`}
               >
                 {isGenerating ? (
                   <Square className="w-4 h-4" />
                 ) : (
                   <Send className="w-4 h-4" />
                 )}
               </Button>
             </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default GlobalAIChatbox;


