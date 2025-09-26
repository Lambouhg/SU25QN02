"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import QuizSetup from "@/components/QuizPractice/QuizSetup";
import QuizCard from "@/components/QuizPractice/QuizCard";
import QuizResults from "@/components/QuizPractice/QuizResults";
import KeyboardShortcuts from "@/components/QuizPractice/KeyboardShortcuts";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type SnapshotItem = {
  questionId: string;
  stem: string;
  type: string;
  options?: { text: string }[];
};

type SetRow = { id: string; name: string; description?: string; topics?: string[]; fields?: string[]; skills?: string[]; level?: string; questionCount?: number };

type CategoryData = {
  id: string;
  name: string;
  topics: Array<{name: string; skills: string[]}>;
  skills: string[];
  fields: string[];
  levels: string[];
  questionCount: number;
};

export default function QuizPage() {
  const { userId } = useAuth();
  const [sets, setSets] = useState<SetRow[]>([]);
  const [mode, setMode] = useState<'quick'|'topic'|'company'>('company');
  const [category, setCategory] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [count, setCount] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [field, setField] = useState<string>("");
  const [skill, setSkill] = useState<string>("");
  const [facetCats, setFacetCats] = useState<string[]>([]);
  const [categoriesData, setCategoriesData] = useState<CategoryData[]>([]);
  const [facetTopics, setFacetTopics] = useState<string[]>([]);
  const [facetFields, setFacetFields] = useState<string[]>([]);
  const [questionSetId, setQuestionSetId] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [items, setItems] = useState<SnapshotItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [score, setScore] = useState<{ 
    score: number; 
    total: number; 
    details?: Array<{
      isRight: boolean;
      correctIdx: number[];
      givenIdx: number[];
    }>;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for enhanced UX
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [timeUsed, setTimeUsed] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // State for quiz retry functionality
  const [originalItems, setOriginalItems] = useState<SnapshotItem[]>([]); // Store original questions for retry
  const [attemptHistory, setAttemptHistory] = useState<Array<{
    attemptId: string;
    score: number;
    total: number;
    timeUsed: number;
    timestamp: Date;
  }>>([]);

  // Load public question sets
  useEffect(() => {
    (async () => {
      try {
        const sRes = await fetch("/api/quiz/sets?status=published", { cache: "no-store" });
        const sJson = await sRes.json();
        if (sRes.ok) {
          const list = sJson.data?.map((x: { 
            id: string; 
            name: string; 
            description?: string;
            topics?: string[]; 
            fields?: string[]; 
            skills?: string[]; 
            level?: string;
            _count?: { items: number };
          }) => ({ 
            id: x.id, 
            name: x.name, 
            description: x.description,
            topics: x.topics, 
            fields: x.fields, 
            skills: x.skills, 
            level: x.level,
            questionCount: x._count?.items || 0
          })) || [];
          setSets(list);
        }
        // Load categories data using new consolidated API
        const categoriesRes = await fetch("/api/quiz/categories", { cache: "no-store" });
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const categories: CategoryData[] = categoriesData.data || [];
          
          // Store categories data with hierarchy
          setCategoriesData(categories);
          
          // Extract facets from categories data
          const cats = categories.map(cat => cat.name);
          const allTopics = Array.from(new Set(categories.flatMap(cat => cat.topics?.map(t => t.name) || []))).filter((topic): topic is string => typeof topic === 'string');
          const allFields = Array.from(new Set(categories.flatMap(cat => cat.fields || []))).filter((field): field is string => typeof field === 'string');
          
          setFacetCats(cats);
          setFacetTopics(allTopics);
          setFacetFields(allFields);
        }
      } catch {}
    })();
  }, [questionSetId]);

  const start = useCallback(async () => {
    if (!userId) { setError("Bạn cần đăng nhập."); return; }
    setLoading(true);
    setError(null);
    setScore(null);
    setCurrentQuestionIndex(0);
    setBookmarkedQuestions(new Set());
    setTimeUsed(0);
    setStartTime(Date.now());
    
    try {
      const payload: Record<string, unknown> = { mode }; // Always include mode
      console.log("Debug - Quiz start:", { mode, questionSetId, category, topic, count, level, field, skill });
      
      if (mode === 'company') {
        if (!questionSetId) {
          setError("Vui lòng chọn bộ câu hỏi để bắt đầu.");
          return;
        }
        payload.questionSetId = questionSetId;
      } else {
        if (category) payload.category = category;
        if (topic) payload.topic = topic;
        if (count) payload.count = Number(count);
        if (level) payload.level = level;
        if (field) payload.field = field;
        if (skill) payload.skill = skill;
      }
      
      console.log("Debug - Payload sent to API:", payload);
      
      const res = await fetch("/api/quiz/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Start failed");
      setAttemptId(j.data.attemptId);
      const quizItems = j.data.items || [];
      setItems(quizItems);
      setOriginalItems(quizItems); // Save original items for retry
      // Set timer: use API timeLimit or default to 30 minutes for the entire quiz
      const defaultTimeLimit = (quizItems.length || 10) * 120; // 2 minutes per question
      setTimeLeft(j.data.timeLimit || defaultTimeLimit);
      setAnswers({});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [userId, mode, questionSetId, category, topic, count, level, field, skill]);

  const submit = useCallback(async () => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    try {
      const responses = Object.entries(answers).map(([qid, arr]) => ({ questionId: qid, answer: arr }));
      const res = await fetch("/api/quiz/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, responses }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Submit failed");
      const scoreResult = { score: j.data.score, total: j.data.total, details: j.data.details };
      setScore(scoreResult);
      
      // Use server-calculated timeUsed instead of client timer
      const serverTimeUsed = j.data.timeUsed || timeUsed;
      setTimeUsed(serverTimeUsed);
      
      // Add to attempt history
      if (attemptId) {
        setAttemptHistory(prev => [...prev, {
          attemptId,
          score: j.data.score,
          total: j.data.total,
          timeUsed: serverTimeUsed,
          timestamp: new Date()
        }]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [attemptId, answers, timeUsed]);

  // timer countdown and time tracking
  useEffect(() => {
    if (!attemptId || score) return; // Stop timer if quiz is completed
    
    const id = setInterval(() => {
      if (startTime && !score) { // Only update if quiz is not completed
        setTimeUsed(Math.floor((Date.now() - startTime) / 1000));
      }
      
      if (timeLeft !== null && !score) { // Only countdown if quiz is not completed
      setTimeLeft((t) => {
        if (t === null) return t;
        if (t <= 1) {
          clearInterval(id);
          submit();
          return 0;
        }
        return t - 1;
      });
      }
    }, 1000);
    
    return () => clearInterval(id);
  }, [timeLeft, attemptId, startTime, score, submit]);

  const setAnswer = useCallback((questionId: string, choiceIdx: number, multi: boolean) => {
    setAnswers((prev) => {
      const cur = prev[questionId] || [];
      if (multi) {
        const has = cur.includes(choiceIdx);
        return { ...prev, [questionId]: has ? cur.filter((x) => x !== choiceIdx) : [...cur, choiceIdx] };
      } else {
        return { ...prev, [questionId]: [choiceIdx] };
      }
    });
  }, []);

  // Navigation functions
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

  const goToQuestion = useCallback((questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < items.length) {
      setCurrentQuestionIndex(questionIndex);
    }
  }, [items.length]);

  // Generate question statuses for navigator
  const questionStatuses = useMemo(() => {
    const statuses = items.map((item, index) => ({
      questionIndex: index,
      isAnswered: Boolean(answers[item.questionId] && answers[item.questionId].length > 0),
      isBookmarked: bookmarkedQuestions.has(item.questionId)
    }));
    
    
    return statuses;
  }, [items, answers, bookmarkedQuestions]);

  const toggleBookmark = useCallback(() => {
    const currentQuestion = items[currentQuestionIndex];
    if (currentQuestion) {
      setBookmarkedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(currentQuestion.questionId)) {
          newSet.delete(currentQuestion.questionId);
        } else {
          newSet.add(currentQuestion.questionId);
        }
        return newSet;
      });
    }
  }, [currentQuestionIndex, items]);

  const restart = useCallback(() => {
    setAttemptId(null);
    setItems([]);
    setOriginalItems([]); // Clear original items when starting fresh
    setScore(null);
    setCurrentQuestionIndex(0);
    setBookmarkedQuestions(new Set());
    setTimeUsed(0);
    setStartTime(null);
    setTimeLeft(null);
    // Clear answers last to prevent UI flicker
    setAnswers({});
  }, []);

  // Handle exit quiz - same as restart but with different name for clarity
  const handleExitQuiz = useCallback(() => {
    restart();
  }, [restart]);

  // New function: Retry the same quiz with same questions
  const retryQuiz = useCallback(async () => {
    if (!originalItems.length || !userId) return;
    
    setLoading(true);
    setError(null);
    setScore(null);
    setCurrentQuestionIndex(0);
    setBookmarkedQuestions(new Set());
    setTimeUsed(0);
    setStartTime(Date.now());
    
    // Clear answers immediately to prevent UI flicker
    setAnswers({});
    
    try {
      // Call retry API with the original questions and attempt ID
      const res = await fetch("/api/quiz/retry", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          items: originalItems,
          originalAttemptId: attemptId // Pass current attemptId to reference original question set
        }) 
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Retry failed");
      
      setAttemptId(j.data.attemptId);
      
      // Shuffle the questions order for retry (optional - you can enable/disable this)
      const questionsToSet = j.data.items || [];
      
      // Uncomment below to shuffle question order on retry:
      // const shuffledQuestions = [...questionsToSet];
      // for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      //   const j = Math.floor(Math.random() * (i + 1));
      //   [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
      // }
      // setItems(shuffledQuestions);
      
      setItems(questionsToSet); // Keep original question order
      
      // Set timer: use default timing
      const defaultTimeLimit = (questionsToSet.length || 10) * 120; // 2 minutes per question
      setTimeLeft(defaultTimeLimit);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [originalItems, userId, attemptId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Quiz mode shortcuts
      if (attemptId && !score) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            goToPrevious();
            break;
          case 'ArrowRight':
            e.preventDefault();
            goToNext();
            break;
          case ' ':
            e.preventDefault();
            if (currentQuestionIndex === items.length - 1) {
              submit();
            } else {
              goToNext();
            }
            break;
          case 'b':
            e.preventDefault();
            toggleBookmark();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attemptId, score, goToPrevious, goToNext, currentQuestionIndex, items.length, submit, toggleBookmark]);

  // Quiz Phase - Full screen without DashboardLayout
  if (attemptId && !score && items.length > 0) {
    return (
      <>
        {/* Error Display */}
        {error && (
          <div className="fixed top-4 left-4 right-4 z-50">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">{error}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <QuizCard
          key={attemptId} // Force re-render when attemptId changes (retry)
          question={items[currentQuestionIndex]}
          questionIndex={currentQuestionIndex}
          totalQuestions={items.length}
          selectedAnswers={answers[items[currentQuestionIndex]?.questionId] || []}
          questionStatuses={questionStatuses}
          onAnswerChange={setAnswer}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onSubmit={submit}
          onQuestionSelect={goToQuestion}
          timeLeft={timeLeft ?? undefined}
          shuffleKey={attemptId} // Use attemptId as shuffle key to trigger re-shuffle on retry
          attemptId={attemptId} // Pass attemptId for exit functionality
          onExit={handleExitQuiz} // Pass exit handler
        />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts />
      </>
    );
  }

  // Setup and Results Phase - With DashboardLayout
  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 px-4 py-4">
        {/* Error Display */}
        {error && (
          <Card className="mb-4 bg-red-50/80 backdrop-blur-lg border-red-200/50 shadow-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Phase */}
        {!attemptId && !score && (
          <QuizSetup
            mode={mode}
            setMode={setMode}
            category={category}
            setCategory={setCategory}
            topic={topic}
            setTopic={setTopic}
            count={count}
            setCount={setCount}
            level={level}
            setLevel={setLevel}
            field={field}
            setField={setField}
            skill={skill}
            setSkill={setSkill}
            questionSetId={questionSetId}
            setQuestionSetId={setQuestionSetId}
            sets={sets}
            categoriesData={categoriesData}
            facetCats={facetCats}
            facetTopics={facetTopics}
            facetFields={facetFields}
            onStart={start}
            loading={loading}
          />
        )}

        {/* Results Phase */}
        {score && (
          <QuizResults
            items={items}
            answers={answers}
            score={score}
            timeUsed={timeUsed}
            attemptHistory={attemptHistory}
            onBack={restart}
            onRestart={retryQuiz} // Use retryQuiz instead of restart
          />
        )}

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts />
        </div>
      </div>
    </DashboardLayout>
  );
}


