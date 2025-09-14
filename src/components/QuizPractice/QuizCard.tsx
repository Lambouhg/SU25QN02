"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import QuestionNavigator from './QuestionNavigator';
import { 
  Clock, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';

interface QuestionStatus {
  questionIndex: number;
  isAnswered: boolean;
  isBookmarked?: boolean;
}

interface QuizCardProps {
  question: {
    questionId: string;
    stem: string;
    type: string;
    options?: { text: string }[];
  };
  questionIndex: number;
  totalQuestions: number;
  selectedAnswers: number[];
  questionStatuses?: QuestionStatus[];
  onAnswerChange: (questionId: string, choiceIdx: number, multi: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onQuestionSelect?: (questionIndex: number) => void;
  timeLeft?: number;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  showNavigator?: boolean; // Control navigator visibility
}

export default function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswers,
  questionStatuses = [],
  onAnswerChange,
  onPrevious,
  onNext,
  onSubmit,
  onQuestionSelect = () => {}, // Default empty function
  timeLeft,
  isBookmarked = false,
  onToggleBookmark,
  showNavigator = true // Default to true for backward compatibility
}: QuizCardProps) {
  const [showMobileNavigator, setShowMobileNavigator] = React.useState(false);
  
  // Generate questionStatuses if not provided
  const generateQuestionStatuses = (): QuestionStatus[] => {
    if (questionStatuses && questionStatuses.length > 0) {
      return questionStatuses;
    }
    
    // Create basic status array - you might need to modify this based on your data structure
    return Array.from({ length: totalQuestions }, (_, index) => ({
      questionIndex: index,
      isAnswered: index === questionIndex ? selectedAnswers.length > 0 : false,
      isBookmarked: index === questionIndex ? isBookmarked : false
    }));
  };
  
  const currentQuestionStatuses = generateQuestionStatuses();
  const answeredCount = currentQuestionStatuses.filter(q => q.isAnswered).length;
  const progress = (answeredCount / totalQuestions) * 100;
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const isFirstQuestion = questionIndex === 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add warning effects for low time
  const isCriticalTime = timeLeft !== undefined && timeLeft !== null && timeLeft <= 30;

  return (
    <div className="w-full max-w-full mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Quiz Content */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {/* Header with Progress */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 w-full">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Bookmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quiz Practice</h2>
                <p className="text-sm text-gray-600">Question {questionIndex + 1} of {totalQuestions}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {timeLeft !== undefined && timeLeft !== null && timeLeft >= 0 && (
                <div className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg shadow-sm transition-all duration-300 text-sm sm:text-base ${
                  isCriticalTime 
                    ? 'bg-red-100 border-2 border-red-300 animate-pulse' 
                    : timeLeft <= 60 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-white border border-gray-200'
                }`}>
                  <Clock className={`w-4 h-4 ${
                    isCriticalTime 
                      ? 'text-red-700' 
                      : timeLeft <= 60 
                        ? 'text-red-600' 
                        : 'text-blue-500'
                  }`} />
                  <span className={`font-mono text-sm sm:text-lg font-semibold ${
                    isCriticalTime 
                      ? 'text-red-800' 
                      : timeLeft <= 60 
                        ? 'text-red-700' 
                        : 'text-blue-600'
                  }`}>
                    {formatTime(timeLeft)}
                  </span>
                  {isCriticalTime && (
                    <span className="text-xs text-red-600 font-medium">⚠️ Time Critical!</span>
                  )}
                </div>
              )}
              
              {onToggleBookmark && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleBookmark}
                  className={`${isBookmarked ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : ''}`}
                >
                  {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
              )}
              
              {/* Navigator Toggle for Mobile */}
              {showNavigator && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileNavigator(!showMobileNavigator)}
                  className="xl:hidden"
                >
                  {showMobileNavigator ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Answered: {answeredCount} / {totalQuestions}</span>
            <span>Question {questionIndex + 1} / {totalQuestions}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card className="border-0 shadow-lg w-full">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Question Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Question {questionIndex + 1}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {question.type.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed break-words">
                  {question.stem}
                </h3>
              </div>
              
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const isSelected = selectedAnswers.includes(index);
                const isMultiple = question.type === "multiple_choice";
                
                return (
                  <label
                    key={index}
                    className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 w-full ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {isMultiple ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onAnswerChange(question.questionId, index, true)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="radio"
                          name={question.questionId}
                          checked={isSelected}
                          onChange={() => onAnswerChange(question.questionId, index, false)}
                          className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-800 leading-relaxed break-words">{option.text}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="border-0 shadow-lg w-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirstQuestion}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-end">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restart</span>
                <span className="sm:hidden">Reset</span>
              </Button>
              
              {isLastQuestion ? (
                <Button
                  onClick={onSubmit}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 sm:px-8 py-2 flex items-center gap-2 text-sm sm:text-base"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Submit Quiz</span>
                  <span className="sm:hidden">Submit</span>
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-2 flex items-center gap-2 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
        
        {/* Mobile Navigator - Collapsible */}
        {showNavigator && showMobileNavigator && (
          <div className="xl:hidden">
            <QuestionNavigator
              totalQuestions={totalQuestions}
              currentQuestionIndex={questionIndex}
              questionStatuses={currentQuestionStatuses}
              onQuestionSelect={(index) => {
                if (onQuestionSelect) {
                  onQuestionSelect(index);
                }
                setShowMobileNavigator(false); // Auto close after selection
              }}
              onPrevious={onPrevious}
              onNext={onNext}
              onSubmit={onSubmit}
              timeLeft={timeLeft}
            />
          </div>
        )}
        
        {/* Question Navigator - Hidden on mobile, shown on xl screens */}
        <div className={`hidden xl:block xl:w-80 ${!showNavigator ? 'xl:hidden' : ''}`}>
          <QuestionNavigator
            totalQuestions={totalQuestions}
            currentQuestionIndex={questionIndex}
            questionStatuses={currentQuestionStatuses}
            onQuestionSelect={onQuestionSelect}
            onPrevious={onPrevious}
            onNext={onNext}
            onSubmit={onSubmit}
            timeLeft={timeLeft}
          />
        </div>
      </div>
    </div>
  );
}

