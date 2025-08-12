import React from "react";
import { InterviewChat } from '@/components/ui/test-mode/InterviewChat';
import ReactMarkdown from 'react-markdown';

interface InterviewScreenProps {
  position: string;
  conversation: { role: string; content: string }[];
  message: string;
  isAiThinking: boolean;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  messageListRef: React.RefObject<HTMLDivElement | null>;
  duration: number;
  realTimeScores: Record<string, number>;
  lastFeedback: string | null;
  onEndInterview?: (timeLeft: number) => void;
  isReviewing?: boolean; // Thêm prop để biết đang review
  reviewCountdown?: number; // Thêm countdown
  officialQuestionCount?: number; // Số câu hỏi đã hỏi
  maxQuestions?: number; // Số câu hỏi tối đa
}

const InterviewScreen: React.FC<InterviewScreenProps> = (props) => {
  // Convert conversation to ChatMessage format
  const chatMessages = props.conversation.map((msg, idx) => ({
    id: idx.toString(),
    sender: (msg.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
    text: msg.content,
  }));

  // Convert realTimeScores to expected format
  const formattedScores = {
    fundamental: props.realTimeScores.fundamental || 0,
    logic: props.realTimeScores.logic || 0,
    language: props.realTimeScores.language || 0,
    suggestions: {
      fundamental: '',
      logic: '',
      language: ''
    }
  };

  return (
    <>
      <InterviewChat 
        {...props} 
        conversation={chatMessages}
        realTimeScores={formattedScores}
        onEndInterview={props.onEndInterview}
        isReviewing={props.isReviewing}
        reviewCountdown={props.reviewCountdown}
        officialQuestionCount={props.officialQuestionCount}
        maxQuestions={props.maxQuestions}
      />
      {props.lastFeedback && (
        <div className="mt-8 w-full flex justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-blue-200 bg-white shadow-md p-7 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
              </span>
              <span className="font-bold text-lg text-blue-700">AI Feedback</span>
            </div>
            <div className="prose prose-blue max-w-none text-gray-800 text-base">
              <ReactMarkdown>{props.lastFeedback}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
      
      {/* Review countdown notification */}
      {props.isReviewing && props.reviewCountdown !== undefined && props.reviewCountdown > 0 && (
        <div className="mt-4 w-full flex justify-center">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 shadow-md p-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="font-bold text-lg text-orange-700">Review Time</span>
            </div>
            <p className="text-center text-orange-800">
              Please take a moment to review your answers. Interview will end automatically in{' '}
              <span className="font-bold text-2xl text-orange-600">{props.reviewCountdown}</span> seconds.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default InterviewScreen;