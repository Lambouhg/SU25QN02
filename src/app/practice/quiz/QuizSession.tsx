import { useState, useEffect, useCallback } from 'react';
import { Quiz, Question } from './QuizPanel';

interface QuizSessionProps {
  quiz: Quiz;
  onComplete: (result: {
    userAnswers: { questionId: string; answerIndex: number[]; isCorrect: boolean }[];
    score: number;
    timeUsed: number;
  }) => void;
  onCancel: () => void;
}

export default function QuizSession({ quiz, onComplete, onCancel }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string; answerIndex: number[]; isCorrect: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // Convert minutes to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const score = Math.round((userAnswers.filter((answer) => answer.isCorrect).length / quiz.questions.length) * 100);
    onComplete({
      userAnswers,
      score,
      timeUsed: quiz.timeLimit * 60 - timeLeft,
    });
  }, [isSubmitting, userAnswers, quiz.questions.length, quiz.timeLimit, timeLeft, onComplete]);

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
      (answer) => answer.questionId === currentQuestion._id
    );

    const isMultipleChoice = currentQuestion.answers.filter(a => a.isCorrect).length > 1;

    if (isMultipleChoice) {
      // Multiple choice logic
      if (currentAnswers) {
        const newAnswers = userAnswers.filter(
          (answer) => answer.questionId !== currentQuestion._id
        );
        if (!currentAnswers.answerIndex.includes(index)) {
          newAnswers.push({
            questionId: currentQuestion._id,
            answerIndex: [...currentAnswers.answerIndex, index],
            isCorrect: checkAnswer([...currentAnswers.answerIndex, index])
          });
        } else {
          const updatedIndexes = currentAnswers.answerIndex.filter(i => i !== index);
          if (updatedIndexes.length > 0) {
            newAnswers.push({
              questionId: currentQuestion._id,
              answerIndex: updatedIndexes,
              isCorrect: checkAnswer(updatedIndexes)
            });
          }
        }
        setUserAnswers(newAnswers);
      } else {
        setUserAnswers([
          ...userAnswers,
          {
            questionId: currentQuestion._id,
            answerIndex: [index],
            isCorrect: checkAnswer([index])
          }
        ]);
      }
    } else {
      // Single choice logic
      const newAnswers = userAnswers.filter(
        (answer) => answer.questionId !== currentQuestion._id
      );
      newAnswers.push({
        questionId: currentQuestion._id,
        answerIndex: [index],
        isCorrect: checkAnswer([index])
      });
      setUserAnswers(newAnswers);
    }
  };

  const checkAnswer = (selectedIndexes: number[]) => {
    const correctIndexes = currentQuestion.answers
      .map((answer, index) => answer.isCorrect ? index : -1)
      .filter(index => index !== -1);
    
    return (
      selectedIndexes.length === correctIndexes.length &&
      selectedIndexes.every(index => correctIndexes.includes(index))
    );
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
    (answer) => answer.questionId === currentQuestion._id
  );
  const isMultipleChoice = currentQuestion.answers.filter(a => a.isCorrect).length > 1;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-medium">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>
        <div className="text-lg font-medium text-red-600">
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">{currentQuestion.question}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {isMultipleChoice ? "Choose all correct answers" : "Choose one correct answer"}
        </p>
        <div className="space-y-3">
          {currentQuestion.answers.map((answer, index) => (
            <label
              key={index}
              className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                userAnswer?.answerIndex.includes(index)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            >
              <input
                type={isMultipleChoice ? "checkbox" : "radio"}
                name={isMultipleChoice ? undefined : "answer"}
                checked={userAnswer?.answerIndex.includes(index) || false}
                onChange={() => handleAnswerSelect(index)}
                className="mr-3"
              />
              <span>{answer.content}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="space-x-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 border border-gray-300 rounded-md ${
              currentQuestionIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === quiz.questions.length - 1}
            className={`px-4 py-2 border border-gray-300 rounded-md ${
              currentQuestionIndex === quiz.questions.length - 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}