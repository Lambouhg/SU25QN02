'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  Target,
  Zap,
  BookOpen,
  Calendar,
  Clock,
  Users,
  Star
} from 'lucide-react';

interface Recommendation {
  type: string;
  priority: string;
  message: string;
  actions: string[];
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  suggestions: string[];
}

interface PersonalizedInsightsProps {
  recommendations: Recommendation[];
  alerts: Alert[];
  weeklyTrend: { slope: number; direction: string };
  monthlyTrend: { slope: number; direction: string };
  currentStreak: number;
  totalActivities: number;
  avgScore: number;
}

const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  recommendations,
  alerts,
  weeklyTrend,
  monthlyTrend,
  currentStreak,
  totalActivities,
  avgScore
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'study_plan': return <BookOpen className="h-4 w-4" />;
      case 'skill_focus': return <Target className="h-4 w-4" />;
      case 'practice': return <Zap className="h-4 w-4" />;
      case 'schedule': return <Calendar className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  // Generate dynamic insights based on user data
  const generateDynamicInsights = () => {
    const insights = [];

    // Streak analysis
    if (currentStreak === 0) {
      insights.push({
        type: 'streak',
        title: 'Start a New Streak',
        message: 'Begin a continuous learning streak to build good study habits.',
        icon: <Calendar className="h-5 w-5 text-blue-500" />,
        color: 'bg-blue-50 border-blue-200'
      });
    } else if (currentStreak < 3) {
      insights.push({
        type: 'streak',
        title: 'Building a Habit',
        message: `You've studied for ${currentStreak} consecutive days! Keep going to reach 7 days.`,
        icon: <Calendar className="h-5 w-5 text-green-500" />,
        color: 'bg-green-50 border-green-200'
      });
    } else if (currentStreak >= 7) {
      insights.push({
        type: 'streak',
        title: 'Impressive Streak!',
        message: `Excellent! You've maintained a ${currentStreak}-day streak. This is a great habit!`,
        icon: <Star className="h-5 w-5 text-purple-500" />,
        color: 'bg-purple-50 border-purple-200'
      });
    }

    // Activity level analysis
    if (totalActivities < 5) {
      insights.push({
        type: 'activity',
        title: 'Increase Practice',
        message: 'Participate in more activities for a more comprehensive learning experience.',
        icon: <Zap className="h-5 w-5 text-orange-500" />,
        color: 'bg-orange-50 border-orange-200'
      });
    } else if (totalActivities >= 25) {
      insights.push({
        type: 'activity',
        title: 'Active Learner',
        message: `You've completed ${totalActivities} activities! This is commendable effort.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        color: 'bg-green-50 border-green-200'
      });
    }

    // Performance analysis
    if (avgScore >= 85) {
      insights.push({
        type: 'performance',
        title: 'Outstanding Performance',
        message: `An average score of ${Math.round(avgScore)}% shows excellent learning efficiency!`,
        icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
        color: 'bg-purple-50 border-purple-200'
      });
    } else if (avgScore < 60) {
      insights.push({
        type: 'performance',
        title: 'Improve Your Score',
        message: 'Focus on reviewing and practicing to improve your scores.',
        icon: <Target className="h-5 w-5 text-red-500" />,
        color: 'bg-red-50 border-red-200'
      });
    }

    // Trend analysis
    if (weeklyTrend.direction === 'improving') {
      insights.push({
        type: 'trend',
        title: 'Positive Trend',
        message: 'Your performance has improved over the past week. Keep it up!',
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        color: 'bg-green-50 border-green-200'
      });
    } else if (weeklyTrend.direction === 'declining') {
      insights.push({
        type: 'trend',
        title: 'Needs Attention',
        message: 'Performance has declined this week. Review your study methods.',
        icon: <TrendingDown className="h-5 w-5 text-yellow-500" />,
        color: 'bg-yellow-50 border-yellow-200'
      });
    }

    return insights;
  };

  const dynamicInsights = generateDynamicInsights();

  return (
    <div className="space-y-6">
      {/* Dynamic Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Lightbulb className="h-5 w-5" />
            Personalized Insights
          </CardTitle>
          <p className="text-sm text-purple-600">
            Analysis based on your learning activity
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dynamicInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${insight.color}`}>
                <div className="flex items-start gap-3">
                  {insight.icon}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Notices ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <Alert key={index} className="border-red-200 bg-red-50">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <AlertDescription className="text-red-800">
                        <strong>{alert.type === 'performance' ? 'Performance' : 
                                alert.type === 'streak' ? 'Streak' : 
                                alert.type === 'goal' ? 'Goal' : 'Learning'}:</strong> {alert.message}
                      </AlertDescription>
                      {alert.suggestions && alert.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-800 mb-1">Suggestions:</p>
                          <ul className="text-sm text-red-700 space-y-1">
                            {alert.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              AI Recommendations ({recommendations.length})
            </CardTitle>
            <p className="text-sm text-gray-600">
              Generated based on your learning analytics model
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getRecommendationIcon(rec.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {rec.type === 'study_plan' && 'Study Plan'}
                          {rec.type === 'skill_focus' && 'Skill Focus'}
                          {rec.type === 'practice' && 'Practice'}
                          {rec.type === 'schedule' && 'Schedule'}
                          {rec.type === 'performance' && 'Improve Performance'}
                          {!['study_plan', 'skill_focus', 'practice', 'schedule', 'performance'].includes(rec.type) && 'Recommendation'}
                        </h4>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? 'High' : rec.priority === 'medium' ? 'Medium' : 'Low'}
                        </Badge>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{rec.message}</p>
                      
                      {rec.actions && rec.actions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-800 mb-2">Specific actions:</p>
                          <ul className="space-y-1">
                            {rec.actions.map((action, actionIdx) => (
                              <li key={actionIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Pattern Analysis */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Clock className="h-5 w-5" />
            Study Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-900">This Week's Trend</h4>
              <div className="flex items-center gap-3">
                {weeklyTrend.direction === 'improving' ? (
                  <TrendingUp className="h-6 w-6 text-green-500" />
                ) : weeklyTrend.direction === 'declining' ? (
                  <TrendingDown className="h-6 w-6 text-red-500" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-500" />
                )}
                <div>
                  <p className="font-medium">
                    {weeklyTrend.direction === 'improving' && 'Improving'}
                    {weeklyTrend.direction === 'declining' && 'Declining'}
                    {weeklyTrend.direction === 'stable' && 'Stable'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Performance {weeklyTrend.direction === 'improving' ? 'increased' : weeklyTrend.direction === 'declining' ? 'decreased' : 'remained stable'} this week
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-900">This Month's Trend</h4>
              <div className="flex items-center gap-3">
                {monthlyTrend.direction === 'improving' ? (
                  <TrendingUp className="h-6 w-6 text-green-500" />
                ) : monthlyTrend.direction === 'declining' ? (
                  <TrendingDown className="h-6 w-6 text-red-500" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-500" />
                )}
                <div>
                  <p className="font-medium">
                    {monthlyTrend.direction === 'improving' && 'Long-term Progress'}
                    {monthlyTrend.direction === 'declining' && 'Needs Attention'}
                    {monthlyTrend.direction === 'stable' && 'Stable'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Performance {monthlyTrend.direction === 'improving' ? 'increased' : monthlyTrend.direction === 'declining' ? 'decreased' : 'remained stable'} this month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Data State */}
      {(!recommendations || recommendations.length === 0) && (!alerts || alerts.length === 0) && (
        <Card className="p-8">
          <div className="text-center">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa Có Insights
            </h3>
            <p className="text-gray-600 mb-6">
              Hãy tiếp tục luyện tập để nhận được những insights và khuyến nghị cá nhân hóa.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PersonalizedInsights;