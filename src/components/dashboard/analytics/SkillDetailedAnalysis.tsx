'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Brain,
  BookOpen,
  Code,
  MessageSquare,
  Lightbulb,
  Zap,
  Award,
  Activity
} from 'lucide-react';

interface SkillAnalysis {
  skillName: string;
  currentScore: number;
  improvement: number;
  trend: string;
  timeline: Array<{ score: number; date: string }>;
}

interface SkillDetailedAnalysisProps {
  skills: SkillAnalysis[];
}

const SkillDetailedAnalysis: React.FC<SkillDetailedAnalysisProps> = ({ skills }) => {
  // Nhóm kỹ năng theo category
  const skillCategories = {
    technical: ['Programming', 'Database', 'System Design', 'Data Structures', 'Algorithms', 'API Design'],
    communication: ['Communication', 'Presentation', 'Teamwork', 'Leadership', 'Problem Explanation'],
    problemSolving: ['Problem Solving', 'Analytical Thinking', 'Critical Thinking', 'Debugging', 'Optimization'],
    interview: ['Interview Skills', 'Confidence', 'Time Management', 'Stress Management']
  };

  const categorizeSkill = (skillName: string) => {
    for (const [category, skillList] of Object.entries(skillCategories)) {
      if (skillList.some(s => skillName.toLowerCase().includes(s.toLowerCase()))) {
        return category;
      }
    }
    return 'other';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return Code;
      case 'communication': return MessageSquare;
      case 'problemSolving': return Brain;
      case 'interview': return Target;
      default: return BookOpen;
    }
  };



  const getScoreLevel = (score: number) => {
    if (score >= 90) return { level: 'Chuyên gia', color: 'text-purple-600 bg-purple-100' };
    if (score >= 80) return { level: 'Thành thạo', color: 'text-green-600 bg-green-100' };
    if (score >= 70) return { level: 'Tốt', color: 'text-blue-600 bg-blue-100' };
    if (score >= 60) return { level: 'Khá', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'Cần cải thiện', color: 'text-red-600 bg-red-100' };
  };

  const getTrendIcon = (trend: string, improvement: number) => {
    if (trend === 'improving' || improvement > 5) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (trend === 'declining' || improvement < -5) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  // Phân tích tổng quan kỹ năng
  const getSkillSummary = () => {
    if (skills.length === 0) return null;

    const totalScore = skills.reduce((sum, skill) => sum + skill.currentScore, 0);
    const avgScore = totalScore / skills.length;
    
    const improvingSkills = skills.filter(s => s.improvement > 5 || s.trend === 'improving').length;
    const decliningSkills = skills.filter(s => s.improvement < -5 || s.trend === 'declining').length;
    
    const topSkill = skills.reduce((prev, current) => 
      prev.currentScore > current.currentScore ? prev : current
    );
    
    const needsWorkSkill = skills.reduce((prev, current) => 
      prev.currentScore < current.currentScore ? prev : current
    );

    return {
      avgScore,
      improvingSkills,
      decliningSkills,
      topSkill,
      needsWorkSkill,
      totalSkills: skills.length
    };
  };

  const summary = getSkillSummary();

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = categorizeSkill(skill.skillName);
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, SkillAnalysis[]>);

  if (!skills || skills.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa Có Phân Tích Kỹ Năng
          </h3>
          <p className="text-gray-600 mb-6">
            Bắt đầu luyện tập để xem phân tích chi tiết về kỹ năng của bạn.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skill Summary Overview */}
      {summary && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Award className="h-5 w-5" />
              Tổng Quan Kỹ Năng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-900">{Math.round(summary.avgScore)}%</div>
                <div className="text-sm text-indigo-600">Điểm TB Tổng</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-green-600">{summary.improvingSkills}</div>
                <div className="text-sm text-indigo-600">Kỹ Năng Tăng</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-red-600">{summary.decliningSkills}</div>
                <div className="text-sm text-indigo-600">Cần Chú Ý</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-900">{summary.totalSkills}</div>
                <div className="text-sm text-indigo-600">Tổng Kỹ Năng</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">Kỹ Năng Mạnh Nhất</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{summary.topSkill.skillName}</span>
                  <span className="ml-2 text-green-600">({Math.round(summary.topSkill.currentScore)}%)</span>
                </div>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-amber-800">Cần Cải Thiện</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{summary.needsWorkSkill.skillName}</span>
                  <span className="ml-2 text-amber-600">({Math.round(summary.needsWorkSkill.currentScore)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills by Category */}
      {Object.entries(groupedSkills).map(([category, categorySkills]) => {
        const IconComponent = getCategoryIcon(category);
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {category === 'technical' && 'Kỹ Năng Kỹ Thuật'}
                {category === 'communication' && 'Kỹ Năng Giao Tiếp'}
                {category === 'problemSolving' && 'Tư Duy Logic'}
                {category === 'interview' && 'Kỹ Năng Phỏng Vấn'}
                {category === 'other' && 'Kỹ Năng Khác'}
                <Badge variant="outline" className="ml-2">
                  {categorySkills.length} kỹ năng
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySkills.map((skill, index) => {
                  const scoreLevel = getScoreLevel(skill.currentScore);
                  const recentGrowth = skill.timeline.length > 1 
                    ? skill.timeline[0].score - skill.timeline[skill.timeline.length - 1].score
                    : 0;
                    
                  return (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                            {getTrendIcon(skill.trend, skill.improvement)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={scoreLevel.color}>
                              {scoreLevel.level}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              Điểm hiện tại: {Math.round(skill.currentScore)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {recentGrowth !== 0 && (
                            <div className={`text-sm ${recentGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {recentGrowth > 0 ? '+' : ''}{Math.round(recentGrowth)}%
                              <div className="text-xs text-gray-500">từ lần cuối</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <Progress value={skill.currentScore} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      {/* Skill Timeline Mini Chart */}
                      {skill.timeline.length > 1 && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-gray-600">
                              Lịch sử ({skill.timeline.length} lần đánh giá)
                            </span>
                          </div>
                          <div className="flex items-end gap-1 h-8">
                            {skill.timeline.slice(0, 10).reverse().map((point, idx) => (
                              <div
                                key={idx}
                                className="bg-blue-200 rounded-t flex-1 relative group cursor-pointer"
                                style={{ height: `${(point.score / 100) * 100}%`, minHeight: '2px' }}
                              >
                                <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {Math.round(point.score)}% - {new Date(point.date).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Recommendations for improvement */}
                      {skill.currentScore < 75 && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Gợi ý cải thiện:</span>
                          </div>
                          <p className="text-xs text-blue-700">
                            {skill.currentScore < 50 && 'Cần luyện tập cơ bản và đọc tài liệu để nắm vững kiến thức.'}
                            {skill.currentScore >= 50 && skill.currentScore < 75 && 'Hãy thực hành nhiều bài tập và tham gia các dự án thực tế.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SkillDetailedAnalysis;