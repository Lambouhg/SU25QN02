"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Star, MessageSquare, TrendingUp, CheckCircle, AlertCircle, Users, Sparkles, FileText, Code, Briefcase, Target } from "lucide-react";

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
  positionName: string;
  positionLevel: string;
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
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Đang tải đánh giá...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Không thể tải đánh giá</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleBackToHistory}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Quay lại lịch sử
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black py-8 px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToHistory}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại lịch sử
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-white">Đánh giá phỏng vấn</h1>
            <p className="text-gray-400">
              {typeof evaluation.positionName === 'string' ? evaluation.positionName : 'Không xác định'} - {typeof evaluation.positionLevel === 'string' ? evaluation.positionLevel : 'Không xác định'}
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Điểm tổng quan</h2>
            <div className="flex items-center justify-center gap-4 text-gray-400">
              <Clock className="h-5 w-5" />
              <span>{Math.floor((typeof evaluation.sessionDuration === 'number' ? evaluation.sessionDuration : 0) / 60)} phút {(typeof evaluation.sessionDuration === 'number' ? evaluation.sessionDuration : 0) % 60} giây</span>
              <MessageSquare className="h-5 w-5" />
              <span>{typeof evaluation.totalQuestions === 'number' ? evaluation.totalQuestions : 0} câu hỏi</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(typeof evaluation.overallScore === 'number' ? evaluation.overallScore : 0)}`}>
                    {(typeof evaluation.overallScore === 'number' ? evaluation.overallScore : 0).toFixed(1)}
                  </div>
                  <div className="text-white text-sm">/ 10</div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-semibold ${getScoreColor(typeof evaluation.overallScore === 'number' ? evaluation.overallScore : 0)} mb-2`}>
              {getScoreLabel(typeof evaluation.overallScore === 'number' ? evaluation.overallScore : 0)}
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Tổng quan về buổi phỏng vấn và đánh giá tổng thể
            </p>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Giao tiếp</h3>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.communicationScore === 'number' ? evaluation.communicationScore : 0)} mb-2`}>
              {(typeof evaluation.communicationScore === 'number' ? evaluation.communicationScore : 0).toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm">{getScoreLabel(typeof evaluation.communicationScore === 'number' ? evaluation.communicationScore : 0)}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Kỹ thuật</h3>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.technicalScore === 'number' ? evaluation.technicalScore : 0)} mb-2`}>
              {(typeof evaluation.technicalScore === 'number' ? evaluation.technicalScore : 0).toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm">{getScoreLabel(typeof evaluation.technicalScore === 'number' ? evaluation.technicalScore : 0)}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Giải quyết vấn đề</h3>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.problemSolvingScore === 'number' ? evaluation.problemSolvingScore : 0)} mb-2`}>
              {(typeof evaluation.problemSolvingScore === 'number' ? evaluation.problemSolvingScore : 0).toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm">{getScoreLabel(typeof evaluation.problemSolvingScore === 'number' ? evaluation.problemSolvingScore : 0)}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Tự tin</h3>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(typeof evaluation.confidenceScore === 'number' ? evaluation.confidenceScore : 0)} mb-2`}>
              {(typeof evaluation.confidenceScore === 'number' ? evaluation.confidenceScore : 0).toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm">{getScoreLabel(typeof evaluation.confidenceScore === 'number' ? evaluation.confidenceScore : 0)}</div>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              Điểm mạnh
            </h3>
            <ul className="space-y-3">
              {Array.isArray(evaluation.strengths) ? evaluation.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-300">
                    {typeof strength === 'string' ? strength : JSON.stringify(strength)}
                  </span>
                </li>
              )) : (
                <li className="text-gray-300">Không có dữ liệu điểm mạnh</li>
              )}
            </ul>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-400" />
              Cần cải thiện
            </h3>
            <ul className="space-y-3">
              {Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-300">
                    {typeof weakness === 'string' ? weakness : JSON.stringify(weakness)}
                  </span>
                </li>
              )) : (
                <li className="text-gray-300">Không có dữ liệu cần cải thiện</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Khuyến nghị cải thiện</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(evaluation.recommendations) ? evaluation.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <h4 className="font-semibold text-white">Khuyến nghị {index + 1}</h4>
                </div>
                <p className="text-gray-300 text-sm">
                  {typeof recommendation === 'string' ? recommendation : JSON.stringify(recommendation)}
                </p>
              </div>
            )) : (
              <div className="text-gray-300">Không có khuyến nghị</div>
            )}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-400" />
            Đánh giá chi tiết
          </h3>
          <div className="space-y-6">
            {typeof evaluation.detailedFeedback === 'string' ? (
              <p className="text-gray-300 leading-relaxed">
                {evaluation.detailedFeedback}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {evaluation.detailedFeedback.potential && (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      Tiềm năng
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {evaluation.detailedFeedback.potential}
                    </p>
                  </div>
                )}
                
                {evaluation.detailedFeedback.technical && (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Code className="h-5 w-5 text-green-400" />
                      Kỹ thuật
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {evaluation.detailedFeedback.technical}
                    </p>
                  </div>
                )}
                
                {evaluation.detailedFeedback.experience && (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-400" />
                      Kinh nghiệm
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {evaluation.detailedFeedback.experience}
                    </p>
                  </div>
                )}
                
                {evaluation.detailedFeedback.softSkills && (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-yellow-400" />
                      Kỹ năng mềm
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {evaluation.detailedFeedback.softSkills}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="h-6 w-6 text-green-400" />
            Khuyến nghị cải thiện
          </h3>
          <div className="space-y-4">
            {Array.isArray(evaluation.recommendations) ? evaluation.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {typeof recommendation === 'string' ? recommendation : JSON.stringify(recommendation)}
                </p>
              </div>
            )) : (
              <div className="text-gray-300 text-center py-8">Không có khuyến nghị</div>
            )}
          </div>
        </div>

        {/* Conversation History */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">Lịch sử hội thoại</h3>
              <p className="text-gray-400 text-sm mt-1">
                {Array.isArray(evaluation.conversationHistory) ? evaluation.conversationHistory.length : 0} tin nhắn
              </p>
            </div>
            <button
              onClick={() => setShowConversation(!showConversation)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {showConversation ? 'Ẩn hội thoại' : 'Xem hội thoại'}
            </button>
          </div>
          {showConversation && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
            {Array.isArray(evaluation.conversationHistory) ? evaluation.conversationHistory.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-2xl p-4 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.role === 'ai' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-yellow-600/20 text-yellow-300'
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
              <div className="text-gray-300 text-center py-8">Không có dữ liệu hội thoại</div>
            )}
            </div>
          )}
        </div>

        {/* Question Analysis */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Phân tích từng câu hỏi</h3>
          <div className="space-y-6">
            {Array.isArray(evaluation.questionAnalysis) ? evaluation.questionAnalysis.map((question, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Câu hỏi {index + 1}</h4>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
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
                    <h5 className="text-sm font-semibold text-gray-400 mb-2">Câu hỏi:</h5>
                    <p className="text-white">
                      {typeof question.question === 'string' ? question.question : JSON.stringify(question.question)}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-400 mb-2">Câu trả lời:</h5>
                    <p className="text-gray-300">
                      {typeof question.userAnswer === 'string' ? question.userAnswer : JSON.stringify(question.userAnswer)}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-400 mb-2">Đánh giá:</h5>
                    <p className="text-gray-300">
                      {typeof question.feedback === 'string' ? question.feedback : JSON.stringify(question.feedback)}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-gray-300">Không có phân tích câu hỏi</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewEvaluationPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Đang tải...</p>
        </div>
      </div>
    }>
      <InterviewEvaluationContent />
    </Suspense>
  );
};

export default InterviewEvaluationPage; 