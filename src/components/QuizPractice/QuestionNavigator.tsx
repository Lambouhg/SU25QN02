"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, BookmarkCheck, Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';

interface QuestionStatus {
  questionIndex: number;
  isAnswered: boolean;
  isBookmarked?: boolean;
}

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  questionStatuses?: QuestionStatus[];
  onQuestionSelect?: (questionIndex: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  timeLeft?: number;
  className?: string;
}

export default function QuestionNavigator({
  totalQuestions,
  currentQuestionIndex,
  questionStatuses = [],
  onQuestionSelect = () => {}, // Default empty function
  onPrevious = () => {},
  onNext = () => {},
  onSubmit = () => {},
  timeLeft,
  className = ""
}: QuestionNavigatorProps) {
  const answeredCount = questionStatuses?.filter(q => q.isAnswered)?.length || 0;
  const bookmarkedCount = questionStatuses?.filter(q => q.isBookmarked)?.length || 0;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionButtonStyle = (index: number, status: QuestionStatus) => {
    const isCurrent = index === currentQuestionIndex;
    const isAnswered = status.isAnswered;

    let baseStyle = "w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 relative ";
    
    if (isCurrent) {
      baseStyle += "bg-blue-600 text-white shadow-lg scale-110 ring-2 ring-blue-300 ";
    } else if (isAnswered) {
      baseStyle += "bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200 ";
    } else {
      baseStyle += "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200 hover:border-gray-300 ";
    }

    return baseStyle;
  };

  return (
    <Card className={`${className} border-0 shadow-lg sticky top-4`}>
      <CardHeader className="pb-4 px-4">
        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Circle className="w-4 h-4 text-white" />
          </div>
          Question Navigator
        </CardTitle>
        
        {/* Timer display */}
        {timeLeft !== undefined && timeLeft !== null && timeLeft >= 0 && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            timeLeft <= 30 
              ? 'bg-red-100 border-2 border-red-300' 
              : timeLeft <= 60 
                ? 'bg-orange-100 border border-orange-200' 
                : 'bg-blue-50 border border-blue-200'
          }`}>
            <Clock className={`w-4 h-4 ${
              timeLeft <= 30 
                ? 'text-red-600' 
                : timeLeft <= 60 
                  ? 'text-orange-600' 
                  : 'text-blue-600'
            }`} />
            <span className={`font-mono text-sm font-semibold ${
              timeLeft <= 30 
                ? 'text-red-700' 
                : timeLeft <= 60 
                  ? 'text-orange-700' 
                  : 'text-blue-700'
            }`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Progress stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Progress:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {currentQuestionIndex + 1} / {totalQuestions}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Answered:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {answeredCount} / {totalQuestions}
            </Badge>
          </div>
          
          {bookmarkedCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bookmarked:</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <BookmarkCheck className="w-3 h-3 mr-1" />
                {bookmarkedCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Question grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Questions:</h4>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }, (_, index) => {
              const status = questionStatuses?.find(q => q.questionIndex === index) || 
                           { questionIndex: index, isAnswered: false, isBookmarked: false };
              
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={getQuestionButtonStyle(index, status)}
                  onClick={() => {
                    if (onQuestionSelect) {
                      onQuestionSelect(index);
                    }
                  }}
                  title={`Question ${index + 1}${status.isAnswered ? ' (Answered)' : ''}${status.isBookmarked ? ' (Bookmarked)' : ''}`}
                >
                  {index + 1}
                  {status.isAnswered && (
                    <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 text-green-600 bg-white rounded-full" />
                  )}
                  {status.isBookmarked && (
                    <BookmarkCheck className="w-3 h-3 absolute -bottom-1 -right-1 text-yellow-600 bg-white rounded-full" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Navigation:</h5>
          
          <div className="space-y-2">
            {/* Previous and Next buttons row */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1 flex items-center justify-center gap-1 text-xs"
              >
                <ChevronLeft className="w-3 h-3" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
                className="flex-1 flex items-center justify-center gap-1 text-xs"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Submit button */}
            <Button
              onClick={onSubmit}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center justify-center gap-2 text-xs py-2"
            >
              <Send className="w-3 h-3" />
              Submit Quiz
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Legend:</h5>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-xs text-gray-600">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-xs text-gray-600">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
              <span className="text-xs text-gray-600">Not answered</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}