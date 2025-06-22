"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useCallback } from "react";

interface Question {
  _id: string;
  question: string;
  answers: { content: string; isCorrect: boolean }[];
  explanation?: string;
}

export default function QuizSaveQuestionPage() {
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedQuestions = useCallback(async () => {
    try {
      const response = await fetch("/api/users/saved-questions");
      const data = await response.json();
      setSavedQuestions(data);
    } catch (error) {
      console.error("Error fetching saved questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedQuestions();
  }, [fetchSavedQuestions]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Saved Questions</h2>
        {isLoading ? (
          <div className="animate-pulse">Loading...</div>
        ) : savedQuestions.length === 0 ? (
          <p className="text-gray-500">No saved questions available.</p>
        ) : (
          <div className="space-y-4">
            {savedQuestions.map((question) => (
              <div key={question._id} className="p-4 border rounded-md">
                <div className="font-medium mb-2">
                  {question.question}
                </div>
                <div className="space-y-1 text-sm">
                  {question.answers.map((answer, index) => (
                    <div key={index} className={answer.isCorrect ? 'text-green-700 font-bold' : ''}>
                      {answer.content}
                    </div>
                  ))}
                </div>
                {question.explanation && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Explanation:</span> {question.explanation}
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