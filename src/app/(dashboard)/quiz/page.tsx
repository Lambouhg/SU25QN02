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

type SetRow = { id: string; name: string };

export default function QuizPage() {
  const { userId } = useAuth();
  const [sets, setSets] = useState<SetRow[]>([]);
  const [mode, setMode] = useState<'quick'|'topic'|'company'>('company');
  const [category, setCategory] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [count, setCount] = useState<string>("10");
  const [level, setLevel] = useState<string>("");
  const [facetCats, setFacetCats] = useState<string[]>([]);
  const [facetTopics, setFacetTopics] = useState<string[]>([]);
  const [facetTags, setFacetTags] = useState<string[]>([]);
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

  // Load public question sets
  useEffect(() => {
    (async () => {
      try {
        const sRes = await fetch("/api/quiz/sets?status=published", { cache: "no-store" });
        const sJson = await sRes.json();
        if (sRes.ok) {
          const list = sJson.data?.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })) || [];
          setSets(list);
          if (list.length && !questionSetId) setQuestionSetId(list[0].id);
        }
        const fRes = await fetch("/api/quiz/facets", { cache: "no-store" });
        const fJson = await fRes.json();
        if (fRes.ok) {
          setFacetCats(fJson.data?.categories || []);
          setFacetTopics(fJson.data?.topics || []);
          setFacetTags(fJson.data?.tags || []);
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
      const payload: Record<string, unknown> = {};
      if (mode === 'company') {
        if (questionSetId) payload.questionSetId = questionSetId;
      } else {
        if (category) payload.category = category;
        if (topic) payload.topic = topic;
        if (tags) payload.tags = tags;
        if (count) payload.count = Number(count);
        if (level) payload.level = level;
      }
      const res = await fetch("/api/quiz/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Start failed");
      setAttemptId(j.data.attemptId);
      setItems(j.data.items || []);
      // Set timer: use API timeLimit or default to 30 minutes for the entire quiz
      const defaultTimeLimit = (j.data.items?.length || 10) * 120; // 2 minutes per question
      setTimeLeft(j.data.timeLimit || defaultTimeLimit);
      setAnswers({});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [userId, mode, questionSetId, category, topic, tags, count, level]);

  const submit = useCallback(async () => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    try {
      const responses = Object.entries(answers).map(([qid, arr]) => ({ questionId: qid, answer: arr }));
      const res = await fetch("/api/quiz/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, responses }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Submit failed");
      setScore({ score: j.data.score, total: j.data.total, details: j.data.details });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [attemptId, answers]);

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
    return items.map((item, index) => ({
      questionIndex: index,
      isAnswered: Boolean(answers[item.questionId] && answers[item.questionId].length > 0),
      isBookmarked: bookmarkedQuestions.has(item.questionId)
    }));
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
    setAnswers({});
    setScore(null);
    setCurrentQuestionIndex(0);
    setBookmarkedQuestions(new Set());
    setTimeUsed(0);
    setStartTime(null);
    setTimeLeft(null);
  }, []);

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

  return (
    <DashboardLayout>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg">
        <div className="px-4 py-4">
        {/* Error Display */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
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
            tags={tags}
            setTags={setTags}
            count={count}
            setCount={setCount}
            level={level}
            setLevel={setLevel}
            questionSetId={questionSetId}
            setQuestionSetId={setQuestionSetId}
            sets={sets}
            facetCats={facetCats}
            facetTopics={facetTopics}
            facetTags={facetTags}
            onStart={start}
            loading={loading}
          />
        )}

        {/* Quiz Phase */}
        {attemptId && !score && items.length > 0 && (
          <QuizCard
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
            isBookmarked={bookmarkedQuestions.has(items[currentQuestionIndex]?.questionId)}
            onToggleBookmark={toggleBookmark}
            showNavigator={true} // Show navigator during quiz
          />
        )}

        {/* Results Phase */}
        {score && (
          <QuizResults
            items={items}
            answers={answers}
            score={score}
            timeUsed={timeUsed}
            onBack={restart}
            onRestart={restart}
          />
        )}

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts />
        </div>
      </div>
    </DashboardLayout>
  );
}


