"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface ProgressInsights {
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
}

const ProgressAnalyticsDashboard: React.FC = () => {
  const [insights, setInsights] = useState<ProgressInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/progress-analytics?action=insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/progress-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_sample_events' })
      });
      
      if (!response.ok) throw new Error('Failed to create sample data');
      
      // Fetch fresh insights after creating sample data
      await fetchInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-700">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-700">Low</Badge>;
      default: return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading progress analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={fetchInsights} variant="outline" size="sm">
              Retry
            </Button>
            <Button onClick={createSampleData} variant="default" size="sm">
              Create Sample Data
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">No progress data available yet</p>
          <Button onClick={createSampleData} variant="default" size="sm">
            Create Sample Data
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Analytics</h1>
          <p className="text-gray-600">Track your learning journey and performance trends</p>
        </div>
        <Button onClick={fetchInsights} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{insights.summary.currentStreak}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{insights.summary.weeklyAvgScore.toFixed(1)}</p>
              </div>
              {getTrendIcon(insights.trends.weekly.direction)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{insights.summary.monthlyAvgScore.toFixed(1)}</p>
              </div>
              {getTrendIcon(insights.trends.monthly.direction)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activities This Month</p>
                <p className="text-2xl font-bold text-gray-900">{insights.summary.totalActivitiesThisMonth}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Progress */}
      {insights.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skills Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{skill.skillName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{skill.currentScore.toFixed(1)}/100</span>
                        {getTrendIcon(skill.trend)}
                      </div>
                    </div>
                    <Progress value={skill.currentScore} className="h-2" />
                    {skill.improvement !== 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {skill.improvement > 0 ? '+' : ''}{skill.improvement.toFixed(1)}% improvement
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {insights.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.achievements.map((achievement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900">{achievement.title}</h4>
                    <p className="text-sm text-green-700">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Smart Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rec.message}</h4>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <div className="space-y-1">
                    {rec.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {insights.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Progress Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.alerts.map((alert, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                  <p className="font-medium mb-2">{alert.message}</p>
                  <div className="space-y-1">
                    {alert.suggestions.map((suggestion, suggestionIndex) => (
                      <div key={suggestionIndex} className="flex items-center gap-2 text-sm">
                        <div className="h-1 w-1 bg-current rounded-full"></div>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressAnalyticsDashboard;