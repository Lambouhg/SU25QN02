'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle2,
  BookOpen,
  Brain,
  MessageSquare,
  Code,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface TimelineEvent {
  period: string;
  avgScore: number;
  totalActivities: number;
  totalDuration: number;
  activityBreakdown: Record<string, number>;
}

interface StudyTimeAnalysisProps {
  timeline: TimelineEvent[];
  timeRange: string;
  totalStudyTime: number;
  currentStreak: number;
}

const StudyTimeAnalysis: React.FC<StudyTimeAnalysisProps> = ({
  timeline,
  timeRange,
  currentStreak
}) => {
  // Tính toán thống kê thời gian học tập
  const getStudyStats = () => {
    if (timeline.length === 0) return null;

    const totalMinutes = timeline.reduce((sum, item) => sum + item.totalDuration, 0);
    const totalSessions = timeline.reduce((sum, item) => sum + item.totalActivities, 0);
    const avgSessionLength = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    
    // Tìm ngày học nhiều nhất
    const mostProductiveDay = timeline.reduce((prev, current) => 
      (prev.totalDuration > current.totalDuration) ? prev : current
    );

    // Tính consistency (số ngày có hoạt động / tổng số ngày)
    const daysWithActivity = timeline.filter(item => item.totalActivities > 0).length;
    const totalDays = timeline.length;
    const consistency = totalDays > 0 ? (daysWithActivity / totalDays) * 100 : 0;

    return {
      totalMinutes,
      totalSessions,
      avgSessionLength,
      mostProductiveDay,
      consistency,
      daysWithActivity
    };
  };

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = timeline.map(item => ({
    period: item.period,
    duration: Math.round(item.totalDuration),
    activities: item.totalActivities,
    avgScore: Math.round(item.avgScore || 0)
  }));

  // Phân loại hoạt động
  const getActivityTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'interview': return <MessageSquare className="h-4 w-4" />;
      case 'quiz': case 'test': return <Brain className="h-4 w-4" />;
      case 'practice': return <Code className="h-4 w-4" />;
      case 'learning': return <BookOpen className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'interview': return '#10B981'; // green
      case 'quiz': case 'test': return '#3B82F6'; // blue  
      case 'practice': return '#8B5CF6'; // purple
      case 'learning': return '#F59E0B'; // amber
      default: return '#6B7280'; // gray
    }
  };

  // Tổng hợp loại hoạt động từ timeline
  const getActivitySummary = () => {
    const summary: Record<string, number> = {};
    
    timeline.forEach(item => {
      Object.entries(item.activityBreakdown || {}).forEach(([type, count]) => {
        summary[type] = (summary[type] || 0) + count;
      });
    });

    return Object.entries(summary)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
  };

  const stats = getStudyStats();
  const activitySummary = getActivitySummary();

  if (!stats || timeline.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa Có Dữ Liệu Thời Gian
          </h3>
          <p className="text-gray-600">
            Bắt đầu học tập để xem phân tích thời gian học tập chi tiết.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Study Time Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Tổng Thời Gian</p>
                <p className="text-2xl font-bold text-blue-900">
                  {Math.round(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
                </p>
                <p className="text-xs text-blue-600">trong {timeRange}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Phiên Học</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalSessions}</p>
                <p className="text-xs text-green-600">tổng số</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">TB Mỗi Phiên</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(stats.avgSessionLength)}m
                </p>
                <p className="text-xs text-purple-600">trung bình</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Tính Nhất Quán</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.round(stats.consistency)}%
                </p>
                <p className="text-xs text-orange-600">{stats.daysWithActivity} ngày có HĐ</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Biểu Đồ Thời Gian Học Tập
          </CardTitle>
          <p className="text-sm text-gray-600">
            Thời gian học tập hàng ngày/tuần trong {timeRange}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                label={{ value: 'Phút', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'duration' ? `${value} phút` : value,
                  name === 'duration' ? 'Thời gian' : 
                  name === 'activities' ? 'Hoạt động' : 'Điểm TB'
                ]}
                labelFormatter={(label) => `Ngày: ${new Date(label).toLocaleDateString('vi-VN')}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="duration" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Phân Bổ Loại Hoạt Động
            </CardTitle>
            <p className="text-sm text-gray-600">
              Các loại hoạt động bạn đã tham gia
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activitySummary.map(([type, count], index) => {
                const total = activitySummary.reduce((sum, [, c]) => sum + c, 0);
                const percentage = (count / total) * 100;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${getActivityTypeColor(type)}20` }}
                      >
                        <div style={{ color: getActivityTypeColor(type) }}>
                          {getActivityTypeIcon(type)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {type === 'interview' && 'Phỏng Vấn'}
                          {type === 'quiz' && 'Quiz'}
                          {type === 'test' && 'Kiểm Tra'}
                          {type === 'practice' && 'Luyện Tập'}
                          {type === 'learning' && 'Học Tập'}
                          {!['interview', 'quiz', 'test', 'practice', 'learning'].includes(type) && type}
                        </p>
                        <p className="text-sm text-gray-600">{count} lần</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{Math.round(percentage)}%</div>
                      <Badge variant="outline" style={{ borderColor: getActivityTypeColor(type), color: getActivityTypeColor(type) }}>
                        {count} hoạt động
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Most Productive Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ngày Hiệu Quả Nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-900">
                      {new Date(stats.mostProductiveDay.period).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                    <p className="text-sm text-green-700">Ngày học tập hiệu quả nhất</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {Math.round(stats.mostProductiveDay.totalDuration)}m
                    </div>
                    <div className="text-xs text-green-600">Thời gian</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {stats.mostProductiveDay.totalActivities}
                    </div>
                    <div className="text-xs text-green-600">Hoạt động</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {Math.round(stats.mostProductiveDay.avgScore || 0)}%
                    </div>
                    <div className="text-xs text-green-600">Điểm TB</div>
                  </div>
                </div>
              </div>

              {/* Study Habits Insights */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Thông Tin Thói Quen Học</h4>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Streak Hiện Tại</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Bạn đã học liên tục {currentStreak} ngày. 
                    {currentStreak === 0 && ' Hãy bắt đầu một streak mới!'}
                    {currentStreak > 0 && currentStreak < 7 && ' Tiếp tục để đạt mốc 1 tuần!'}
                    {currentStreak >= 7 && ' Thật tuyệt vời!'}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Hiệu Suất</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Phiên học trung bình của bạn là {Math.round(stats.avgSessionLength)} phút.
                    {stats.avgSessionLength < 15 && ' Thử tăng thời gian mỗi phiên để hiệu quả hơn.'}
                    {stats.avgSessionLength >= 15 && stats.avgSessionLength <= 45 && ' Đây là độ dài lý tưởng!'}
                    {stats.avgSessionLength > 45 && ' Có thể chia nhỏ để duy trì sự tập trung.'}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Tính Nhất Quán</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Bạn học {Math.round(stats.consistency)}% số ngày trong khoảng thời gian này.
                    {stats.consistency < 50 && ' Hãy cố gắng học đều đặn hơn!'}
                    {stats.consistency >= 50 && stats.consistency < 80 && ' Tốt, nhưng có thể cải thiện thêm.'}
                    {stats.consistency >= 80 && ' Tính nhất quán tuyệt vời!'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudyTimeAnalysis;