import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Activity,
  Target,
  Clock,
  Star,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    userGrowthRate: number;
    platformEngagement: number;
  };
  activityStats: {
    totalInterviews: number;
    totalQuizzes: number;
    totalPractice: number;
    recentInterviews: number;
    recentQuizzes: number;
    recentPractice: number;
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  learningStats: {
    totalStudyTime: number;
    averageStreak: number;
    totalGoals: number;
    completedGoals: number;
    averageGoalsPerUser: number;
  };
  skillDistribution: Array<{
    name: string;
    userCount: number;
    averageScore: number;
    levelDistribution: {
      beginner: number;
      intermediate: number;
      advanced: number;
      expert: number;
    };
  }>;
  activityTrends: Array<{
    date: string;
    interviews: number;
    quizzes: number;
    practice: number;
    totalDuration: number;
  }>;
  topPerformers: Array<{
    user: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    averageScore: number;
    totalActivities: number;
    studyStreak: number;
  }>;
  mostActiveUsers: Array<{
    user: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    totalActivities: number;
    recentActivities: number;
    studyStreak: number;
  }>;
  goalInsights: Record<string, unknown>;
  timeframe: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [includeCharts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: timeRange,
        charts: includeCharts.toString()
      });

      const response = await fetch(`/api/admin/user-activities/analytics?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error('Error fetching analytics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, includeCharts]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data.</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-gray-500">
            Comprehensive analytics for the last {timeRange} days
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.totalUsers)}</p>
                <p className="text-xs text-gray-500">
                  {data.overview.activeUsers} active ({Math.round(data.overview.platformEngagement)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold">{formatNumber(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalPractice)}</p>
                <p className="text-xs text-gray-500">
                  {Math.round((data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalPractice) / Math.max(data.overview.activeUsers, 1))} per active user
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-2xl font-bold">{Math.round(data.learningStats.averageStreak)} days</p>
                <p className="text-xs text-gray-500">Average across users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Study Time</p>
                <p className="text-2xl font-bold">{formatDuration(data.learningStats.totalStudyTime)}</p>
                <p className="text-xs text-gray-500">
                  Total across platform
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.activityStats.totalInterviews)}</p>
              <p className="text-sm text-gray-600">Interviews</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((data.activityStats.totalInterviews / Math.max(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalPractice, 1)) * 100)}% of total
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.activityStats.totalQuizzes)}</p>
              <p className="text-sm text-gray-600">Quizzes</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((data.activityStats.totalQuizzes / Math.max(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalPractice, 1)) * 100)}% of total
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.activityStats.totalPractice)}</p>
              <p className="text-sm text-gray-600">Practice Sessions</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((data.activityStats.totalPractice / Math.max(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalPractice, 1)) * 100)}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Completion Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Completed Goals</span>
                <Badge className="bg-green-100 text-green-800">
                  {data.learningStats.completedGoals}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Goals</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {data.learningStats.totalGoals}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Goal Statistics:</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {data.learningStats.totalGoals > 0 ? Math.round((data.learningStats.completedGoals / data.learningStats.totalGoals) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Average Goals per User</span>
                  <div className="flex items-center gap-2">
                    <span>{Math.round(data.learningStats.averageGoalsPerUser * 10) / 10}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data.skillDistribution || []).slice(0, 8).map((skill, index) => (
                <div key={skill.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-xs text-gray-500">
                        {skill.userCount} users • Avg: {skill.averageScore}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div 
                      className="w-2 h-4 bg-red-200 rounded-sm" 
                      style={{ 
                        height: `${(skill.levelDistribution.beginner / skill.userCount) * 100}%`,
                        minHeight: '2px'
                      }}
                    />
                    <div 
                      className="w-2 h-4 bg-yellow-200 rounded-sm"
                      style={{ 
                        height: `${(skill.levelDistribution.intermediate / skill.userCount) * 100}%`,
                        minHeight: '2px'
                      }}
                    />
                    <div 
                      className="w-2 h-4 bg-blue-200 rounded-sm"
                      style={{ 
                        height: `${(skill.levelDistribution.advanced / skill.userCount) * 100}%`,
                        minHeight: '2px'
                      }}
                    />
                    <div 
                      className="w-2 h-4 bg-green-200 rounded-sm"
                      style={{ 
                        height: `${(skill.levelDistribution.expert / skill.userCount) * 100}%`,
                        minHeight: '2px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            User Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.engagementMetrics.dailyActiveUsers}
              </div>
              <p className="text-sm text-gray-600">Daily Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.engagementMetrics.weeklyActiveUsers}
              </div>
              <p className="text-sm text-gray-600">Weekly Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.engagementMetrics.monthlyActiveUsers}
              </div>
              <p className="text-sm text-gray-600">Monthly Active Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data.topPerformers || []).slice(0, 5).map((performer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {performer.user?.firstName || 'Unknown'} {performer.user?.lastName || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">{performer.user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{performer.totalActivities} activities</p>
                  <p className="text-sm text-gray-500">{performer.studyStreak} day streak</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
