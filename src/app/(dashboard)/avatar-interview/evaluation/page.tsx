"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Star, MessageSquare, TrendingUp, CheckCircle, AlertCircle, Users, Sparkles, FileText, Code, Briefcase } from "lucide-react";

interface InterviewEvaluation {
  id: string;
  interviewId: string;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedFeedback: string | {
    potential?: string;
    technical?: string;
    experience?: string;
    softSkills?: string;
  };
  questionAnalysis: QuestionAnalysis[];
  conversationHistory: ConversationMessage[];
  sessionDuration: number;
  totalQuestions: number;
  completedAt: string;
  jobRoleTitle: string;
  jobRoleLevel: string;
}

interface ConversationMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface QuestionAnalysis {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  category: string;
}

const InterviewEvaluationContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');
  
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);

  useEffect(() => {
    if (interviewId) {
      fetchEvaluation(interviewId);
    } else {
      setError('Không tìm thấy ID phiên phỏng vấn');
      setLoading(false);
    }
  }, [interviewId]);

  const fetchEvaluation = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interviews/${id}/evaluation`);
      const data = await response.json();
      
      if (response.ok) {
        setEvaluation(data);
      } else {
        setError(data.message || 'Không thể tải đánh giá');
      }
    } catch{
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHistory = () => {
    router.push('/avatar-interview/history');
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-red-600';
  };



  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Xuất sắc';
    if (score >= 6) return 'Tốt';
    if (score >= 4) return 'Trung bình';
    return 'Cần cải thiện';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-blue-400 animate-ping opacity-30"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 font-medium text-lg">Đang tải đánh giá...</p>
            <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">Không thể tải đánh giá</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleBackToHistory}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
          >
            Quay lại lịch sử
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="relative">
        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 border-b border-slate-200/50 shadow-sm backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBackToHistory}
                className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Quay lại lịch sử
              </button>
            </div>
            <div className="text-right">
              <h1 className="text-lg font-semibold text-slate-900">Đánh giá phỏng vấn</h1>
              <p className="text-slate-600 text-sm">
                {typeof evaluation.jobRoleTitle === 'string' ? evaluation.jobRoleTitle : 'Không xác định'} - {typeof evaluation.jobRoleLevel === 'string' ? evaluation.jobRoleLevel : 'Không xác định'}
              </p>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Overall Score */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Điểm tổng quan</h2>
                <div className="flex items-center justify-center gap-6 text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{Math.floor((typeof evaluation.sessionDuration === 'number' ? evaluation.sessionDuration : 0) / 60)} phút {(typeof evaluation.sessionDuration === 'number' ? evaluation.sessionDuration : 0) % 60} giây</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{typeof evaluation.totalQuestions === 'number' ? evaluation.totalQuestions : 0} câu hỏi</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <div className={`text-5xl font-bold text-white`}>
                        {(typeof evaluation.overallScore === 'number' ? evaluation.overallScore : 0).toFixed(1)}
                      </div>
                      <div className="text-white/80 text-lg">/ 10</div>
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(typeof evaluation.overallScore === 'number' ? evaluation.overallScore : 0)} mb-3`}>
                  {getScoreLabel(typeof evaluation.overallScore === 'number' ? evaluation.overallScore : 0)}
                </div>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                  Tổng quan về buổi phỏng vấn và đánh giá tổng thể
                </p>
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Giao tiếp</h3>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.communicationScore === 'number' ? evaluation.communicationScore : 0)} mb-2`}>
                  {(typeof evaluation.communicationScore === 'number' ? evaluation.communicationScore : 0).toFixed(1)}
                </div>
                <div className="text-slate-600 font-medium">{getScoreLabel(typeof evaluation.communicationScore === 'number' ? evaluation.communicationScore : 0)}</div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Kỹ thuật</h3>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.technicalScore === 'number' ? evaluation.technicalScore : 0)} mb-2`}>
                  {(typeof evaluation.technicalScore === 'number' ? evaluation.technicalScore : 0).toFixed(1)}
                </div>
                <div className="text-slate-600 font-medium">{getScoreLabel(typeof evaluation.technicalScore === 'number' ? evaluation.technicalScore : 0)}</div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Giải quyết vấn đề</h3>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.problemSolvingScore === 'number' ? evaluation.problemSolvingScore : 0)} mb-2`}>
                  {(typeof evaluation.problemSolvingScore === 'number' ? evaluation.problemSolvingScore : 0).toFixed(1)}
                </div>
                <div className="text-slate-600 font-medium">{getScoreLabel(typeof evaluation.problemSolvingScore === 'number' ? evaluation.problemSolvingScore : 0)}</div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Tự tin</h3>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.confidenceScore === 'number' ? evaluation.confidenceScore : 0)} mb-2`}>
                  {(typeof evaluation.confidenceScore === 'number' ? evaluation.confidenceScore : 0).toFixed(1)}
                </div>
                <div className="text-slate-600 font-medium">{getScoreLabel(typeof evaluation.confidenceScore === 'number' ? evaluation.confidenceScore : 0)}</div>
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  Điểm mạnh
                </h3>
                <ul className="space-y-4">
                  {Array.isArray(evaluation.strengths) ? evaluation.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-700 leading-relaxed">
                        {typeof strength === 'string' ? strength : JSON.stringify(strength)}
                      </span>
                    </li>
                  )) : (
                    <li className="text-slate-500 text-center py-8">Không có dữ liệu điểm mạnh</li>
                  )}
                </ul>
              </div>

              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  Cần cải thiện
                </h3>
                <ul className="space-y-4">
                  {Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-700 leading-relaxed">
                        {typeof weakness === 'string' ? weakness : JSON.stringify(weakness)}
                      </span>
                    </li>
                  )) : (
                    <li className="text-slate-500 text-center py-8">Không có dữ liệu cần cải thiện</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl shadow-lg border border-emerald-200 p-8 mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Khuyến nghị cải thiện</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(evaluation.recommendations) ? evaluation.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900">Khuyến nghị {index + 1}</h4>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {typeof recommendation === 'string' ? recommendation : JSON.stringify(recommendation)}
                    </p>
                  </div>
                )) : (
                  <div className="text-slate-500 text-center py-8 col-span-full">Không có khuyến nghị</div>
                )}
              </div>
            </div>

            {/* Detailed Feedback */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                Đánh giá chi tiết
              </h3>
              <div className="space-y-6">
                {typeof evaluation.detailedFeedback === 'string' ? (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <p className="text-slate-700 leading-relaxed text-lg">
                      {evaluation.detailedFeedback}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {evaluation.detailedFeedback.potential && (
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                          </div>
                          Tiềm năng
                        </h4>
                        <p className="text-slate-700 leading-relaxed">
                          {evaluation.detailedFeedback.potential}
                        </p>
                      </div>
                    )}
                    
                    {evaluation.detailedFeedback.technical && (
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Code className="h-5 w-5 text-green-600" />
                          </div>
                          Kỹ thuật
                        </h4>
                        <p className="text-slate-700 leading-relaxed">
                          {evaluation.detailedFeedback.technical}
                        </p>
                      </div>
                    )}
                    
                    {evaluation.detailedFeedback.experience && (
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                          </div>
                          Kinh nghiệm
                        </h4>
                        <p className="text-slate-700 leading-relaxed">
                          {evaluation.detailedFeedback.experience}
                        </p>
                      </div>
                    )}
                    
                    {evaluation.detailedFeedback.softSkills && (
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-amber-600" />
                          </div>
                          Kỹ năng mềm
                        </h4>
                        <p className="text-slate-700 leading-relaxed">
                          {evaluation.detailedFeedback.softSkills}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation History */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 mb-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Lịch sử hội thoại</h3>
                  <p className="text-slate-600 text-sm mt-2">
                    {Array.isArray(evaluation.conversationHistory) ? evaluation.conversationHistory.length : 0} tin nhắn
                  </p>
                </div>
                <button
                  onClick={() => setShowConversation(!showConversation)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg"
                >
                  {showConversation ? 'Ẩn hội thoại' : 'Xem hội thoại'}
                </button>
              </div>
              {showConversation && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                {Array.isArray(evaluation.conversationHistory) ? evaluation.conversationHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl rounded-2xl p-4 shadow-md ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.role === 'ai' 
                        ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium">
                          {message.role === 'user' ? 'Bạn' : message.role === 'ai' ? 'AI Interviewer' : 'Hệ thống'}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-slate-500 text-center py-8">Không có dữ liệu hội thoại</div>
                )}
                </div>
              )}
            </div>

            {/* Question Analysis */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Phân tích từng câu hỏi</h3>
              <div className="space-y-6">
                {Array.isArray(evaluation.questionAnalysis) ? evaluation.questionAnalysis.map((question, index) => (
                  <div key={index} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Câu hỏi {index + 1}</h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                            {typeof question.category === 'string' ? question.category : JSON.stringify(question.category)}
                          </span>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(typeof question.score === 'number' ? question.score : 0)}`}>
                        {(typeof question.score === 'number' ? question.score : 0).toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-600 mb-2">Câu hỏi:</h5>
                        <p className="text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                          {typeof question.question === 'string' ? question.question : JSON.stringify(question.question)}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-semibold text-slate-600 mb-2">Câu trả lời:</h5>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          {typeof question.userAnswer === 'string' ? question.userAnswer : JSON.stringify(question.userAnswer)}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-semibold text-slate-600 mb-2">Đánh giá:</h5>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          {typeof question.feedback === 'string' ? question.feedback : JSON.stringify(question.feedback)}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-slate-500 text-center py-8">Không có phân tích câu hỏi</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewEvaluationPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-blue-400 animate-ping opacity-30"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 font-medium text-lg">Đang tải...</p>
            <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    }>
      <InterviewEvaluationContent />
    </Suspense>
  );
};

export default InterviewEvaluationPage; 