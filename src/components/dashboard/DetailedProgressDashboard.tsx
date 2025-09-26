import React, { useState, useEffect } from 'react';

// Import new analytics components
import LearningMilestones from './analytics/LearningMilestones';
import SkillDetailedAnalysis from './analytics/SkillDetailedAnalysis';
import PersonalizedInsights from './analytics/PersonalizedInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  AlertTriangle,
  BarChart3,
  LineChart,
  Flame,
  Users,
  BookOpen
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DetailedProgressAnalytics {
  insights: {
    summary: {
      currentStreak: number;
      weeklyAvgScore: number;
      monthlyAvgScore: number;
      totalActivitiesThisMonth: number;
    };
    trends: {
      weekly: { slope: number; direction: string };
      monthly: { slope: number; direction: string };
    };
    skills: Array<{
      skillName: string;
      currentScore: number;
      improvement: number;
      trend: string;
      timeline: Array<{ score: number; date: string }>;
    }>;
    recommendations: Array<{
      type: string;
      priority: string;
      message: string;
      actions: string[];
    }>;
    achievements: Array<{
      type: string;
      milestone: number;
      title: string;
      description: string;
    }>;
    alerts: Array<{
      type: string;
      severity: string;
      message: string;
      suggestions: string[];
    }>;
  };
  trends: {
    timeRange: string;
    totalEvents: number;
    timeline: Array<{
      period: string;
      avgScore: number;
      totalActivities: number;
      totalDuration: number;
      activityBreakdown: Record<string, number>;
    }>;
    overallTrend: { slope: number; direction: string };
  };
  comparison: {
    current: {
      totalActivities: number;
      avgScore: number;
      totalDuration: number;
    };
    previous: {
      totalActivities: number;
      avgScore: number;
      totalDuration: number;
    };
    improvement: {
      percentage: number;
      trend: string;
      significance: string;
    };
  };
}

// Helper function to safely format numbers
const safeToFixed = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0';
  }
  return value.toFixed(decimals);
};

const DetailedProgressDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DetailedProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [insightsRes, trendsRes, comparisonRes] = await Promise.all([
        fetch('/api/enhanced-analytics?action=insights'),
        fetch(`/api/enhanced-analytics?action=trends&timeRange=${timeRange}`),
        fetch(`/api/enhanced-analytics?action=comparison&timeRange=${timeRange}`)
      ]);

      if (!insightsRes.ok || !trendsRes.ok || !comparisonRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [insights, trends, comparison] = await Promise.all([
        insightsRes.json(),
        trendsRes.json(),
        comparisonRes.json()
      ]);

      setAnalytics({ insights, trends, comparison });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const getTrendIcon = (direction: string, size = 'h-4 w-4') => {
    switch (direction) {
      case 'improving': return <TrendingUp className={`${size} text-green-500`} />;
      case 'declining': return <TrendingDown className={`${size} text-red-500`} />;
      default: return <Activity className={`${size} text-gray-500`} />;
    }
  };





  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading detailed analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error ? 'Error Loading Analytics' : 'No Data Available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {error || 'No analytics data found. Start using the app to see your progress insights here.'}
          </p>
          <div className="space-x-3">
            <Button onClick={fetchAnalytics} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const { insights, trends, comparison } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Progress Analytics</h1>
          <p className="text-gray-600">Track your learning journey and see how you&apos;re improving over time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Time period:</span>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <Button 
            onClick={fetchAnalytics} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Current Streak</p>
                <p className="text-3xl font-bold text-blue-900">{insights.summary.currentStreak}</p>
                <p className="text-xs text-blue-600">days</p>
              </div>
              <Flame className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Weekly Score</p>
                <p className="text-3xl font-bold text-green-900">
                  {safeToFixed(insights.summary.weeklyAvgScore)}
                </p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(insights.trends.weekly.direction, 'h-3 w-3')}
                  <p className="text-xs text-green-600">average</p>
                </div>
              </div>
              <Target className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Monthly Score</p>
                <p className="text-3xl font-bold text-purple-900">
                  {safeToFixed(insights.summary.monthlyAvgScore)}
                </p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(insights.trends.monthly.direction, 'h-3 w-3')}
                  <p className="text-xs text-purple-600">average</p>
                </div>
              </div>
              <BarChart3 className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Activities</p>
                <p className="text-3xl font-bold text-orange-900">
                  {insights.summary.totalActivitiesThisMonth}
                </p>
                <p className="text-xs text-orange-600">this month</p>
              </div>
              <BookOpen className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Trends</TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Skills</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Insights</TabsTrigger>
          <TabsTrigger value="milestones" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Milestones</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Quick Summary</h3>
                  <p className="text-blue-700">Your learning progress at a glance</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{insights.summary.currentStreak}</div>
                  <div className="text-sm text-blue-600">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{safeToFixed(insights.summary.weeklyAvgScore)}%</div>
                  <div className="text-sm text-blue-600">Weekly Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{insights.summary.totalActivitiesThisMonth}</div>
                  <div className="text-sm text-blue-600">Activities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {trends.timeline.length > 0 ? Math.round(trends.timeline.reduce((sum, t) => sum + t.totalDuration, 0) / 60) : 0}m
                  </div>
                  <div className="text-sm text-blue-600">Total Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Recent Performance
                </CardTitle>
                <p className="text-sm text-gray-600">Your scores over the past {timeRange}</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsLineChart data={trends.timeline.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[0, 10]} />
                    <Tooltip 
                      formatter={(value) => [`${safeToFixed(Number(value))}/10`, 'Score']}
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgScore" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Activity Summary
                </CardTitle>
                <p className="text-sm text-gray-600">How you spend your learning time</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    trends.timeline.reduce((acc, item) => {
                      Object.entries(item.activityBreakdown || {}).forEach(([key, value]) => {
                        acc[key] = (acc[key] || 0) + value;
                      });
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([activity, count], index) => {
                    const total = Object.values(
                      trends.timeline.reduce((acc, item) => {
                        Object.entries(item.activityBreakdown || {}).forEach(([key, value]) => {
                          acc[key] = (acc[key] || 0) + value;
                        });
                        return acc;
                      }, {} as Record<string, number>)
                    ).reduce((sum, val) => sum + val, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    
                    return (
                      <div key={activity} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{activity}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count}</div>
                          <div className="text-sm text-gray-500">{safeToFixed(percentage)}%</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {trends.timeline.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No activities yet</p>
                      <p className="text-sm">Start practicing to see your activity summary</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Period Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Period Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Activities</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {comparison.current.totalActivities}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">vs {comparison.previous.totalActivities} previous</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    comparison.improvement.percentage > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {comparison.improvement.percentage > 0 ? '+' : ''}{safeToFixed(comparison.improvement.percentage)}%
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Score</h3>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {safeToFixed(comparison.current.avgScore)}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">vs {safeToFixed(comparison.previous.avgScore)} previous</div>
                  <Badge className={comparison.improvement.trend === 'improving' ? 'bg-green-100 text-green-700' : 
                                  comparison.improvement.trend === 'declining' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'}>
                    {comparison.improvement.trend}
                  </Badge>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Time</h3>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {Math.round(comparison.current.totalDuration / 60)}m
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    vs {Math.round(comparison.previous.totalDuration / 60)}m previous
                  </div>
                  <div className="text-xs text-gray-600">
                    {comparison.improvement.significance} change
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Performance Over Time ({timeRange})
                </CardTitle>
                <p className="text-sm text-gray-600">Track your improvement across different time periods</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={trends.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${safeToFixed(Number(value))}%`, 'Average Score']}
                      labelFormatter={(label) => `Period: ${label}`}
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgScore" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Activity Distribution
                </CardTitle>
                <p className="text-sm text-gray-600">See how you spend your learning time</p>
              </CardHeader>
              <CardContent>
                {trends.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          trends.timeline.reduce((acc, item) => {
                            Object.entries(item.activityBreakdown || {}).forEach(([key, value]) => {
                              acc[key] = (acc[key] || 0) + value;
                            });
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([name, value]) => ({ 
                          name: name.charAt(0).toUpperCase() + name.slice(1), 
                          value 
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${safeToFixed(percent * 100, 0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(trends.timeline.reduce((acc, item) => {
                          Object.entries(item.activityBreakdown || {}).forEach(([key, value]) => {
                            acc[key] = (acc[key] || 0) + value;
                          });
                          return acc;
                        }, {} as Record<string, number>)).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} activities`, 'Count']}
                        contentStyle={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <BarChart3 className="h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No Activity Data</p>
                    <p className="text-sm">Start practicing to see your activity breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Skills Tab - Enhanced */}
        <TabsContent value="skills" className="space-y-6">
          <SkillDetailedAnalysis skills={insights.skills} />
        </TabsContent>

        {/* Insights Tab - Enhanced */}
        <TabsContent value="insights" className="space-y-6">
          <PersonalizedInsights
            recommendations={insights.recommendations}
            alerts={insights.alerts}
            weeklyTrend={insights.trends.weekly}
            monthlyTrend={insights.trends.monthly}
            currentStreak={insights.summary.currentStreak}
            totalActivities={insights.summary.totalActivitiesThisMonth}
            avgScore={insights.summary.weeklyAvgScore}
          />
        </TabsContent>

        {/* New Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          <LearningMilestones
            achievements={insights.achievements}
            currentStreak={insights.summary.currentStreak}
            totalActivities={trends.totalEvents}
            weeklyAvgScore={insights.summary.weeklyAvgScore}
            monthlyAvgScore={insights.summary.monthlyAvgScore}
            totalStudyTime={(() => {
              const calculatedTime = trends.timeline.reduce((sum, t) => sum + t.totalDuration, 0);
              console.log('🔍 Study Time Debug:', {
                timelineLength: trends.timeline.length,
                timelineData: trends.timeline.map(t => ({
                  period: t.period,
                  totalDuration: t.totalDuration,
                  totalActivities: t.totalActivities
                })),
                calculatedTimeMinutes: Math.round(calculatedTime / 60 * 100) / 100,
                calculatedTimeSeconds: calculatedTime,
                milestoneHours: {
                  firstHour: calculatedTime >= 60 * 60 ? 'PASSED' : 'FAILED',
                  fiveHours: calculatedTime >= 5 * 60 * 60 ? 'PASSED' : 'FAILED'
                }
              });
              return calculatedTime;
            })()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailedProgressDashboard;