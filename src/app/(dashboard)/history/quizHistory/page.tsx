"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Quiz {
  _id: string;
  field: string;
  topic: string;
  level: string;
  completedAt: string;
  score: number;
  timeUsed: number;
  timeLimit: number;
  userAnswers: {
    questionId: string;
    answerIndex: number[];
    isCorrect: boolean;
  }[];
  totalQuestions: number;
  retryCount: number;
  questions?: Question[];
}

interface Question {
  _id: string;
  question: string;
  answers: { content: string; isCorrect: boolean }[];
  explanation?: string;
}

export default function QuizHistoryPage() {
  const [quizHistory, setQuizHistory] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchQuizHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/quizzes");
      const data = await response.json();
      setQuizHistory(data);
    } catch (error) {
      console.error("Error fetching quiz history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizHistory();
  }, [fetchQuizHistory]);

  const handleViewQuizDetails = async (quiz: Quiz) => {
    if (selectedQuiz?._id === quiz._id) {
      setSelectedQuiz(null);
    } else {
      try {
        const response = await fetch(`/api/quizzes/${quiz._id}`);
        if (!response.ok) throw new Error('Failed to fetch quiz details');
        const quizDetails = await response.json();
        setSelectedQuiz(quizDetails);
      } catch (error) {
        console.error('Error fetching quiz details:', error);
      }
    }
  };

  const handleRetryQuiz = async (quiz: Quiz) => {
    try {
      const response = await fetch(`/api/quizzes/${quiz._id}/retry`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to retry quiz');
      const newQuiz = await response.json();
      router.push(`/practice/quiz/${newQuiz._id}`);
    } catch (error) {
      console.error('Error retrying quiz:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Practice History</h2>
        {isLoading ? (
          <div className="animate-pulse">Loading...</div>
        ) : quizHistory.length === 0 ? (
          <p className="text-gray-500">No quiz history available.</p>
        ) : (
          <div className="space-y-4">
            {quizHistory.map((quiz: Quiz) => (
              <div key={quiz._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">
                      {quiz.field} - {quiz.topic} - {quiz.level.charAt(0).toUpperCase() + quiz.level.slice(1)}
                    </h3>
                    <p className="text-gray-600">
                      Completed on: {new Date(quiz.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          quiz.score >= 70 
                            ? 'bg-green-100 text-green-800' 
                            : quiz.score >= 50 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        Score: {quiz.score}%
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        Questions: {quiz.userAnswers.filter(a => a.isCorrect).length} correct out of {quiz.totalQuestions}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewQuizDetails(quiz)}
                        className={`p-2 text-gray-600 rounded-full ${selectedQuiz?._id === quiz._id ? 'text-blue-600 bg-blue-50' : 'hover:text-blue-600 hover:bg-blue-50'}`}
                        title="View Quiz Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRetryQuiz(quiz)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full"
                        title="Retry Quiz"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {selectedQuiz?._id === quiz._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">Quiz Details</h4>
                        <p className="text-sm text-gray-600">Time Used: {Math.floor(quiz.timeUsed / 60)}m {quiz.timeUsed % 60}s</p>
                        <p className="text-sm text-gray-600">Time Limit: {quiz.timeLimit}m</p>
                        <p className="text-sm text-gray-600">Retry Count: {quiz.retryCount}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Question Review</h4>
                        {selectedQuiz.questions?.map((question, index) => (
                          <div key={question._id} className="mt-2">
                            <p className="text-sm font-medium">{index + 1}. {question.question}</p>
                            <div className="ml-4">
                              {question.answers.map((answer, aIndex) => {
                                const userAnswerSelected = selectedQuiz.userAnswers.find(
                                  (ua) => ua.questionId === question._id && ua.answerIndex.includes(aIndex)
                                );

                                let answerColorClass = 'text-gray-700';
                                if (answer.isCorrect) {
                                  answerColorClass = 'text-green-600 font-medium';
                                } else if (userAnswerSelected) {
                                  answerColorClass = 'text-red-600 font-medium';
                                }
                                return (
                                  <p key={aIndex} className={`text-sm ${answerColorClass}`}>
                                    {answer.content}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 