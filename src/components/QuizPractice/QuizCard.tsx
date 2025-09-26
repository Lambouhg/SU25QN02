"use client";

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { 
  Bookmark, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Timer,
  Target,
  Brain
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
  shuffleKey?: string; // Key to trigger re-shuffle of options
  attemptId?: string; // Add attemptId for exit functionality
  onExit?: () => void; // Add onExit callback
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
  shuffleKey, // Add shuffleKey prop
  attemptId,
  onExit
}: QuizCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  
  // Shuffle options while preserving correct mapping
  const [shuffledOptions, setShuffledOptions] = useState<Array<{
    text: string;
    originalIndex: number;
  }>>([]);
  
  // Initialize shuffled options when question changes
  useEffect(() => {
    if (question.options && question.options.length > 0) {
      const optionsWithIndex = question.options.map((option, index) => ({
        text: option.text,
        originalIndex: index
      }));
      
      // Fisher-Yates shuffle algorithm
      const shuffled = [...optionsWithIndex];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      setShuffledOptions(shuffled);
    }
  }, [question.questionId, question.options, shuffleKey]); // Re-shuffle when question or shuffleKey changes
  
  // Convert shuffled index back to original index for answer submission
  const handleAnswerSelect = (shuffledIndex: number, isMultiple: boolean) => {
    const originalIndex = shuffledOptions[shuffledIndex]?.originalIndex;
    if (originalIndex !== undefined) {
      onAnswerChange(question.questionId, originalIndex, isMultiple);
    }
  };
  
  // Convert original selected answers to shuffled positions for display
  const getShuffledSelectedAnswers = () => {
    return selectedAnswers.map(originalIndex => {
      const shuffledIndex = shuffledOptions.findIndex(option => option.originalIndex === originalIndex);
      return shuffledIndex !== -1 ? shuffledIndex : -1;
    }).filter(index => index !== -1);
  };
  
  // Generate questionStatuses if not provided
  const generateQuestionStatuses = (): QuestionStatus[] => {
    if (questionStatuses && questionStatuses.length > 0) {
      return questionStatuses;
    }
    
    // Create basic status array - you might need to modify this based on your data structure
    return Array.from({ length: totalQuestions }, (_, index) => ({
      questionIndex: index,
      isAnswered: index === questionIndex ? selectedAnswers.length > 0 : false,
      isBookmarked: markedQuestions.has(index)
    }));
  };
  
  const currentQuestionStatuses = generateQuestionStatuses();
  
  // Calculate progress based on actual answered questions
  // Use questionStatuses if available, otherwise calculate from current state
  const answeredCount = questionStatuses && questionStatuses.length > 0 
    ? questionStatuses.filter(q => q.isAnswered).length
    : currentQuestionStatuses.filter(q => q.isAnswered).length;
  
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const isFirstQuestion = questionIndex === 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Modal handlers
  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    onSubmit();
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = async () => {
    if (!attemptId) {
      setShowExitModal(false);
      if (onExit) onExit();
      return;
    }

    setIsExiting(true);
    try {
      // Call API to delete quiz attempt
      const response = await fetch(`/api/quiz/attempts/${attemptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete quiz attempt');
      }

      setShowExitModal(false);
      if (onExit) onExit();
    } catch (error) {
      console.error('Error deleting quiz attempt:', error);
      // Still exit even if API call fails
      setShowExitModal(false);
      if (onExit) onExit();
    } finally {
      setIsExiting(false);
    }
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  // Close modal when clicking outside
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowConfirmModal(false);
    }
  };

  const handleExitModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowExitModal(false);
    }
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) setShowConfirmModal(false);
        if (showExitModal) setShowExitModal(false);
      }
    };
    if (showConfirmModal || showExitModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showConfirmModal, showExitModal]);

  // Handle page reload/refresh - auto delete quiz attempt
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (attemptId) {
        try {
          // Use fetch with keepalive for reliable delivery during page unload
          fetch(`/api/quiz/attempts/${attemptId}`, {
            method: 'DELETE',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }).catch(error => {
            console.error('Error deleting quiz attempt on reload:', error);
          });
        } catch (error) {
          console.error('Error deleting quiz attempt on reload:', error);
        }
      }
    };

    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [attemptId]);

  const isMultipleChoice = question.type === "multiple_choice";

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="relative z-10 h-full">
      {/* Header - Fixed at top */}
      <div className="h-20 bg-white/95 backdrop-blur-lg border-b border-white/50 shadow-2xl">
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
              <p className="text-sm text-gray-600">
                Question {questionIndex + 1} of {totalQuestions}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {answeredCount}/{totalQuestions} answered
                </span>
              </div>
              </div>
            </div>
            
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft !== undefined && timeLeft < 300 ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
              }`}
            >
              <Timer className={`w-4 h-4 ${timeLeft !== undefined && timeLeft < 300 ? "text-red-600" : "text-blue-600"}`} />
              <span className={`text-lg font-bold ${timeLeft !== undefined && timeLeft < 300 ? "text-red-600" : "text-blue-600"}`}>
                {timeLeft !== undefined ? formatTime(timeLeft) : '--:--'}
                  </span>
                </div>

            <button
              onClick={handleExitClick}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              Exit
            </button>
          </div>
            </div>
          </div>
          
      {/* Progress Bar - Fixed below header */}
      <div className="h-16 bg-white/80 backdrop-blur-lg border-b border-white/50">
        <div className="h-full flex items-center px-6">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 w-full bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600 [&>div]:transition-all [&>div]:duration-300" 
            />
          </div>
        </div>
          </div>

      {/* Main Content - Scrollable area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Question Panel - Left side */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex-1 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/50 overflow-hidden flex flex-col">
            {/* Question Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex-1 pr-4">{question.stem}</h2>
                  <button
                    onClick={() => {
                      const newMarked = new Set(markedQuestions);
                      if (newMarked.has(questionIndex)) {
                        newMarked.delete(questionIndex);
                      } else {
                        newMarked.add(questionIndex);
                      }
                      setMarkedQuestions(newMarked);
                    }}
                    className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                      markedQuestions.has(questionIndex)
                        ? "bg-red-500 text-white shadow-lg hover:bg-red-600"
                        : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                    }`}
                    title={markedQuestions.has(questionIndex) ? "Remove mark" : "Mark as difficult"}
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  {isMultipleChoice ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium text-sm">Choose all correct answers</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium text-sm">Choose one correct answer</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Answers - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {shuffledOptions.map((option, shuffledIndex) => {
                const shuffledSelectedAnswers = getShuffledSelectedAnswers();
                const isSelected = shuffledSelectedAnswers.includes(shuffledIndex);
                
                return (
                  <label
                    key={shuffledIndex}
                        className={`group flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      isSelected
                            ? "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md shadow-purple-500/20"
                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white/50"
                    }`}
                  >
                        <input
                          type={isMultipleChoice ? "checkbox" : "radio"}
                          name={isMultipleChoice ? undefined : "answer"}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(shuffledIndex, isMultipleChoice)}
                          className="mt-0.5 mr-3 w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-base text-gray-800 group-hover:text-gray-900 transition-colors">
                          {option.text}
                        </span>
                    {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-purple-600 ml-auto" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
              
              {/* Navigation Buttons - Fixed at bottom */}
              <div className="p-6 border-t border-gray-200 bg-gray-50/50">
                <div className="flex justify-end items-center">
                  <div className="flex gap-2">
                    <button
              onClick={onPrevious}
              disabled={isFirstQuestion}
                      className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-medium transition-all duration-300 ${
                        isFirstQuestion
                          ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
                          : "border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                      }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
                    </button>

                    <button
                      onClick={onNext}
                      disabled={isLastQuestion}
                      className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-medium transition-all duration-300 ${
                        isLastQuestion
                          ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
                          : "border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend Panel - Right side */}
          <div className="w-64 bg-white/80 backdrop-blur-lg border-l border-white/50 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Notes</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Question Navigation */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Question</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalQuestions }, (_, index) => {
                    const isAnswered = currentQuestionStatuses[index]?.isAnswered || false;
                    const isCurrent = index === questionIndex;
                    const isMarked = markedQuestions.has(index);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => onQuestionSelect(index)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-all duration-300 border-2 flex-shrink-0 ${
                          isCurrent
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500 shadow-lg scale-110"
                            : isMarked
                            ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                            : isAnswered
                            ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Quiz Info</h3>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{question.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span className="font-medium">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-medium">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Left:</span>
                    <span className="font-medium">{timeLeft !== undefined ? formatTime(timeLeft) : '--:--'}</span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="mt-4">
                  <button
                    onClick={handleSubmitClick}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm">Submitting...</span>
                      </>
                    ) : (
                      <>
                  <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Submit Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Confirm Quiz Submission
              </h3>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to submit your quiz? Once submitted, you cannot change your answers.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">Total Questions:</span>
                  <span className="text-blue-900 font-bold">{totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-800 font-medium">Answered:</span>
                  <span className="text-blue-900 font-bold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-800 font-medium">Unanswered:</span>
                  <span className="text-blue-900 font-bold">{totalQuestions - answeredCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-800 font-medium">Time Remaining:</span>
                  <span className="text-blue-900 font-bold">{timeLeft !== undefined ? formatTime(timeLeft) : '--:--'}</span>
                </div>
        </div>
        
              {totalQuestions - answeredCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-6">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Warning: You have {totalQuestions - answeredCount} unanswered questions!
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubmit}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Confirm Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
        
      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleExitModalBackdropClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Confirm Exit Quiz
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to exit? All progress will be lost and you cannot recover your answers.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-800 font-medium">Total Questions:</span>
                  <span className="text-red-900 font-bold">{totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-red-800 font-medium">Answered:</span>
                  <span className="text-red-900 font-bold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-red-800 font-medium">Unanswered:</span>
                  <span className="text-red-900 font-bold">{totalQuestions - answeredCount}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelExit}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmExit}
                  disabled={isExiting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-gray-400 hover:from-red-600 hover:to-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all duration-200"
                >
                  {isExiting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Exiting...
                    </div>
                  ) : (
                    'Confirm Exit'
                  )}
                </button>
              </div>
        </div>
      </div>
        </div>
      )}
      </div>
    </div>
  );
}

