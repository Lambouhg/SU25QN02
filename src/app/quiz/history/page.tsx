"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type AttemptRow = { 
  id: string; 
  status: string; 
  score?: number | null; 
  startedAt?: string; 
  completedAt?: string | null; 
  questionSet?: { name?: string | null } | null;
  timeUsed?: number;
  totalQuestions?: number;
};

type QuizDetail = {
  id: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  itemsSnapshot: any[];
  responses: any[];
  questionSet: { name: string | null };
  sectionScores?: any;
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
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/attempts?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Load failed");
      setRows(j.data || []);
      setTotal(j.total || 0);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  const openDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/quiz/attempts/${id}`);
      const j = await res.json();
      if (res.ok) setDetail(j.data);
    } catch (e: any) {
      setError(e.message || String(e));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
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
          <Card className="mb-6 border-red-200 bg-red-50">
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
          <Card className="mb-6 border-0 shadow-lg">
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
                    {rows.filter(r => r.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-yellow-100 rounded-lg w-fit mx-auto mb-2">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {rows.filter(r => r.status === 'completed' && r.score !== null).length > 0 
                      ? Math.round(rows.filter(r => r.status === 'completed' && r.score !== null)
                          .reduce((sum, r) => sum + (r.score || 0), 0) / 
                          rows.filter(r => r.status === 'completed' && r.score !== null).length)
                      : 0
                    }
                  </div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {rows.filter(r => r.status === 'completed').length > 0 
                      ? Math.round((rows.filter(r => r.status === 'completed').length / total) * 100)
                      : 0
                    }%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz History List */}
        <Card className="border-0 shadow-lg">
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
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No quiz attempts yet</h3>
                <p className="text-gray-500">Start your first quiz to see your history here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((attempt) => {
                  const statusBadge = getStatusBadge(attempt.status);
                  const totalQuestions = attempt.itemsSnapshot?.length || 0;
                  
                  return (
                    <div
                      key={attempt.id}
                      className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {attempt.questionSet?.name || 'Practice Quiz'}
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
                              <Target className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {totalQuestions} questions
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-gray-500" />
                              <span className={`font-medium ${
                                attempt.score !== null 
                                  ? getScoreColor(attempt.score, totalQuestions)
                                  : 'text-gray-500'
                              }`}>
                                {attempt.score !== null 
                                  ? `${attempt.score}/${totalQuestions}` 
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > pageSize && (
          <Card className="border-0 shadow-lg">
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

        {/* Detail Modal */}
        {detail && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Quiz Details</h2>
                    <p className="text-sm text-gray-600">{detail.questionSet?.name || 'Practice Quiz'}</p>
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
                <QuizDetailContent detail={detail} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for displaying quiz detail content
function QuizDetailContent({ detail }: { detail: QuizDetail }) {
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
  const correctAnswers = detail.score || 0;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{correctAnswers}/{totalQuestions}</div>
            <div className="text-sm text-gray-600">Score</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(correctAnswers, totalQuestions)}`}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
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
      <Card className="border-0 shadow-sm">
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
              <span className="font-medium">{detail.questionSet?.name || 'Practice Quiz'}</span>
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
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800">Question Review</h3>
          <p className="text-sm text-gray-600">Review your answers and see the correct solutions</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detail.itemsSnapshot?.map((question: any, index: number) => {
              const userResponse = detail.responses?.find((r: any) => r.questionId === question.questionId);
              const userAnswers = userResponse?.answer || [];
              const userAnswerIndices = Array.isArray(userAnswers) ? userAnswers : [userAnswers];
              
              return (
                <div key={question.questionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1">
                      {userAnswerIndices.length > 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
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
                        {question.options?.map((option: any, optionIndex: number) => {
                          const isUserAnswer = userAnswerIndices.includes(optionIndex);
                          const isCorrect = option.isCorrect;
                          
                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border-2 ${
                                isUserAnswer && isCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : isUserAnswer && !isCorrect
                                  ? 'border-red-500 bg-red-50'
                                  : isCorrect
                                  ? 'border-green-300 bg-green-25'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span className="text-gray-800">{option.text}</span>
                                {isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                                {isUserAnswer && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {userAnswerIndices.length > 0 && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-600">Your answer: </span>
                          <span className="font-medium">
                            {userAnswerIndices.map(idx => String.fromCharCode(65 + idx)).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


