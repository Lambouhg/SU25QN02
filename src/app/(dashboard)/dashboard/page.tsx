"use client";

import { 
  Brain, FileText,
  TestTube, FileQuestion, TrendingUp,
  Clock, Award, Users, Play, Target
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SkillProgress {
  name: string;
  level: string;
  score: number;
  progress: Array<{
    date: Date;
    score: number;
  }>;
}

interface ProgressData {
  stats: {
    totalInterviews: number;
    averageScore: number;
    studyStreak: number;
    totalStudyTime: number;
  };
  skillProgress: SkillProgress[];
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
  allQuizActivities?: Array<{
    type: string;
    score?: number;
    duration?: number;
    timestamp?: string | Date;
  }>;
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  // Multi-Line Chart State
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  const [lineMode, setLineMode] = useState<'score' | 'total'>('score');
  const [lineChartData, setLineChartData] = useState<Array<{
    period: string;
    quiz: number;
    test: number;
    interview: number;
  }>>([]);

  // Spider chart data state
  const [overallSpiderData, setOverallSpiderData] = useState<Array<{
    subject: string;
    A: number;
    fullMark: number;
    target: number;
    unit: string;
  }>>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  type PersonalTargets = {
    totalActivities: number;
    averageScore: number;
    studyTime: number;
    completionRate: number;
    learningFrequency: number;
  };
  const defaultTargets: PersonalTargets = {
    totalActivities: 50,
    averageScore: 80,
    studyTime: 200,
    completionRate: 90,
    learningFrequency: 15,
  };
  const [personalTargets, setPersonalTargets] = useState<PersonalTargets>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('personalTargets');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return defaultTargets;
  });

  // --- STREAK FEATURE STATE & LOGIC ---
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Lấy số ngày streak thực tế từ progress.stats.studyStreak
  const currentStreak = progress?.stats?.studyStreak || 0;
  const totalActivities = (progress?.stats?.totalInterviews || 0) + (progress?.recentActivities?.filter(a => a.type === 'quiz' || a.type === 'test').length || 0);

  // Tính level và evolution của pet dựa vào tổng số activities
  let petLevel = 1;
  let petEvolution: 'egg' | 'baby' | 'teen' | 'adult' | 'master' = 'egg';
  if (totalActivities >= 100) {
    petLevel = 5; petEvolution = 'master';
  } else if (totalActivities >= 75) {
    petLevel = 4; petEvolution = 'adult';
  } else if (totalActivities >= 50) {
    petLevel = 3; petEvolution = 'teen';
  } else if (totalActivities >= 25) {
    petLevel = 2; petEvolution = 'baby';
  } else if (totalActivities >= 10) {
    petLevel = 2; petEvolution = 'baby'; // Sửa: 10-24 activities = level 2
  } else {
    petLevel = 1; petEvolution = 'egg'; // 0-9 activities = level 1
  }

  // Tính target activities cho level tiếp theo
  const getTargetActivities = (level: number) => {
    switch (level) {
      case 1: return 10; // Level 1 cần 10 activities để lên level 2
      case 2: return 25; // Level 2 cần 25 activities để lên level 3
      case 3: return 50; // Level 3 cần 50 activities để lên level 4
      case 4: return 75; // Level 4 cần 75 activities để lên level 5
      case 5: return 100; // Level 5 cần 100 activities để lên level 6 (nếu có)
      default: return 10;
    }
  };

  const targetActivities = getTargetActivities(petLevel);
  const currentActivities = Math.min(totalActivities, targetActivities);
  const happinessPercentage = (currentActivities / targetActivities) * 100;

  const streakData = {
    currentStreak,
    milestones: {
      achieved: [3, 10, 30, 50, 100].filter(m => currentStreak >= m),
      next: 0,
    },
    pet: {
      name: 'Chuck Chicken',
      level: petLevel,
      happiness: happinessPercentage,
      evolution: petEvolution,
      isAlive: true,
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
  const getPetEmoji = (evolution: 'egg' | 'baby' | 'teen' | 'adult' | 'master', isAlive: boolean) => {
    if (!isAlive) return '💀';
    switch (evolution) {
      case 'egg': return '🥚';
      case 'baby': return '🐣';
      case 'teen': return '🐤';
      case 'adult': return '🐦';
      case 'master': return '🦅';
      default: return '🥚';
    }
  };


  useEffect(() => {
    const fetchProgress = async () => {
      if (!isLoaded || !user) return;
      
            try {
        const response = await fetch('/api/tracking');
        if (response.ok) {
          const data = await response.json();
        
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
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, user]);

  useEffect(() => {
    if (!progress || !progress.recentActivities) return;
    const activities = progress.recentActivities;
    const totalInterviews = progress.stats?.totalInterviews || 0;
    
    console.log('=== Progress by Day Debug ===');
    console.log('Activities count:', activities.length);
    console.log('Activities:', activities);
    console.log('Total interviews from stats:', totalInterviews);
    
    const groupKey = (date: Date): string => {
      if (viewMode === 'day') return date.toISOString().slice(0, 10);
      if (viewMode === 'month') return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      if (viewMode === 'year') return String(date.getFullYear());
      return '';
    };
    const grouped: Record<string, { quiz: number[]; test: number[]; interview: number[] }> = {};
    activities.forEach(a => {
      if (!a.timestamp) return;
      const date = new Date(a.timestamp);
      const key = groupKey(date);
      if (!key) return;
      if (!grouped[key]) grouped[key] = { quiz: [], test: [], interview: [] };
      if (a.type === 'quiz') grouped[key].quiz.push(a.score || 0);
      if (a.type === 'test' || a.type === 'eq') grouped[key].test.push(a.score || 0);
      if (a.type === 'interview') grouped[key].interview.push(a.score || 0);
    });
    
    const chartData = Object.entries(grouped).map(([period, vals]) => {
      if (lineMode === 'score') {
        return {
          period,
          quiz: vals.quiz.length ? (vals.quiz.reduce((a, b) => a + b, 0) / vals.quiz.length) : 0,
          test: vals.test.length ? (vals.test.reduce((a, b) => a + b, 0) / vals.test.length) : 0,
          interview: vals.interview.length ? (vals.interview.reduce((a, b) => a + b, 0) / vals.interview.length) : 0,
        };
      } else {
        // Sử dụng số lượng thực tế từ recentActivities
        return {
          period,
          quiz: vals.quiz.length,
          test: vals.test.length,
          interview: vals.interview.length,
        };
      }
    }).sort((a, b) => a.period.localeCompare(b.period));
    
    console.log('Grouped data:', grouped);
    console.log('Chart data:', chartData);
    setLineChartData(chartData);
  }, [progress, viewMode, lineMode]);

  // Tính toán dữ liệu spider chart mỗi khi progress thay đổi
  useEffect(() => {
    if (!progress) return;
    
    // Sử dụng totalInterviews + quiz/test count để tính tổng activities
    const totalCount = (progress.stats?.totalInterviews || 0) + (progress.recentActivities?.filter(a => a.type === 'quiz' || a.type === 'test').length || 0);
    const avgScore = progress.stats?.averageScore || 0;
    // Study time chuyển sang giờ, làm tròn 1 số thập phân
    const totalStudyTimeRaw = progress.stats?.totalStudyTime || 0;
    const totalStudyTime = +(totalStudyTimeRaw / 60).toFixed(1); // giờ
    
    // Tính completion rate và frequency từ recentActivities nếu có
    let completionRate = 0;
    let frequency = 0;
    
    if (progress.recentActivities && progress.recentActivities.length > 0) {
      const activities = progress.recentActivities;
      completionRate = activities.filter(a => a.score !== undefined).length / activities.length * 100;
      
      // Tần suất học: số lần trong 30 ngày gần nhất
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      frequency = activities.filter(a => new Date(a.timestamp || '') > oneMonthAgo).length;
    }
    setOverallSpiderData([
      {
        subject: 'Total Activities', A: Math.min(totalCount, 100), fullMark: 100, target: personalTargets.totalActivities, unit: 'times'
      },
      {
        subject: 'Average Score', A: Math.round(avgScore), fullMark: 100, target: personalTargets.averageScore, unit: ''
      },
      {
        subject: 'Study Time', A: Math.min(totalStudyTime, 10), fullMark: 10, target: personalTargets.studyTime, unit: 'h'
      },
      {
        subject: 'Completion Rate', A: Math.round(completionRate), fullMark: 100, target: personalTargets.completionRate, unit: '%'
      },
      {
        subject: 'Learning Frequency', A: Math.min(frequency, 20), fullMark: 20, target: personalTargets.learningFrequency, unit: 'times/month'
      },
    ]);
  }, [progress, personalTargets]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + Hero Section ngang hàng */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s an overview of your interview activities.</p>
          </div>
          {/* Study Streak Hero Section */}
          <div className={`bg-gradient-to-r ${getStreakGradient(currentStreak)} rounded-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center md:items-stretch md:justify-end p-4 md:p-0 min-w-[420px] max-w-[600px] w-full md:w-auto`}>
            {/* Streak bên trái */}
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className={`text-4xl mb-1 animate-bounce ${getStreakBadge(currentStreak).color} ${getStreakBadge(currentStreak).text} rounded-full p-2 shadow-lg`}>
                {getStreakBadge(currentStreak).emoji}
              </div>
              <div className="text-lg font-bold mb-1">{currentStreak} day streak</div>
              <div className="flex gap-1 mt-1 flex-wrap justify-center">
                {[3, 10, 30, 50, 100].map((milestone) => (
                  <div
                    key={milestone}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shadow ${getMilestoneColor(milestone)} ${currentStreak >= milestone ? 'ring-2 ring-white' : 'opacity-60'}`}
                  >
                    <span>🔥</span>
                    <span>{milestone}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Pet bên phải */}
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 inline-block w-36">
                <div className="text-4xl mb-1 animate-bounce">
                  {getPetEmoji(streakData.pet.evolution, streakData.pet.isAlive)}
                </div>
                <h3 className="text-base font-bold mb-1">{streakData.pet.name}</h3>
                <p className="text-xs opacity-80 mb-1">
                  Level {streakData.pet.level} • {streakData.pet.evolution}
                </p>
                {/* Pet Happiness Bar */}
                <div className="mb-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>Progress</span>
                    <span>{currentActivities}/{targetActivities}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${happinessPercentage}%` }}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setShowStreakModal(true)}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-3 py-1 mt-2"
                >
                  Pet Details
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Multi-Line Chart + Spider Chart */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Multi-Line Chart - Left */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 lg:mb-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Progress by {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} ({lineMode === 'score' ? 'Average Score' : 'Total Count'})</h2>
                <div className="flex items-center gap-4">
                  <span className="font-medium">View by:</span>
                  <select
                    className="border rounded px-2 py-1"
                    value={viewMode}
                    onChange={e => setViewMode(e.target.value as 'day' | 'month' | 'year')}
                  >
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
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
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, lineMode === 'score' ? 100 : 'auto']} />
                    <Tooltip formatter={(value: number) => lineMode === 'score' ? `${value.toFixed(1)}%` : value} />
                    <Legend />
                    <Line type="monotone" dataKey="quiz" name="Quiz" stroke="#7c3aed" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="test" name="Test" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="interview" name="Interview" stroke="#059669" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Spider Chart - Right */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Overall Progress</h2>
                <Button 
                  onClick={() => setShowTargetModal(true)}
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Set Targets
                </Button>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={overallSpiderData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const currentValue = payload[0].value as number;
                          const targetValue = data.target || 0;
                          const unit = data.unit || '';
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-800 mb-1">{label}</p>
                              <div className="space-y-1">
                                <p className="text-blue-600 font-medium">
                                  Current: {currentValue}{unit}
                                </p>
                                {targetValue > 0 && (
                                  <p className="text-sm text-gray-600">
                                    Target: {targetValue}{unit}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Radar
                      name="Current"
                      dataKey="A"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>


        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : (progress?.stats?.totalInterviews || 0) + (progress?.recentActivities?.filter(a => a.type === 'quiz' || a.type === 'test').length || 0)}
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
                  {loading ? '...' : progress?.stats?.totalStudyTime ? (progress.stats.totalStudyTime / 60).toFixed(1) + 'h' : '0h'}
                </p>
                <p className="text-sm text-green-600">Total minutes</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
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
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">Test Mode</span>
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

          {/* Right Column - Progress */}
          <div className="space-y-6">            {/* Skills Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Skills Progress</h3>
              <p className="text-sm text-gray-600 mb-6">Competency scores by skill area</p>
              
              {loading ? (
              <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-gray-200 rounded-full animate-pulse" style={{width: "60%"}}></div>
                      </div>
                  </div>
                  ))}
                </div>
              ) : progress?.skillProgress && progress.skillProgress.length > 0 ? (
                <div className="space-y-6">
                  {progress.skillProgress.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">{skill.name}</span>
                        <span className="text-sm text-gray-500">{skill.level}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                      {skill.progress && skill.progress.length > 0 && (
                        <div className="mt-4 h-[100px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={skill.progress}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(date) =>
                                  new Date(date).toLocaleDateString()
                                }
                              />
                              <YAxis domain={[0, 100]} />
                              <Tooltip
                                labelFormatter={(date) =>
                                  new Date(date).toLocaleDateString()
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#2563eb"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                  </div>
                  ))}
                </div>
              ) : progress?.stats ? (
                // Fallback: Hiển thị stats cơ bản nếu không có skillProgress
                <div className="space-y-4">
                <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Overall Performance</span>
                      <span className="text-sm text-gray-500">Current</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress.stats.averageScore)}%` }}
                      />
                  </div>
                    <p className="text-xs text-gray-500 mt-1">Average Score: {progress.stats.averageScore.toFixed(1)}%</p>
                </div>
                
                <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Study Streak</span>
                      <span className="text-sm text-gray-500">{progress.stats.studyStreak} days</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress.stats.studyStreak * 10)}%` }}
                      />
                  </div>
                </div>
                
                <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Total Study Time</span>
                      <span className="text-sm text-gray-500">{progress.stats.totalStudyTime} min</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress.stats.totalStudyTime / 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No skill progress data available</p>
                  <p className="text-sm text-gray-400 mt-2">Complete some activities to see your progress</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Focus & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Current Focus</h3>
            <ul className="space-y-2">
              {(progress?.currentFocus ?? []).map((focus: string, index: number) => (
                <li
                  key={index}
                  className="flex items-center text-gray-700"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  {focus}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <ul className="space-y-2">
              {(progress?.recommendations ?? []).map((recommendation: string, index: number) => (
                <li
                  key={index}
                  className="flex items-center text-gray-700"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Milestones</h3>
          <div className="space-y-4">
            {(progress?.nextMilestones ?? []).map((milestone: { goal: string; targetDate: Date }, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <span className="font-medium">{milestone.goal}</span>
                <span className="text-sm text-gray-500">
                  {new Date(milestone.targetDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Interview Records */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Recent Interviews</h3>
              <p className="text-sm text-gray-600">List of your latest interview sessions</p>
            </div>
            <Link href="/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">NB</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Nguyen Thi B</p>
                  <p className="text-sm text-gray-500">Frontend Developer</p>
                  <p className="text-xs text-gray-400">AI Avatar • 2024-01-15</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">8.5/10</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Completed
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">VC</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Tran Van C</p>
                  <p className="text-sm text-gray-500">Backend Developer</p>
                  <p className="text-xs text-gray-400">Video Call • 2024-01-14</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">7.8/10</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">
                    Completed
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">LD</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Le Thi D</p>
                  <p className="text-sm text-gray-500">UX Designer</p>
                  <p className="text-xs text-gray-400">EQ Test • 2024-01-13</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">9.2/10</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                    Completed
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">VE</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Pham Van E</p>
                  <p className="text-sm text-gray-500">Product Manager</p>
                  <p className="text-xs text-gray-400">AI Avatar • 2024-01-12</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">Pending</p>
                  <p className="text-xs text-gray-500"></p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded">
                    Pending
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
                </div>
      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Set Overall Progress Targets</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTargetModal(false)}>
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalActivities">Total Activities</Label>
                <Input
                  id="totalActivities"
                  type="number"
                  value={personalTargets.totalActivities}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, totalActivities: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="averageScore">Average Score</Label>
                <Input
                  id="averageScore"
                  type="number"
                  min="0"
                  max="100"
                  value={personalTargets.averageScore}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, averageScore: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="studyTime">Study Time (hours)</Label>
                <Input
                  id="studyTime"
                  type="number"
                  step="0.1"
                  min="0"
                  value={personalTargets.studyTime}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, studyTime: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="completionRate">Completion Rate (%)</Label>
                <Input
                  id="completionRate"
                  type="number"
                  min="0"
                  max="100"
                  value={personalTargets.completionRate}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, completionRate: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="learningFrequency">Learning Frequency (times/month)</Label>
                <Input
                  id="learningFrequency"
                  type="number"
                  value={personalTargets.learningFrequency}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, learningFrequency: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowTargetModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  localStorage.setItem('personalTargets', JSON.stringify(personalTargets));
                  setShowTargetModal(false);
                }}
              >
                Save Targets
              </Button>
            </div>
          </div>
        </div>
      )}
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
              <div className="text-8xl mb-4">{getPetEmoji(streakData.pet.evolution, streakData.pet.isAlive)}</div>
              <h4 className="text-2xl font-bold mb-2">{streakData.pet.name}</h4>
              <p className="text-gray-600">
                Level {streakData.pet.level} • {streakData.pet.evolution}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Progress</span>
                  <span>{currentActivities}/{targetActivities}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${happinessPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {totalActivities} activities completed • {targetActivities - currentActivities} more to next level
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold mb-2">Pet Evolution Stages</h5>
                <div className="space-y-2">
                  {[
                    { stage: 'egg', level: 1, emoji: '🥚', name: 'Egg', requirement: '0-9 activities' },
                    { stage: 'baby', level: 2, emoji: '🐣', name: 'Baby', requirement: '10-24 activities' },
                    { stage: 'teen', level: 3, emoji: '🐤', name: 'Teen', requirement: '25-49 activities' },
                    { stage: 'adult', level: 4, emoji: '🐦', name: 'Adult', requirement: '50-74 activities' },
                    { stage: 'master', level: 5, emoji: '🦅', name: 'Master', requirement: '75+ activities' },
                  ].map((evolution) => (
                    <div
                      key={evolution.stage}
                      className={`flex items-center gap-3 p-2 rounded ${
                        streakData.pet.evolution === evolution.stage ? 'bg-blue-100 border border-blue-300' : 'bg-white'
                      }`}
                    >
                      <span className="text-2xl">{evolution.emoji}</span>
                      <div className="flex-1">
                        <span className="font-medium">{evolution.name}</span>
                        <span className="text-sm text-gray-500 ml-2">Level {evolution.level}</span>
                        <div className="text-xs text-gray-400">{evolution.requirement}</div>
                      </div>
                      {streakData.pet.level >= evolution.level && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notice</h5>
                <p className="text-sm text-yellow-700">
                  If you don't study for 2 consecutive days, your pet will disappear and you'll have to start over!
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowStreakModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
