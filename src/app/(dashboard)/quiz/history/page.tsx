  "use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { 
  History, 
  Eye, 
  Calendar, 
  Clock, 
  Trophy, 
  Target,
  TrendingUp,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  X,
  CheckCircle2,
  XCircle
} from "lucide-react";

type QuestionSnapshot = {
  questionId: string;
  stem: string;
  type: string;
  options?: { text: string; isCorrect?: boolean }[];
};

type UserResponse = {
  questionId: string;
  answer: number[];
};

type AttemptRow = {
  id: string; 
  status: string; 
  score?: number | null; 
  startedAt?: string; 
  completedAt?: string | null; 
  questionSet?: { name?: string | null } | null;
  timeUsed?: number;
  totalQuestions?: number;
  itemsSnapshot?: QuestionSnapshot[];
};

type QuizDetail = {
  id: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  itemsSnapshot: QuestionSnapshot[];
  responses: UserResponse[];
  questionSet: { name: string | null };
  sectionScores?: Record<string, number>;
};

type QuestionDetail = {
  id: string;
  category: string;
  topics: string[];
  level: string;
  stem: string;
  type: string;
  options: { text: string; isCorrect?: boolean }[];
};

export default function QuizHistoryPage() {
  const { userId } = useAuth();
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuizDetail | null>(null);
  const [stats, setStats] = useState<{
    totalCompleted: number;
    avgScore: number;
    completionRate: number;
  }>({ totalCompleted: 0, avgScore: 0, completionRate: 0 });
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [quizTitles, setQuizTitles] = useState<Record<string, string>>({});

  const loadQuizTitles = useCallback(async (attempts: AttemptRow[]) => {
    const titles: Record<string, string> = {};
    
    for (const attempt of attempts) {
      // If it's a company quiz, use question set name
      if (attempt.questionSet?.name) {
        titles[attempt.id] = attempt.questionSet.name;
        continue;
      }

      // For practice quizzes, extract category, topic, level from itemsSnapshot
      if (attempt.itemsSnapshot && attempt.itemsSnapshot.length > 0) {
        try {
          // Get the first question to extract category, topic, level
          const firstQuestionId = attempt.itemsSnapshot[0].questionId;
          const response = await fetch(`/api/questions/${firstQuestionId}`);
          if (response.ok) {
            const questionData = await response.json();
            const category = questionData.category || 'Unknown';
            const topic = questionData.topics?.[0] || 'Unknown';
            const level = questionData.level || 'Unknown';
            titles[attempt.id] = `${category} - ${topic} - ${level}`;
          } else {
            titles[attempt.id] = 'Practice Quiz';
          }
        } catch (error) {
          console.error('Error fetching question details:', error);
          titles[attempt.id] = 'Practice Quiz';
        }
      } else {
        titles[attempt.id] = 'Practice Quiz';
      }
    }
    
    setQuizTitles(titles);
  }, []);

  const [questionDetails, setQuestionDetails] = useState<Record<string, QuestionDetail[]>>({});

  const loadQuestionDetails = useCallback(async (attempts: AttemptRow[]) => {
    const details: Record<string, QuestionDetail[]> = {};
    
    for (const attempt of attempts) {
      if (attempt.itemsSnapshot && attempt.itemsSnapshot.length > 0) {
        try {
          // Get question details for each question in the attempt
          const questionIds = attempt.itemsSnapshot.map(item => item.questionId);
          const questionPromises = questionIds.map(id => 
            fetch(`/api/questions/${id}`).then(res => res.json())
          );
          const questionData = await Promise.all(questionPromises);
          
          details[attempt.id] = questionData;
        } catch (error) {
          console.error('Error fetching question details:', error);
        }
      }
    }
    
    setQuestionDetails(details);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/attempts?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Load failed");
      setRows(j.data || []);
      setTotal(j.total || 0);
      setStats(j.stats || { totalCompleted: 0, avgScore: 0, completionRate: 0 });
      // Load quiz titles and question details after getting the data
      if (j.data && j.data.length > 0) {
        loadQuizTitles(j.data);
        loadQuestionDetails(j.data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loadQuizTitles, loadQuestionDetails]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  const openDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/quiz/attempts/${id}`);
      const j = await res.json();
      if (res.ok) setDetail(j.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return '-';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number | null, total: number) => {
    if (score === null) return 'text-gray-500';
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: 'Completed', color: 'bg-green-500', icon: <Trophy className="w-3 h-3" /> };
      case 'in_progress':
        return { text: 'In Progress', color: 'bg-blue-500', icon: <Clock className="w-3 h-3" /> };
      default:
        return { text: status, color: 'bg-gray-500', icon: <AlertCircle className="w-3 h-3" /> };
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <History className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Quiz History</h1>
          </div>
          <p className="text-gray-600 text-lg">Review your past quiz attempts and performance</p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 bg-red-50/80 backdrop-blur-lg border-red-200/50 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {rows.length > 0 && (
          <Card className="mb-6 bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-800">Performance Overview</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{total}</div>
                  <div className="text-sm text-gray-600">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalCompleted}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-yellow-100 rounded-lg w-fit mx-auto mb-2">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.avgScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.completionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
              </CardContent>
            </Card>
        )}

        {/* Quiz History List */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
          <CardHeader>
                <h2 className="text-xl font-semibold text-gray-800">Recent Attempts</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : rows.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No quiz attempts yet</h3>
                  <p className="text-gray-600 mb-6">Start your first quiz to see your history here!</p>
                  <button
                    onClick={() => (window.location.href = "/quiz")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Take a Quiz
                  </button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rows.map((attempt) => {
                  const statusBadge = getStatusBadge(attempt.status);

                  return (
                    <Card
                      key={attempt.id}
                      className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-800">
                              {quizTitles[attempt.id] || 'Loading...'}
                              </h3>
                            <Badge className={`${statusBadge.color} text-white px-3 py-1`}>
                                  <div className="flex items-center gap-1">
                                    {statusBadge.icon}
                                    {statusBadge.text}
                                  </div>
                                </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {attempt.startedAt ? formatDate(attempt.startedAt) : '-'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                  {attempt.startedAt && attempt.completedAt
                                    ? formatDuration(attempt.startedAt, attempt.completedAt)
                                  : '-'
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-gray-500" />
                               <span className={`font-medium ${
                                  attempt.score !== null && attempt.score !== undefined
                                   ? getScoreColor(attempt.score, 10)
                                   : 'text-gray-500'
                                }`}>
                                  {attempt.score !== null && attempt.score !== undefined
                                   ? `${attempt.score*10}%` 
                                   : '-'
                                 }
                               </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <Button
                            onClick={() => openDetail(attempt.id)}
                            disabled={loadingDetail}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                              <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > pageSize && (
          <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} attempts
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                    Page {page} of {Math.ceil(total / pageSize)}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        </div>
      </div>

      {/* Detail Modal - Outside DashboardLayout to overlay on top */}
        {detail && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/50">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                  <h2 className="text-xl font-bold text-gray-800">Quiz Details</h2>
                  <p className="text-sm text-gray-600">{quizTitles[detail.id] || detail.questionSet?.name || 'Practice Quiz'}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setDetail(null)}
                className="p-2"
                >
                <X className="w-4 h-4" />
                </Button>
              </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
                <QuizDetailContent detail={detail} quizTitles={quizTitles} questionDetails={questionDetails} />
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}

// Component for displaying quiz detail content
function QuizDetailContent({ detail, quizTitles, questionDetails }: { detail: QuizDetail; quizTitles: Record<string, string>; questionDetails: Record<string, QuestionDetail[]> }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return '-';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number | null, total: number) => {
    if (score === null) return 'text-gray-500';
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalQuestions = detail.itemsSnapshot?.length || 0;
  const scaledScore = detail.score || 0;
  const percentage = Math.round(scaledScore * 10); // Convert 10-point scale to percentage

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
             <div className="text-3xl font-bold text-gray-800">{Math.round((detail.score || 0) * totalQuestions / 10)}/{totalQuestions}</div>
             <div className="text-sm text-gray-600">Correct</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <Target className="w-6 h-6 text-green-600" />
              </div>
            <div className={`text-3xl font-bold ${getScoreColor(scaledScore, 10)}`}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-3">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {detail.startedAt && detail.completedAt 
                ? formatDuration(detail.startedAt, detail.completedAt)
                : '-'
              }
            </div>
            <div className="text-sm text-gray-600">Time Used</div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Info */}
      <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800">Quiz Information</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Started:</span>
              <span className="font-medium">{formatDate(detail.startedAt)}</span>
                </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {detail.completedAt ? formatDate(detail.completedAt) : 'Not completed'}
              </span>
                </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Question Set:</span>
              <span className="font-medium">{quizTitles[detail.id] || detail.questionSet?.name || 'Practice Quiz'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Status:</span>
              <Badge className={`${
                detail.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              } text-white px-2 py-1`}>
                    {detail.status}
                  </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800">Question Review</h3>
          <p className="text-sm text-gray-600">Review your answers and see the correct solutions</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detail.itemsSnapshot?.map((question: QuestionSnapshot, index: number) => {
              const userResponse = detail.responses?.find((r: UserResponse) => r.questionId === question.questionId);
              const userAnswers = userResponse?.answer || [];
              const userAnswerIndices = Array.isArray(userAnswers) ? userAnswers : [userAnswers];

              // Get question details from API
              const questionDetailsForAttempt = questionDetails[detail.id] || [];
              const questionDetail = questionDetailsForAttempt.find((q: QuestionDetail) => q.id === question.questionId);

              return (
                <Card key={question.questionId} className="bg-white/60 backdrop-blur-sm border-white/30 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-1">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-sm">
                          Question {index + 1}
                        </Badge>
                        <Badge variant="outline" className="text-sm capitalize">
                          {question.type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-800 mb-3">{question.stem}</h4>

                      <div className="space-y-2">
                        {questionDetail?.options?.map((option: { text: string; isCorrect?: boolean }, optionIndex: number) => {
                          const isCorrect = option.isCorrect;
                          const isUserAnswer = userAnswerIndices.includes(optionIndex);
                          const isUserCorrect = isUserAnswer && isCorrect;
                          const isUserWrong = isUserAnswer && !isCorrect;

                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                isUserCorrect
                                  ? 'border-green-500 bg-green-50 shadow-md' // User's correct answer
                                  : isUserWrong
                                  ? 'border-red-500 bg-red-50 shadow-md' // User's wrong answer
                                  : isCorrect
                                  ? 'border-green-300 bg-green-50' // Correct answer user didn't choose
                                  : 'border-gray-200 bg-gray-50' // Wrong answer user didn't choose
                              }`}
                            >
                                <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isUserAnswer
                                    ? isCorrect
                                      ? 'bg-green-500 text-white' // User's correct choice
                                      : 'bg-red-500 text-white' // User's wrong choice
                                    : 'bg-gray-200 text-gray-600' // Not user's choice
                                }`}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <span className="flex-1 text-gray-800">{option.text}</span>
                                <div className="flex items-center gap-2">
                                  {isUserAnswer && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isCorrect
                                        ? 'bg-green-100 text-green-800' // Correct
                                        : 'bg-red-100 text-red-800' // Incorrect
                                    }`}>
                                      {isCorrect ? 'Your Answer ✓' : 'Your Answer ✗'}
                                    </span>
                                  )}
                                  {isCorrect && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  )}
                                  {!isCorrect && !isUserAnswer && (
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-sm">Your answer:</span>
                            <span className="font-medium text-gray-800">
                              {userAnswerIndices.length > 0 
                                ? userAnswerIndices.map(idx => String.fromCharCode(65 + idx)).join(', ')
                                : 'No answer'
                              }
                            </span>
                          </div>
                          {(() => {
                            const correctAnswers = questionDetail?.options?.map((opt, idx) => opt.isCorrect ? idx : null).filter(val => val !== null) || [];
                            const userAnsweredCorrectly = userAnswerIndices.length > 0 && 
                              userAnswerIndices.length === correctAnswers.length &&
                              userAnswerIndices.every(answer => correctAnswers.includes(answer));
                            
                            if (userAnswerIndices.length > 0) {
                              return (
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                  userAnsweredCorrectly 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {userAnsweredCorrectly ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Correct
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4" />
                                      Incorrect
                                    </>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                                <XCircle className="w-4 h-4" />
                                No Answer
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


