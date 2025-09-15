"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Lightbulb,
  Target,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import KeyboardShortcuts from './KeyboardShortcuts';

interface QuizResultsProps {
  items: Array<{
    questionId: string;
    stem: string;
    type: string;
    options?: { text: string; isCorrect?: boolean }[];
  }>;
  answers: Record<string, number[]>;
  score: {
    score: number;
    total: number;
    details?: Array<{
      isRight: boolean;
      correctIdx: number[];
      givenIdx: number[];
    }>;
  };
  timeUsed?: number;
  attemptHistory?: Array<{
    attemptId: string;
    score: number;
    total: number;
    timeUsed: number;
    timestamp: Date;
  }>;
  onBack: () => void;
  onRestart: () => void;
}

export default function QuizResults({
  items,
  answers,
  score,
  timeUsed,
  attemptHistory,
  onBack,
  onRestart
}: QuizResultsProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanations, setShowExplanations] = useState(true);

  const progress = ((currentQuestionIndex + 1) / items.length) * 100;
  const currentQuestion = items[currentQuestionIndex];
  const userAnswers = answers[currentQuestion?.questionId] || [];
  const questionDetail = score.details?.[currentQuestionIndex];
  
  // Calculate percentage and determine if score is low
  const scorePercentage = (score.score / score.total) * 100;
  const isLowScore = scorePercentage < 60; // Consider below 60% as low score

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);

  const goToNext = useCallback(() => {
    if (currentQuestionIndex < items.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, items.length]);

  // Keyboard shortcuts for review mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          onBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, onBack, goToPrevious, goToNext]);

  const getScoreIcon = (isCorrect: boolean) => {
    return isCorrect ? (
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Quiz Review</h1>
        </div>
        <p className="text-gray-600 text-lg">Review your answers and learn from mistakes</p>
      </div>

      {/* Summary Stats */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800">{score.score}/{score.total}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {Math.round((score.score / score.total) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {score.details?.filter(d => d.isRight).length || 0}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {timeUsed ? formatTime(timeUsed) : '-'}
              </div>
              <div className="text-sm text-gray-600">Time Used</div>
            </div>
          </div>
          
          {/* Low Score Encouragement */}
          {isLowScore && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <Lightbulb className="w-5 h-5" />
                <span className="font-semibold">Keep trying! You can do better!</span>
              </div>
              <p className="text-sm text-yellow-700">
                Practice makes perfect. Review the explanations below and try again to improve your score.
              </p>
            </div>
          )}

          {/* Attempt History */}
          {attemptHistory && attemptHistory.length > 1 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Previous Attempts ({attemptHistory.length - 1})
              </h3>
              <div className="space-y-2">
                {attemptHistory.slice(0, -1).reverse().slice(0, 3).map((attempt, index) => (
                  <div key={attempt.attemptId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Attempt {attemptHistory.length - index - 1}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {attempt.score}/{attempt.total} ({Math.round((attempt.score / attempt.total) * 100)}%)
                      </span>
                      <span className="text-gray-500">
                        {formatTime(attempt.timeUsed)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Question Review</h2>
                <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {items.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanations(!showExplanations)}
                className={showExplanations ? 'bg-green-50 border-green-200 text-green-700' : ''}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {showExplanations ? 'Hide' : 'Show'} Explanations
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Progress: {Math.round(progress)}%</span>
            <span>{currentQuestionIndex + 1} / {items.length}</span>
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
                    Question {currentQuestionIndex + 1}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {currentQuestion.type.replace('_', ' ')}
                  </Badge>
                  {questionDetail && (
                    <Badge className={`${
                      questionDetail.isRight ? 'bg-green-500' : 'bg-red-500'
                    } text-white px-3 py-1`}>
                      <div className="flex items-center gap-1">
                        {getScoreIcon(questionDetail.isRight)}
                        {questionDetail.isRight ? 'Correct' : 'Incorrect'}
                      </div>
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
                  {currentQuestion.stem}
                </h3>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isUserAnswer = userAnswers.includes(index);
                const isCorrect = questionDetail?.correctIdx.includes(index) || false;
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isUserAnswer && isCorrect
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : isUserAnswer && !isCorrect
                        ? 'border-red-500 bg-red-50 shadow-md'
                        : isCorrect
                        ? 'border-green-300 bg-green-25'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <span className="font-medium text-gray-600">
                          {String.fromCharCode(65 + index)}.
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-800 leading-relaxed">{option.text}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {isUserAnswer && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Answer Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-800">Your Answer:</span>
              </div>
              <div className="text-sm text-gray-600">
                {userAnswers.length > 0 ? (
                  <span className="font-medium">
                    {userAnswers.map(idx => String.fromCharCode(65 + idx)).join(', ')}
                    {userAnswers.length > 0 && currentQuestion?.options && (
                      <span className="font-medium ml-1 text-blue-600">
                        ({userAnswers.map(idx => currentQuestion?.options?.[idx]?.text).filter(Boolean).join(', ')})
                      </span>
                    )}
                    {questionDetail && !questionDetail.isRight && (
                      <span className="font-medium text-green-600"> - Correct: {questionDetail.correctIdx.map(idx => String.fromCharCode(65 + idx)).join(', ')}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-red-600">No answer selected</span>
                )}
              </div>
            </div>

            {/* Explanation */}
            {showExplanations && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Explanation</h4>
                    <p className="text-yellow-700 text-sm">
                      {questionDetail?.isRight 
                        ? "Great job! You got this question correct. This demonstrates good understanding of the concept."
                        : "This question was incorrect. Review the correct answer and explanation to improve your understanding."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Quiz Setup
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="text-sm text-gray-600 px-3">
                {currentQuestionIndex + 1} / {items.length}
              </div>

              <Button
                variant="outline"
                onClick={goToNext}
                disabled={currentQuestionIndex === items.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={onRestart}
              className={`flex items-center gap-2 ${
                isLowScore 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              {isLowScore ? 'Try Again to Improve!' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts mode="review" />
    </div>
  );
}
