"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, Plus, Upload, Sparkles, 
  BarChart3, Users, TrendingUp, ArrowRight, Activity,
  FileText, Settings, Zap, CheckCircle, Clock, Target
} from "lucide-react";

interface QuestionBankStats {
  totalQuestions: number;
  questionSets: number;
  recentlyAdded: number;
  byLevel: {
    junior: number;
    middle: number;
    senior: number;
  };
  byType: {
    single_choice: number;
    multiple_choice: number;
    free_text: number;
    coding: number;
  };
}

const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  color,
  gradient 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  color: string;
  gradient?: boolean;
}) => (
  <Link href={href} className="block group">
    <div className={`relative overflow-hidden ${gradient ? 'bg-gradient-to-br from-' + color + '-500 to-' + color + '-600 text-white' : 'bg-white'} rounded-xl border-2 border-transparent hover:border-${color}-200 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}>
      {gradient && (
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 ${gradient ? 'bg-white/20' : 'bg-' + color + '-100'} rounded-lg backdrop-blur-sm`}>
            <Icon className={`w-6 h-6 ${gradient ? 'text-white' : 'text-' + color + '-600'}`} />
          </div>
          <ArrowRight className={`w-5 h-5 ${gradient ? 'text-white/70' : 'text-gray-400'} group-hover:translate-x-1 transition-transform duration-300`} />
        </div>
        <h3 className={`font-semibold text-lg mb-2 ${gradient ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm ${gradient ? 'text-white/90' : 'text-gray-600'} leading-relaxed`}>{description}</p>
      </div>
    </div>
  </Link>
);

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  gradient = false
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  color?: string;
  gradient?: boolean;
}) => (
  <div className={`relative overflow-hidden ${gradient ? 'bg-gradient-to-br from-' + color + '-500 to-' + color + '-600' : 'bg-white'} rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow duration-300`}>
    {gradient && (
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
    )}
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-sm font-medium ${gradient ? 'text-white/90' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${gradient ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`p-3 ${gradient ? 'bg-white/20' : 'bg-' + color + '-100'} rounded-lg backdrop-blur-sm`}>
          <Icon className={`w-7 h-7 ${gradient ? 'text-white' : 'text-' + color + '-600'}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${gradient ? 'bg-white/20' : 'bg-green-100'}`}>
            <TrendingUp className={`w-3 h-3 ${gradient ? 'text-white' : 'text-green-600'}`} />
            <span className={`text-xs font-medium ${gradient ? 'text-white' : 'text-green-600'}`}>+{trend.value}</span>
          </div>
          <span className={`text-xs ${gradient ? 'text-white/80' : 'text-gray-500'}`}>{trend.label}</span>
        </div>
      )}
    </div>
  </div>
);

export default function QuestionBankHomePage() {
  const [stats, setStats] = useState<QuestionBankStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/qb2/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      icon: Plus,
      title: "Manage Questions",
      description: "Create, edit, and organize individual questions with advanced filtering and search capabilities",
      href: "/admin/question-bank/questions",
      color: "blue",
      gradient: true
    },
    {
      icon: Users,
      title: "Question Sets",
      description: "Build curated question collections for specific roles, levels, and interview scenarios",
      href: "/admin/question-bank/sets",
      color: "green"
    },
    {
      icon: Sparkles,
      title: "AI Generator",
      description: "Generate high-quality questions automatically using advanced AI technology",
      href: "/admin/question-bank/generate",
      color: "purple",
      gradient: true
    },
    {
      icon: Upload,
      title: "Bulk Import",
      description: "Import multiple questions efficiently from Excel or CSV files with validation",
      href: "/admin/question-bank/import",
      color: "orange"
    },
    // Templates quick action removed
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Question Bank Management</h1>
                  <p className="text-blue-100 mt-2 text-lg">
                    Centralized hub for creating, managing, and organizing interview questions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>AI-Powered Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Smart Organization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Real-time Analytics</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <Link 
                href="/admin/question-bank/questions"
                className="inline-flex items-center gap-3 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create Question
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Questions"
              value={stats.totalQuestions}
              icon={MessageSquare}
              trend={{ value: stats.recentlyAdded, label: "this week" }}
              color="blue"
              gradient={true}
            />
            <StatCard
              title="Question Sets"
              value={stats.questionSets}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Junior Level"
              value={stats.byLevel.junior}
              icon={BarChart3}
              color="yellow"
            />
            <StatCard
              title="Senior Level"
              value={stats.byLevel.senior}
              icon={TrendingUp}
              color="red"
              gradient={true}
            />
          </div>
        ) : null}

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Detailed Stats */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Questions by Level */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Questions by Level
              </h3>
              <div className="space-y-4">
                {Object.entries(stats.byLevel).map(([level, count]) => {
                  const total = Object.values(stats.byLevel).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total * 100).toFixed(1) : '0';
                  return (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            level === 'junior' ? 'bg-green-500' :
                            level === 'middle' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-gray-700 capitalize font-medium">{level}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{count}</span>
                          <span className="text-sm text-gray-500 ml-1">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            level === 'junior' ? 'bg-green-500' :
                            level === 'middle' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Questions by Type */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Questions by Type
              </h3>
              <div className="space-y-4">
                {Object.entries(stats.byType).map(([type, count]) => {
                  const total = Object.values(stats.byType).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total * 100).toFixed(1) : '0';
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            type === 'single_choice' ? 'bg-blue-500' :
                            type === 'multiple_choice' ? 'bg-purple-500' :
                            type === 'free_text' ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="text-gray-700 font-medium">{type.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{count}</span>
                          <span className="text-sm text-gray-500 ml-1">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            type === 'single_choice' ? 'bg-blue-500' :
                            type === 'multiple_choice' ? 'bg-purple-500' :
                            type === 'free_text' ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity & Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tips Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Pro Tips & Best Practices
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-blue-800 font-medium">AI Generator Power</p>
                  <p className="text-blue-700 text-sm">Use AI Generator to quickly create questions for new technologies or frameworks with detailed explanations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-blue-800 font-medium">Smart Organization</p>
                  <p className="text-blue-700 text-sm">Organize questions into sets by job role and experience level for better interview structure and candidate assessment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-blue-800 font-medium">Bulk Operations</p>
                  <p className="text-blue-700 text-sm">Bulk import questions from Excel to save time when adding multiple questions with consistent formatting</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Integration
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-900">AI Interview System</p>
                  <p className="text-sm text-green-700">Questions automatically available for AI interviews</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-900">Question Bank API</p>
                  <p className="text-sm text-green-700">Ready for integration with external systems</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Ready</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-blue-900">Real-time Analytics</p>
                  <p className="text-sm text-blue-700">Track question usage and performance metrics</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}