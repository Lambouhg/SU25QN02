'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import QuizStart from './QuizStart';
import QuizSession from './QuizSession';
import QuizResult from './QuizResult';

export type QuizConfig = {
  field: string;
  topic: string;
  level: string;
  questionCount: number;
  timeLimit: number; // in minutes
};

export type Question = {
  id: string;
  question: string;
  answers: {
    content: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
};

export type Quiz = {
  id: string;
  questions: Question[];
  timeLimit: number;
  userAnswers: {
    questionId: string;
    answerIndex: number[];
    isCorrect: boolean;
  }[];
  score: number;
  totalQuestions: number;
  timeUsed: number;
};

interface QuizPanelProps {
  quizId?: string;
}

export default function QuizPanel({ quizId }: QuizPanelProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'config' | 'session' | 'result'>('config');
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    field: '',
    topic: '',
    level: '',
    questionCount: 10,
    timeLimit: 15,
  });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available fields and topics
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fieldsRes, topicsRes] = await Promise.all([
          fetch('/api/questions/fields'),
          fetch('/api/questions/topics')
        ]);
        const fieldsData = await fieldsRes.json();
        const topicsData = await topicsRes.json();
        setFields(fieldsData);
        setTopics(topicsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (quizId) {
      const fetchQuizById = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/quizzes/${quizId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch quiz");
          }
          const data = await response.json();
          setQuiz(data);
          setStep("session");
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
            toast.error(err.message);
          } else {
            setError('An unknown error occurred');
            toast.error('An unknown error occurred');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchQuizById();
    } else {
      setStep("config");
    }
  }, [quizId]);

  const startQuiz = async () => {
    if (!quizConfig.field || !quizConfig.topic || !userId) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: quizConfig.field,
          topic: quizConfig.topic,
          level: quizConfig.level,
          count: quizConfig.questionCount,
          timeLimit: quizConfig.timeLimit,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to start quiz');
      }

      const data = await res.json();
      setQuiz(data);
      setStep('session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
      console.error('Quiz start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (result: {
    userAnswers: { questionId: string; answerIndex: number[]; isCorrect: boolean }[];
    score: number;
    timeUsed: number;
  }) => {
    if (!quiz) return;

    try {
      // Save quiz result to database
      const response = await fetch(`/api/quizzes/${quiz.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz result');
      }

      const updatedQuiz = {
        ...quiz,
        userAnswers: result.userAnswers,
        score: result.score,
        timeUsed: result.timeUsed,
      };

      setQuiz(updatedQuiz);
      setStep('result');
    } catch (error) {
      console.error('Error saving quiz result:', error);
      // Still show the result even if saving fails
      const updatedQuiz = {
        ...quiz,
        userAnswers: result.userAnswers,
        score: result.score,
        timeUsed: result.timeUsed,
      };
      setQuiz(updatedQuiz);
      setStep('result');
    }
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    router.push('/quiz');
  };

  const handleViewProfile = () => {
    router.push('/profile');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-8">
        <p>Error: {error}</p>
        <button onClick={() => router.push('/quiz')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Try Again</button>
      </div>
    );
  }

  return (
    <div>
      
      {step === 'config' && (
        <QuizStart
          config={quizConfig}
          fields={fields}
          topics={topics}
          onChange={setQuizConfig}
          onStart={startQuiz}
          isLoading={loading}
          error={error}
        />
      )}

      {step === 'session' && quiz && (
        <QuizSession
          quiz={quiz}
          onComplete={handleQuizComplete}
          onCancel={() => setStep('config')}
        />
      )}

      {step === 'result' && quiz && (
        <QuizResult
          quiz={quiz}
          onNewQuiz={handleNewQuiz}
          onViewProfile={handleViewProfile}
        />
      )}
    </div>
  );
}