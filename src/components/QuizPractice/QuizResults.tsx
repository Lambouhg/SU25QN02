"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Lightbulb,
  Trophy,
  Play,
  BookOpen,
  Bookmark,
  BookmarkCheck
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
  const [showExplanations] = useState(true);
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  // Calculate percentage and determine score level
  const scorePercentage = score.score * 10; // score.score is already on 10-point scale
  const isLowScore = scorePercentage < 70; // Below 70% shows encouragement
  const isHighScore = scorePercentage >= 70; // 70% and above shows congratulations

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };


  const handleBulkSave = async () => {
    if (selectedQuestions.size === 0 || isBulkSaving) return;
    
    setIsBulkSaving(true);
    
    try {
      const response = await fetch('/api/questions/saved-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionIds: Array.from(selectedQuestions) }),
      });

      if (response.ok) {
        const result = await response.json();
        setSavedQuestions(prev => {
          const newSet = new Set(prev);
          result.newlySaved?.forEach((id: string) => newSet.add(id));
          return newSet;
        });
        // Clear selection after saving
        setSelectedQuestions(new Set());
      } else {
        console.error('Failed to save questions');
      }
    } catch (error) {
      console.error('Error saving questions:', error);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const selectAllQuestions = () => {
    setSelectedQuestions(new Set(items.map(item => item.questionId)));
  };

  const clearSelection = () => {
    setSelectedQuestions(new Set());
  };


  // Keyboard shortcuts for review mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

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
      <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800">{score.score}/10</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {Math.round(score.score * 10)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {score.details?.filter(d => d.isRight).length || 0}/{score.total}
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
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-semibold">Keep trying! You can do better!</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Practice makes perfect. Review the explanations below and try again to improve your score.
                  </p>
                </div>
                <div className="ml-4 flex flex-col gap-3">
                  <Button
                    onClick={onRestart}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white animate-pulse flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again to Improve!
                  </Button>
                  <Button
                    onClick={onBack}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-6 py-2 text-base font-semibold rounded-xl"
                  >
                    <Play className="w-4 h-4" />
                    Start New Quiz
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* High Score Congratulations */}
          {isHighScore && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Trophy className="w-5 h-5" />
                    <span className="font-semibold">Congratulations! Great job!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Excellent performance! You&apos;ve mastered this topic. Keep up the great work!
                  </p>
                </div>
                <div className="ml-4 flex flex-col gap-3">
                  <Button
                    onClick={onRestart}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={onBack}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-6 py-2 text-base font-semibold rounded-xl"
                  >
                    <Play className="w-4 h-4" />
                    Start New Quiz
                  </Button>
                </div>
              </div>
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
                        {Math.round((attempt.score / 10) * attempt.total)}/{attempt.total} ({Math.round(attempt.score * 10)}%)
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

       {/* Bulk Save Controls */}
       <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
         <CardContent className="p-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <h3 className="text-lg font-semibold text-gray-800">Save Questions</h3>
               <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-600">
                   {selectedQuestions.size} of {items.length} selected
                 </span>
                 {selectedQuestions.size > 0 && (
                   <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                     {selectedQuestions.size} selected
                   </Badge>
                 )}
               </div>
             </div>
             <div className="flex items-center gap-3">
               <Button
                 onClick={selectAllQuestions}
                 variant="outline"
                 size="sm"
                 disabled={selectedQuestions.size === items.length}
                 className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
               >
                 Select All
               </Button>
               <Button
                 onClick={clearSelection}
                 variant="outline"
                 size="sm"
                 disabled={selectedQuestions.size === 0}
                 className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
               >
                 Clear
               </Button>
               <Button
                 onClick={handleBulkSave}
                 disabled={selectedQuestions.size === 0 || isBulkSaving}
                 className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white flex items-center gap-2"
               >
                 {isBulkSaving ? (
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <Bookmark className="w-4 h-4" />
                 )}
                 {isBulkSaving ? 'Saving...' : `Save ${selectedQuestions.size} Questions`}
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* All Questions Review */}
      <div className="space-y-8">
        {items.map((question, questionIndex) => {
          const questionDetail = score.details?.[questionIndex];
          const userAnswers = answers[question.questionId] || [];
          
           return (
             <Card key={questionIndex} className={`bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl ${
               selectedQuestions.has(question.questionId) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
             } ${
               savedQuestions.has(question.questionId) ? 'border-green-200' : ''
             }`}>
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
                         {savedQuestions.has(question.questionId) && (
                           <Badge className="bg-green-100 text-green-800 border-green-200">
                             <div className="flex items-center gap-1">
                               <BookmarkCheck className="w-3 h-3" />
                               Saved
                             </div>
                           </Badge>
                         )}
                       </div>
                       <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
                         {question.stem}
                       </h3>
                     </div>
                     <div className="ml-4 flex-shrink-0">
                       <Button
                         onClick={() => handleToggleQuestionSelection(question.questionId)}
                         variant="outline"
                         size="sm"
                         className={`${
                           selectedQuestions.has(question.questionId)
                             ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                             : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                         } transition-all duration-200`}
                       >
                         {selectedQuestions.has(question.questionId) ? (
                           <BookmarkCheck className="w-4 h-4" />
                         ) : (
                           <Bookmark className="w-4 h-4" />
                         )}
                         <span className="ml-2">
                           {selectedQuestions.has(question.questionId) ? 'Selected' : 'Select to Save'}
                         </span>
                       </Button>
                     </div>
                   </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {question.options?.map((option, optionIndex) => {
                      const isUserAnswer = userAnswers.includes(optionIndex);
                      const isCorrectOption = questionDetail?.correctIdx.includes(optionIndex) || false;
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            isUserAnswer && isCorrectOption
                              ? 'border-green-500 bg-green-50 shadow-md'
                              : isUserAnswer && !isCorrectOption
                              ? 'border-red-500 bg-red-50 shadow-md'
                              : isCorrectOption
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <span className="font-medium text-gray-600">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                            </div>
                            <div className="flex-1">
                              <span className="text-gray-800 leading-relaxed">{option.text}</span>
                            </div>
                            <div className="flex-shrink-0">
                              {isCorrectOption && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                              {isUserAnswer && !isCorrectOption && (
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
                          {userAnswers.length > 0 && question?.options && (
                            <span className="font-medium ml-1 text-blue-600">
                              ({userAnswers.map(idx => question?.options?.[idx]?.text).filter(Boolean).join(', ')})
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
          );
        })}
      </div>


      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts mode="review" />
    </div>
  );
}
