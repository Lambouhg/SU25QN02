"use client"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, CheckCircle2, AlertTriangle, Timer, Target, Brain } from "lucide-react";
import type { Quiz } from "./QuizPanel";

interface QuizSessionProps {
  quiz: Quiz;
  onComplete: (result: {
    userAnswers: { questionId: string; answerIndex: number[] }[];
    score: number;
    timeUsed: number;
    questions?: any[];
    correctCount?: number;
    totalQuestions?: number;
  }) => void;
  onCancel: () => void;
}

export default function QuizSession({ quiz, onComplete, onCancel }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string; answerIndex: number[] }[]>([]);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // Convert minutes to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Gọi API submit để tính điểm server-side (hoạt động với cả secure quiz và retry quiz)
      const submitRes = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswers,
        }),
      });
      
      const result = await submitRes.json();
      if (result.error) {
        console.error('Error submitting quiz:', result.error);
        return;
      }

      onComplete({
        userAnswers,
        score: result.score,
        timeUsed: quiz.timeLimit * 60 - timeLeft,
        questions: result.questions,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, userAnswers, quiz.id, quiz.questions.length, quiz.timeLimit, timeLeft, onComplete]);

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    handleSubmit();
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  // Đóng modal khi click bên ngoài
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowConfirmModal(false);
    }
  };

  // Đóng modal khi nhấn ESC
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmModal) {
        setShowConfirmModal(false);
      }
    };

    if (showConfirmModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showConfirmModal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setTimeout(() => {
            handleSubmit();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit]);

  const handleAnswerSelect = (index: number) => {
    const currentAnswers = userAnswers.find(
      (answer) => answer.questionId === currentQuestion.id
    );

    // Sử dụng thông tin isMultipleChoice từ API
    const isMultipleChoice = (currentQuestion as any).isMultipleChoice || false;
    console.log('Debug - Question:', currentQuestion.question);
    console.log('Debug - isMultipleChoice:', isMultipleChoice);
    console.log('Debug - Current question object:', currentQuestion);

    if (isMultipleChoice) {
      // Multiple choice logic
      if (currentAnswers) {
        const newAnswers = userAnswers.filter(
          (answer) => answer.questionId !== currentQuestion.id
        );
        if (!currentAnswers.answerIndex.includes(index)) {
          newAnswers.push({
            questionId: currentQuestion.id,
            answerIndex: [...currentAnswers.answerIndex, index]
          });
        } else {
          const updatedIndexes = currentAnswers.answerIndex.filter(i => i !== index);
          newAnswers.push({
            questionId: currentQuestion.id,
            answerIndex: updatedIndexes
          });
        }
        setUserAnswers(newAnswers);
      } else {
        setUserAnswers([
          ...userAnswers,
          {
            questionId: currentQuestion.id,
            answerIndex: [index]
          }
        ]);
      }
    } else {
      // Single choice logic
      const newAnswers = userAnswers.filter(
        (answer) => answer.questionId !== currentQuestion.id
      );
      newAnswers.push({
        questionId: currentQuestion.id,
        answerIndex: [index]
      });
      setUserAnswers(newAnswers);
    }
  };



  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const userAnswer = userAnswers.find(
    (answer) => answer.questionId === currentQuestion.id
  );
  const isMultipleChoice = (currentQuestion as any).isMultipleChoice || false;
  
  // Debug log
  console.log(`Current question ${currentQuestionIndex + 1}: isMultipleChoice = ${isMultipleChoice}`);
  console.log('Current question data:', currentQuestion);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredQuestions = userAnswers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Interview Quiz</h1>
                    <p className="text-gray-600">
                      Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {answeredQuestions}/{quiz.questions.length} answered
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                      timeLeft < 300 ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <Timer className={`w-5 h-5 ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`} />
                    <span className={`text-lg font-bold ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl mb-8">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{currentQuestion.question}</h2>
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                {isMultipleChoice ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Choose all correct answers</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Choose one correct answer</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {currentQuestion.answers.map((answer, index) => (
                <label
                  key={index}
                  className={`group flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    userAnswer?.answerIndex.includes(index)
                      ? "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg shadow-purple-500/20"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white/50"
                  }`}
                >
                  <input
                    type={isMultipleChoice ? "checkbox" : "radio"}
                    name={isMultipleChoice ? undefined : "answer"}
                    checked={userAnswer?.answerIndex.includes(index) || false}
                    onChange={() => handleAnswerSelect(index)}
                    className="mt-1 mr-4 w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-lg text-gray-800 group-hover:text-gray-900 transition-colors">
                    {answer.content}
                  </span>
                  {userAnswer?.answerIndex.includes(index) && (
                    <CheckCircle2 className="w-5 h-5 text-purple-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center gap-2 px-6 py-3 border-2 rounded-xl font-medium transition-all duration-300 ${
                    currentQuestionIndex === 0
                      ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
                      : "border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === quiz.questions.length - 1}
                  className={`flex items-center gap-2 px-6 py-3 border-2 rounded-xl font-medium transition-all duration-300 ${
                    currentQuestionIndex === quiz.questions.length - 1
                      ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
                      : "border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>

                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-lg opacity-30 animate-pulse" />
                  <button
                    onClick={handleSubmitClick}
                    disabled={isSubmitting}
                    className="relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Submit Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <span className="text-blue-900 font-bold">{quiz.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Answered:</span>
                    <span className="text-blue-900 font-bold">{answeredQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Unanswered:</span>
                    <span className="text-blue-900 font-bold">{quiz.questions.length - answeredQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Time Remaining:</span>
                    <span className="text-blue-900 font-bold">{formatTime(timeLeft)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Time Used:</span>
                    <span className="text-blue-900 font-bold">{formatTime(quiz.timeLimit * 60 - timeLeft)}</span>
                  </div>
                </div>

                {quiz.questions.length - answeredQuestions > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-6">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Warning: You have {quiz.questions.length - answeredQuestions} unanswered questions!
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
      </div>
    </div>
  );
}