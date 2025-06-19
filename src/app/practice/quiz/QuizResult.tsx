import { Quiz } from './QuizPanel';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface QuizResultProps {
  quiz: Quiz;
  onNewQuiz: () => void;
  onViewProfile: () => void;
}

export default function QuizResult({ quiz, onNewQuiz, onViewProfile }: QuizResultProps) {
  const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSavedQuestions = async () => {
      try {
        const response = await fetch('/api/users/saved-questions');
        if (!response.ok) throw new Error('Failed to fetch saved questions');
        const data = await response.json();
        setSavedQuestionIds(data.map((q: any) => q._id));
      } catch (error) {
        console.error('Error fetching saved questions:', error);
        toast.error('Failed to load saved questions.');
      }
    };

    fetchSavedQuestions();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSaveQuestion = async (questionId: string) => {
    try {
      const response = await fetch('/api/users/toggle-saved-question', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle save question');
      }

      const { message } = await response.json();

      if (savedQuestionIds.includes(questionId)) {
        setSavedQuestionIds(savedQuestionIds.filter(id => id !== questionId));
        toast.success(message || 'Question unsaved successfully!');
      } else {
        setSavedQuestionIds([...savedQuestionIds, questionId]);
        toast.success(message || 'Question saved successfully!');
      }
    } catch (error) {
      console.error('Error toggling saved question:', error);
      toast.error('Failed to save/unsave question.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {quiz.score >= 70 ? 'Congratulations! 🎉' : 'Quiz Completed!'}
        </h2>
        <p className="text-lg mb-4">Your score: {quiz.score}%</p>
        
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Questions</div>
            <div className="text-xl font-bold">
              {quiz.totalQuestions}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Correct</div>
            <div className="text-xl font-bold">
              {quiz.userAnswers.filter(a => a.isCorrect).length}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Time</div>
            <div className="text-xl font-bold">{formatTime(quiz.timeUsed)}</div>
          </div>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <button
            onClick={onNewQuiz}
            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start New Quiz
          </button>
          <button
            onClick={onViewProfile}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Profile
          </button>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Question Review</h3>
        <div className="space-y-4">
          {quiz.questions.map((question, qIndex) => {
            const userAnswer = quiz.userAnswers.find(a => a.questionId === question._id);
            const isCorrect = userAnswer?.isCorrect;
            const isSaved = savedQuestionIds.includes(question._id);

            return (
              <div
                key={question._id}
                className={`p-4 border rounded-md ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">
                    {qIndex + 1}. {question.question}
                  </div>
                  <button
                    onClick={() => handleSaveQuestion(question._id)}
                    className="ml-4 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title={isSaved ? "Unsave Question" : "Save Question"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill={isSaved ? "currentColor" : "none"}
                      stroke={isSaved ? "none" : "currentColor"}
                      strokeWidth="2"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {question.answers.map((answer, aIndex) => {
                    let answerClass = '';
                    const userSelectedThisAnswer = userAnswer?.answerIndex.includes(aIndex);
                    const isThisAnswerCorrect = answer.isCorrect;

                    if (userSelectedThisAnswer && isThisAnswerCorrect) {
                      answerClass = 'text-green-700 font-bold';
                    } else if (userSelectedThisAnswer && !isThisAnswerCorrect) {
                      answerClass = 'text-red-700 font-bold';
                    } else if (!userSelectedThisAnswer && isThisAnswerCorrect) {
                      answerClass = 'text-green-700';
                    }
                    
                    return (
                      <div key={aIndex} className={`pl-4 ${answerClass}`}>
                        {answer.content}
                      </div>
                    );
                  })}
                </div>
                {question.explanation && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}