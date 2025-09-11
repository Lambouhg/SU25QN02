"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  Circle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb
} from 'lucide-react';

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
  onAnswerChange: (questionId: string, choiceIdx: number, multi: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  timeLeft?: number;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  showHint?: boolean;
  onToggleHint?: () => void;
  hint?: string;
}

export default function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswers,
  onAnswerChange,
  onPrevious,
  onNext,
  onSubmit,
  timeLeft,
  isBookmarked = false,
  onToggleBookmark,
  showHint = false,
  onToggleHint,
  hint
}: QuizCardProps) {
  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const isFirstQuestion = questionIndex === 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Progress */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Bookmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quiz Practice</h2>
                <p className="text-sm text-gray-600">Question {questionIndex + 1} of {totalQuestions}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {timeLeft !== null && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="font-mono text-lg font-semibold text-red-600">
                    {formatTime(timeLeft)}
                  </span>
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
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Progress: {Math.round(progress)}%</span>
            <span>{questionIndex + 1} / {totalQuestions}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Question Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Question {questionIndex + 1}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {question.type.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
                  {question.stem}
                </h3>
              </div>
              
              {onToggleHint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleHint}
                  className="ml-4"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Hint
                </Button>
              )}
            </div>

            {/* Hint */}
            {showHint && hint && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Hint</h4>
                    <p className="text-yellow-700 text-sm">{hint}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const isSelected = selectedAnswers.includes(index);
                const isMultiple = question.type === "multiple_choice";
                
                return (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
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
                    <div className="flex-1">
                      <span className="text-gray-800 leading-relaxed">{option.text}</span>
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
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirstQuestion}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </Button>
              
              {isLastQuestion ? (
                <Button
                  onClick={onSubmit}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-2 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

