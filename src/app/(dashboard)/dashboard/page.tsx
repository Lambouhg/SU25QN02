"use client";

import { 
  Brain, FileText,
  TestTube, FileQuestion, TrendingUp,
  Clock, Award, Users, Home, BookOpen, Calendar, Settings
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { usePet } from '@/hooks/usePet';
import { PetDisplay } from '@/components/pet/PetDisplay';
import { getPetEvolutionStages } from '@/utils/petLogic';
import { ChartMultiAreaInteractive } from '@/components/ui/chart-multi-area-interactive';
import { ChartSingleLine } from '@/components/ui/chart-single-line';
import MagicDock from '@/components/ui/magicdock';
import { useRouter } from 'next/navigation';
import SkillsProgress from '@/components/dashboard/SkillsProgress';


interface DashboardSkillProgress {
  name: string;
  level: string;
  score: number;
  trend?: number | null;
  source: string;
  lastUpdated: Date;
  totalSessions: number;
  progress: Array<{
    date: Date;
    score: number;
    source?: string;
  }>;
  source: string;
  lastUpdated: Date;
  totalSessions: number;
}

interface ProgressData {
  stats: {
    totalInterviews: number;
    averageScore: number;
    studyStreak: number;
    totalStudyTime: number;
  };
  skillProgress: DashboardSkillProgress[];
  currentFocus: string[];
  nextMilestones: Array<{
    goal: string;
    targetDate: Date;
  }>;
  recommendations: string[];
  recentActivities?: Array<{
    type: string;
    score?: number;
    duration?: number;
    timestamp?: string | Date;
  }>;
  allActivities?: Array<{
    type: string;
    score?: number;
    duration?: number;
    timestamp?: string | Date;
  }>;
  allQuizActivities?: Array<{
    type: string;
    score?: number;
    duration?: number;
    timestamp?: string | Date;
  }>;
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  // User navigation items for MagicDock
  const userDockItems = [
    {
      id: 1,
      icon: <Home className="w-6 h-6 text-white" />,
      label: "Dashboard",
      description: "Main overview",
      onClick: () => router.push("/dashboard")
    },
    {
      id: 2,
      icon: <BookOpen className="w-6 h-6 text-white" />,
      label: "Review Question",
      description: "Question Bank",
      onClick: () => router.push("/review")
    },
    {
      id: 3,
      icon: <Calendar className="w-6 h-6 text-white" />,
      label: "Practice",
      description: "AI Bot",
      onClick: () => router.push("/avatar-interview")
    },
    {
      id: 4,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      label: "Analytics",
      description: "Progress insights",
      onClick: () => router.push("/detailed-analytics")
    },
    {
      id: 5,
      icon: <TestTube className="w-6 h-6 text-white" />,
      label: "API Test",
      description: "Test analytics API",
      onClick: () => router.push("/enhanced-analytics-test")
    },
    {
      id: 6,
      icon: <Settings className="w-6 h-6 text-white" />,
      label: "Profile",
      description: "Account settings",
      onClick: () => router.push("/profile")
    }
  ];

  // Multi-Line Chart State
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'session'>('day');
  const [lineMode, setLineMode] = useState<'score' | 'total'>('score');
  const [lineChartData, setLineChartData] = useState<Array<{
    period: string;
    quiz: number;
    test: number;
    interview: number;
  }>>([]);

  // New states for enhanced tracking
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [overallProgressData, setOverallProgressData] = useState<Array<{
    period: string;
    overall: number;
  }>>([]);
  const [improvementMetrics, setImprovementMetrics] = useState<{
    quiz: {
      percentage: number;
      trend: 'improving' | 'declining' | 'stable';
    };
    test: {
      percentage: number;
      trend: 'improving' | 'declining' | 'stable';
    };
    interview: {
      percentage: number;
      trend: 'improving' | 'declining' | 'stable';
    };
  } | null>(null);

  // --- STREAK FEATURE STATE & LOGIC ---
  const [showStreakModal, setShowStreakModal] = useState(false);
  // Lấy số ngày streak thực tế từ progress.stats.studyStreak
  const currentStreak = progress?.stats?.studyStreak || 0;
  const totalActivities = progress?.allActivities?.length || 0;

  // Sử dụng usePet hook thay vì logic cũ
  const petData = usePet({ totalActivities, currentStreak });

  const streakData = {
    currentStreak,
    milestones: {
      achieved: [3, 10, 30, 50, 100].filter(m => currentStreak >= m),
      next: 0,
    },
    pet: {
      name: petData.name,
      level: petData.level,
      happiness: petData.happinessPercentage,
      evolution: petData.evolution,
      isAlive: petData.isAlive,
    },
  };
  const getStreakBadge = (streak: number) => {
    if (streak >= 100) return { emoji: '🔥', color: 'bg-yellow-400', text: 'text-yellow-900' };
    if (streak >= 50) return { emoji: '🔥', color: 'bg-purple-500', text: 'text-white' };
    if (streak >= 30) return { emoji: '🔥', color: 'bg-blue-500', text: 'text-white' };
    if (streak >= 14) return { emoji: '🔥', color: 'bg-orange-500', text: 'text-white' };
    if (streak >= 7) return { emoji: '🔥', color: 'bg-green-500', text: 'text-white' };
    return { emoji: '🔥', color: 'bg-gray-300', text: 'text-gray-600' };
  };
  const getMilestoneColor = (milestone: number) => {
    switch (milestone) {
      case 3: return 'bg-green-500 text-white';
      case 10: return 'bg-orange-500 text-white';
      case 30: return 'bg-blue-500 text-white';
      case 50: return 'bg-purple-500 text-white';
      case 100: return 'bg-yellow-400 text-yellow-900';
      default: return 'bg-gray-300 text-gray-600';
    }
  };

  const getStreakGradient = (streak: number) => {
    if (streak >= 100) return 'from-yellow-400 via-yellow-500 to-orange-500';
    if (streak >= 50) return 'from-purple-500 via-purple-600 to-pink-500';
    if (streak >= 30) return 'from-blue-500 via-blue-600 to-indigo-500';
    if (streak >= 10) return 'from-orange-500 via-red-500 to-pink-500';
    if (streak >= 3) return 'from-green-500 via-green-600 to-teal-500';
    return 'from-gray-400 via-gray-500 to-gray-600';
  };


  useEffect(() => {
    const fetchProgress = async () => {
      if (!isLoaded || !user) return;
      
            try {
        const response = await fetch('/api/tracking');
        if (response.ok) {
          const data = await response.json();
        
        // Debug log để kiểm tra skillProgress data
        console.log('📊 Dashboard Debug - skillProgress data:', data.skillProgress);
        console.log('📊 Dashboard Debug - skillTrends data:', data.skillTrends);
        console.log('📊 Dashboard Debug - totalStudyTime:', data.stats?.totalStudyTime, 'seconds');
        console.log('📊 Dashboard Debug - allActivities:', data.allActivities?.length || 0, 'activities');
        
        // API trả về data trực tiếp, không có .progress
        setProgress(data);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
    
    // Refresh data every 5 minutes instead of 30 seconds to reduce flickering
    const interval = setInterval(fetchProgress, 300000);
    return () => clearInterval(interval);
  }, [isLoaded, user]);


  // Memoize chart data để tránh việc tính toán lại không cần thiết
  const memoizedChartData = useMemo(() => {
    if (!progress) return [];
    
    // Sử dụng allActivities thay vì recentActivities để có đầy đủ dữ liệu
    const activities = progress.allActivities || progress.recentActivities || [];
    
    
    
    const groupKey = (date: Date, index?: number): string => {
      if (viewMode === 'day') return date.toISOString().slice(0, 10);
      if (viewMode === 'month') return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      if (viewMode === 'year') return String(date.getFullYear());
      if (viewMode === 'session') return `Session ${(index || 0) + 1}`;
      return '';
    };
    const grouped: Record<string, { quiz: number[]; test: number[]; interview: number[] }> = {};
    
    if (viewMode === 'session') {
      // Chế độ Session: mỗi activity là 1 session riêng biệt
      activities.forEach((a, index) => {
        if (!a.timestamp) {
          console.log('⚠️ Activity missing timestamp:', a);
          return;
        }
        const date = new Date(a.timestamp);
        const key = groupKey(date, index);
        if (!key) {
          console.log('⚠️ Invalid group key for date:', date, 'activity:', a);
          return;
        }
        if (!grouped[key]) grouped[key] = { quiz: [], test: [], interview: [] };
        if (a.type === 'quiz') grouped[key].quiz.push(a.score || 0);
        if (a.type === 'test' || a.type === 'eq' || a.type === 'assessment') grouped[key].test.push(a.score || 0);
        if (a.type === 'interview') grouped[key].interview.push(a.score || 0);
      });
    } else {
      // Chế độ Day/Month/Year: nhóm theo thời gian
      activities.forEach(a => {
        if (!a.timestamp) {
          console.log('⚠️ Activity missing timestamp:', a);
          return;
        }
        const date = new Date(a.timestamp);
        const key = groupKey(date);
        if (!key) {
          console.log('⚠️ Invalid group key for date:', date, 'activity:', a);
          return;
        }
        if (!grouped[key]) grouped[key] = { quiz: [], test: [], interview: [] };
        if (a.type === 'quiz') grouped[key].quiz.push(a.score || 0);
        if (a.type === 'test' || a.type === 'eq' || a.type === 'assessment') grouped[key].test.push(a.score || 0);
        if (a.type === 'interview') grouped[key].interview.push(a.score || 0);
      });
    }
    
    console.log('📊 Dashboard Debug - Grouped data:', grouped);
    
    const chartData = Object.entries(grouped).map(([period, vals]) => {
      console.log(`🔍 Processing period ${period}:`, {
        quizScores: vals.quiz,
        testScores: vals.test, 
        interviewScores: vals.interview
      });
      
      if (lineMode === 'score') {
        const result = {
          period,
          quiz: vals.quiz.length ? (vals.quiz.reduce((a, b) => a + b, 0) / vals.quiz.length) : 0,
          test: vals.test.length ? (vals.test.reduce((a, b) => a + b, 0) / vals.test.length) : 0,
          interview: vals.interview.length ? (vals.interview.reduce((a, b) => a + b, 0) / vals.interview.length) : 0,
        };
        console.log(`📊 Calculated averages for ${period}:`, result);
        return result;
      } else {
        // Sử dụng số lượng thực tế từ allActivities
        return {
          period,
          quiz: vals.quiz.length,
          test: vals.test.length,
          interview: vals.interview.length,
        };
      }
    }).sort((a, b) => {
      // ✅ FIX: Numeric sorting for sessions, alphabetical for dates
      if (viewMode === 'session') {
        // Extract session numbers for proper numeric sorting
        const aNum = parseInt(a.period.replace('Session ', ''));
        const bNum = parseInt(b.period.replace('Session ', ''));
        return aNum - bNum;
      } else {
        // Use alphabetical sorting for date-based periods
        return a.period.localeCompare(b.period);
      }
    });

    console.log('📊 Dashboard Debug - Final chart data:', chartData);
    console.log('🔍 View Mode Debug:', { viewMode, lineMode, chartDataLength: chartData.length });
    
    // Nếu có ít hơn 3 điểm dữ liệu và không phải chế độ Session, tạo dữ liệu ổn định để có đường cong
    if (chartData.length < 3 && viewMode !== 'session') {
      console.log('⚠️ Ít dữ liệu, tạo dữ liệu ổn định');
      
      // Tạo dữ liệu cho 7 ngày gần nhất
      const today = new Date();
      const extendedData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().slice(0, 10);
        
        // Tìm dữ liệu thực tế cho ngày này
        const realData = chartData.find(d => d.period === dateKey);
        
        if (realData) {
          extendedData.push(realData);
        } else {
          // Sử dụng dữ liệu ổn định thay vì random để tránh nhảy số liệu
          const lastRealData = chartData[chartData.length - 1];
          
          extendedData.push({
            period: dateKey,
            quiz: lastRealData?.quiz || 0,
            test: lastRealData?.test || 0,
            interview: lastRealData?.interview || 0,
          });
        }
      }
      
      console.log('📊 Dashboard Debug - Extended data:', extendedData);
      return extendedData;
    } else {
      return chartData;
    }
  }, [progress, viewMode, lineMode]);

  useEffect(() => {
    setLineChartData(memoizedChartData);
  }, [memoizedChartData]);

  // Tính toán Overall Progress Data và Improvement Metrics
  useEffect(() => {
    if (!memoizedChartData || memoizedChartData.length === 0) return;
    
    // Tính overall progress (điểm trung bình tổng hợp)
    const overallData = memoizedChartData.map(item => {
      const scores = [];
      if (item.quiz > 0) scores.push(item.quiz);
      if (item.test > 0) scores.push(item.test); 
      if (item.interview > 0) scores.push(item.interview);
      
      const overallAverage = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      
      return {
        period: item.period,
        overall: Math.round(overallAverage * 100) / 100
      };
    });
    
    setOverallProgressData(overallData);
    
    // Tính improvement metrics cho từng mode
    if (memoizedChartData.length >= 2) {
      let latest, previous;
      
      if (viewMode === 'session') {
        // Trong Session mode: So sánh session đầu vs session cuối để thấy tiến bộ tổng thể
        latest = memoizedChartData[memoizedChartData.length - 1];
        
        // Tìm session đầu tiên có data (không phải tất cả đều 0)
        previous = memoizedChartData.find(session => 
          session.quiz > 0 || session.test > 0 || session.interview > 0
        ) || memoizedChartData[0];
        
        // Nếu session đầu và cuối giống nhau, so sánh với session trước đó
        if (previous === latest && memoizedChartData.length > 1) {
          previous = memoizedChartData[memoizedChartData.length - 2];
        }
      } else {
        // Các mode khác: so sánh 2 periods gần nhất
        latest = memoizedChartData[memoizedChartData.length - 1];
        previous = memoizedChartData[memoizedChartData.length - 2];
      }
      
      console.log('🔍 Improvement Metrics Debug:', {
        viewMode,
        lineMode,
        latest,
        previous,
        chartDataLength: memoizedChartData.length,
        comparisonLogic: viewMode === 'session' ? 'first-with-data vs latest' : 'previous vs latest'
      });
      
      const calculateModeMetrics = (latest: number, previous: number, mode: string, activityType: 'quiz' | 'test' | 'interview'): { percentage: number; trend: 'improving' | 'declining' | 'stable' } => {
        // Trong session mode, tìm session đầu tiên có score cho activity type cụ thể
        let actualPrevious = previous;
        if (viewMode === 'session') {
          const firstSessionWithScore = memoizedChartData.find(session => session[activityType] > 0);
          if (firstSessionWithScore) {
            actualPrevious = firstSessionWithScore[activityType];
          }
        }
        
        const change = latest - actualPrevious;
        let percentage = 0;
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        
        if (actualPrevious > 0) {
          // Normal percentage calculation
          percentage = Math.round((change / actualPrevious) * 100 * 100) / 100;
          trend = percentage > 2 ? 'improving' as const : percentage < -2 ? 'declining' as const : 'stable' as const;
        } else if (actualPrevious === 0 && latest > 0) {
          // Special case: starting from 0, show significant improvement
          percentage = 100;
          trend = 'improving';
        } else if (actualPrevious > 0 && latest === 0) {
          // Special case: dropping to 0, show 100% decline
          percentage = 100;
          trend = 'declining';
        }
        
        console.log(`📈 ${mode} Metrics:`, {
          latest, previous: actualPrevious, change, percentage: Math.abs(percentage), trend,
          sessionComparison: viewMode === 'session' ? `First ${activityType} session vs latest` : 'Previous vs latest'
        });
        
        return { percentage: Math.abs(percentage), trend };
      };
      
      setImprovementMetrics({
        quiz: calculateModeMetrics(latest.quiz, previous.quiz, 'Quiz', 'quiz'),
        test: calculateModeMetrics(latest.test, previous.test, 'Test', 'test'),
        interview: calculateModeMetrics(latest.interview, previous.interview, 'Interview', 'interview')
      });
    } else {
      console.log('⚠️ Not enough chart data for improvement calculation:', {
        viewMode,
        lineMode,
        chartDataLength: memoizedChartData.length,
        fullChartData: memoizedChartData
      });
    }
  }, [memoizedChartData, viewMode, lineMode]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + Hero Section ngang hàng */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s an overview of your interview activities.</p>
          </div>
          {/* Study Streak Hero Section */}
          <div className={`bg-gradient-to-r ${getStreakGradient(currentStreak)} rounded-xl text-white relative overflow-hidden flex items-center justify-between p-3 max-w-[480px] w-full lg:w-auto lg:min-w-[380px]`}>
            {/* Streak bên trái */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className={`text-3xl mb-1 ${getStreakBadge(currentStreak).color} ${getStreakBadge(currentStreak).text} rounded-full p-1.5 shadow-md`}>
                {getStreakBadge(currentStreak).emoji}
              </div>
              <div className="text-sm font-bold mb-1">{currentStreak} streak days</div>
              <div className="flex gap-1 flex-wrap justify-center">
                {[3, 10, 30, 50, 100].map((milestone) => (
                  <div
                    key={milestone}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${getMilestoneColor(milestone)} ${currentStreak >= milestone ? 'ring-1 ring-white' : 'opacity-50'}`}
                  >
                    <span className="text-xs">🔥</span>
                    <span>{milestone}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Pet bên phải - sử dụng component mới */}
            <PetDisplay
              totalActivities={totalActivities}
              currentStreak={currentStreak}
              onShowDetails={() => setShowStreakModal(true)}
              compact={true}
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : totalActivities}
                </p>
                <p className="text-sm text-green-600">Recent activities</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : progress?.stats?.averageScore ? progress.stats.averageScore.toFixed(1) : '0.0'}
                </p>
                <p className="text-sm text-green-600">Overall performance</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : streakData.currentStreak}
                </p>
                <p className="text-sm text-green-600">Consecutive days</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : progress?.stats?.totalStudyTime ? (progress.stats.totalStudyTime / 3600).toFixed(1) + 'h' : '0.0h'}
                </p>
                <p className="text-sm text-green-600">Total hours</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>


        {/* Progress Trend Chart + Spider Chart */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Progress Trend Chart - Left */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 lg:mb-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {showDetailedView ? 
                    `Progress by ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} (${lineMode === 'score' ? 'Average Score' : 'Total Count'})` :
                    "Overall Progress Trend"
                  }
                </h2>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetailedView(!showDetailedView)}
                  >
                    {showDetailedView ? 'Show Overall Trend' : 'Show Mode Details'}
                  </Button>
                  {showDetailedView && (
                    <>
                      <span className="font-medium">View by:</span>
                      <select
                        className="border rounded px-2 py-1"
                        value={viewMode}
                        onChange={e => setViewMode(e.target.value as 'day' | 'month' | 'year' | 'session')}
                      >
                        <option value="day">Day</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="session">Session</option>
                      </select>
                      <span className="font-medium ml-6">Mode:</span>
                      <select
                        className="border rounded px-2 py-1"
                        value={lineMode}
                        onChange={e => setLineMode(e.target.value as 'score' | 'total')}
                      >
                        <option value="score">Score</option>
                        <option value="total">Total</option>
                      </select>
                    </>
                  )}
                </div>
              </div>

              {!showDetailedView && improvementMetrics && (
                <>
                  {/* Improvement Metrics */}
                  <div className="mb-4 grid grid-cols-3 gap-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700">Quiz Improvement</span>
                        <span className="text-lg">{improvementMetrics.quiz.trend === 'improving' ? '🔺' : improvementMetrics.quiz.trend === 'declining' ? '🔻' : '➖'}</span>
                      </div>
                      <p className="text-xl font-bold text-green-800">{improvementMetrics.quiz.percentage}%</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Assessment Improvement</span>
                        <span className="text-lg">{improvementMetrics.test.trend === 'improving' ? '🔺' : improvementMetrics.test.trend === 'declining' ? '🔻' : '➖'}</span>
                      </div>
                      <p className="text-xl font-bold text-blue-800">{improvementMetrics.test.percentage}%</p>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-700">Interview Improvement</span>
                        <span className="text-lg">{improvementMetrics.interview.trend === 'improving' ? '🔺' : improvementMetrics.interview.trend === 'declining' ? '🔻' : '➖'}</span>
                      </div>
                      <p className="text-xl font-bold text-purple-800">{improvementMetrics.interview.percentage}%</p>
                    </div>
                  </div>
                  
                  {/* Overall Progress Chart */}
                  <ChartSingleLine
                    data={overallProgressData.map(d => ({
                      date: d.period,
                      value: d.overall,
                    }))}
                    height={288}
                    color="#8b5cf6"
                    title=""
                    description=""
                  />
                </>
              )}

              {showDetailedView && (
                <>
                  {/* Thông báo khi dữ liệu ít */}
                  {lineChartData.length < 3 && viewMode !== 'session' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm text-yellow-700">
                          Biểu đồ hiển thị dữ liệu giả lập để tạo đường cong. Hãy luyện tập thêm để có dữ liệu thực tế!
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Thông báo cho chế độ Session */}
                  {viewMode === 'session' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-blue-700">
                          Chế độ Session: So sánh từng lần luyện tập riêng biệt
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <ChartMultiAreaInteractive
                    data={lineChartData.map(d => ({
                      // map period -> date to keep X axis formatter compatible
                      date: d.period,
                      quiz: d.quiz,
                      test: d.test,
                      interview: d.interview,
                    }))}
                    height={288}
                    title=""
                    description=""
                    hideCard={true}
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Skills Development - Right */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Skills Development</h2>
                  <p className="text-sm text-gray-600 mt-1">Your average performance across all practice sessions</p>
                </div>
                <div className="text-sm text-gray-500">
                  Click on skills to view detailed progress charts
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <SkillsProgress 
                  skillProgress={progress?.skillProgress || []} 
                  loading={loading}
                  collapsible={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6">            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <p className="text-sm text-gray-600 mb-6">Frequently used features</p>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/avatar-interview" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">AI Avatar Interview</span>
                  <span className="text-xs text-gray-500 mt-1">Interview with AI Avatar</span>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                    Start Now
                  </button>
                </Link>

                <Link href="/quiz" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-pink-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
                    <FileQuestion className="w-6 h-6 text-pink-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">Practice Quiz</span>
                  <span className="text-xs text-gray-500 mt-1">Learn technical concepts</span>
                  <button className="mt-3 px-4 py-2 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 transition-colors">
                    View Now
                  </button>
                </Link>

                <Link href="/test" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <TestTube className="w-6 h-6 text-purple-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">Assessment Mode</span>
                  <span className="text-xs text-gray-500 mt-1">Check your Test score</span>
                  <button className="mt-3 px-4 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
                    Take Test
                  </button>
                </Link>

                <Link href="/jd" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">AI with JD</span>
                  <span className="text-xs text-gray-500 mt-1">Assess professional skills</span>
                  <button className="mt-3 px-4 py-2 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Other Content (if needed) */}
          <div className="space-y-6">
            {/* Future content can go here */}
          </div>
        </div>
     </div>
      {/* Streak Detail Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Study Pet Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowStreakModal(false)}>
                ✕
              </Button>
            </div>
            <div className="text-center mb-6">
              <PetDisplay
                totalActivities={totalActivities}
                currentStreak={currentStreak}
                compact={false}
              />
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold mb-2">Pet Evolution Stages</h5>
                <div className="space-y-2">
                  {getPetEvolutionStages().map((evolution) => (
                    <div
                      key={evolution.stage}
                      className={`flex items-center gap-3 p-2 rounded ${
                        petData.evolution === evolution.stage ? 'bg-blue-100 border border-blue-300' : 'bg-white'
                      }`}
                    >
                      <span className="text-2xl">{evolution.emoji}</span>
                      <div className="flex-1">
                        <span className="font-medium">{evolution.name}</span>
                        <span className="text-sm text-gray-500 ml-2">Level {evolution.level}</span>
                        <div className="text-xs text-gray-400">{evolution.requirement}</div>
                      </div>
                      {petData.level >= evolution.level && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-semibold text-yellow-800 mb-2"> Important Notice</h5>
                <p className="text-sm text-yellow-700">
                  If you don&#39;t study for 2 consecutive days, your pet will disappear and you&#39;ll have to start over!
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowStreakModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* User Navigation Dock */}
      <MagicDock 
        items={userDockItems}
        variant="tooltip"
        magnification={70}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      />
    </DashboardLayout>
  );
}
