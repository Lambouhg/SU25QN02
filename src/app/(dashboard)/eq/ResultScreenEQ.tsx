import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Users, MessageCircle, Trophy, Clock, Calendar } from 'lucide-react';

interface ResultScreenEQProps {
  results: {
    duration: number;
    selectedCategory: string;
    level: string;
    scores: {
      emotionalAwareness: number;
      conflictResolution: number;
      communication: number;
      overall: number;
    };
    messages: any[];
    timestamp: string;
    totalTime: number;
  };
  realTimeScores: {
    emotionalAwareness: number;
    conflictResolution: number;
    communication: number;
    suggestions: {
      emotionalAwareness: string;
      conflictResolution: string;
      communication: string;
    };
  };
  onReset: () => void;
}

export default function ResultScreenEQ({ results, realTimeScores, onReset }: ResultScreenEQProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getOverallGrade = (score: number) => {
    if (score >= 85) return { grade: 'A+', label: 'Excellent', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', label: 'Very Good', color: 'text-green-600' };
    if (score >= 75) return { grade: 'B+', label: 'Good', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'B', label: 'Above Average', color: 'text-blue-600' };
    if (score >= 65) return { grade: 'C+', label: 'Average', color: 'text-yellow-600' };
    if (score >= 60) return { grade: 'C', label: 'Below Average', color: 'text-yellow-600' };
    return { grade: 'D', label: 'Needs Improvement', color: 'text-red-600' };
  };

  const overallGrade = getOverallGrade(results.scores.overall);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">EQ Interview Results</CardTitle>
          <p className="text-gray-600 mt-2">
            Your emotional intelligence assessment for {results.selectedCategory}
          </p>
        </CardHeader>
      </Card>

      {/* Overall Score */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Trophy className="h-6 w-6 text-purple-600" />
            Overall EQ Score
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="mb-4">
            <div className={`text-6xl font-bold ${overallGrade.color} mb-2`}>
              {overallGrade.grade}
            </div>
            <div className={`text-xl font-semibold ${overallGrade.color}`}>
              {overallGrade.label}
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {Math.round(results.scores.overall)}%
            </div>
          </div>
          <Progress value={results.scores.overall} className="h-3" />
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl font-semibold text-gray-900">Detailed Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emotional Awareness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Emotional Awareness</h3>
                  <p className="text-sm text-gray-600">Recognition and management of emotions</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${getScoreBgColor(results.scores.emotionalAwareness)} ${getScoreColor(results.scores.emotionalAwareness)} border-current text-lg px-4 py-2`}
              >
                {Math.round(results.scores.emotionalAwareness)}%
              </Badge>
            </div>
            <Progress value={results.scores.emotionalAwareness} className="h-2" />
            {realTimeScores.suggestions.emotionalAwareness && (
              <p className="text-sm text-gray-600 italic">
                💡 {realTimeScores.suggestions.emotionalAwareness}
              </p>
            )}
          </div>

          {/* Conflict Resolution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Conflict Resolution</h3>
                  <p className="text-sm text-gray-600">Ability to resolve conflicts effectively</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${getScoreBgColor(results.scores.conflictResolution)} ${getScoreColor(results.scores.conflictResolution)} border-current text-lg px-4 py-2`}
              >
                {Math.round(results.scores.conflictResolution)}%
              </Badge>
            </div>
            <Progress value={results.scores.conflictResolution} className="h-2" />
            {realTimeScores.suggestions.conflictResolution && (
              <p className="text-sm text-gray-600 italic">
                💡 {realTimeScores.suggestions.conflictResolution}
              </p>
            )}
          </div>

          {/* Communication */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Communication</h3>
                  <p className="text-sm text-gray-600">Clarity and effectiveness in communication</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${getScoreBgColor(results.scores.communication)} ${getScoreColor(results.scores.communication)} border-current text-lg px-4 py-2`}
              >
                {Math.round(results.scores.communication)}%
              </Badge>
            </div>
            <Progress value={results.scores.communication} className="h-2" />
            {realTimeScores.suggestions.communication && (
              <p className="text-sm text-gray-600 italic">
                💡 {realTimeScores.suggestions.communication}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interview Details */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="text-lg font-semibold text-gray-900">Interview Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-sm text-gray-600">Category</div>
              <div className="font-semibold text-gray-900">{results.selectedCategory}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Trophy className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-sm text-gray-600">Level</div>
              <div className="font-semibold text-gray-900">{results.level}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-sm text-gray-600">Duration</div>
              <div className="font-semibold text-gray-900">{results.totalTime} min</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-sm text-gray-600">Questions</div>
              <div className="font-semibold text-gray-900">{results.messages.filter(m => m.sender === 'ai').length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-white">
          <CardTitle className="text-lg font-semibold text-gray-900">EQ Development Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.scores.emotionalAwareness < 70 && (
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-purple-900 mb-2">Emotional Awareness</h4>
              <p className="text-purple-800 text-sm">
                Practice mindfulness and self-reflection. Consider keeping an emotion journal to track your feelings and triggers in workplace situations.
              </p>
            </div>
          )}
          {results.scores.conflictResolution < 70 && (
            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-semibold text-orange-900 mb-2">Conflict Resolution</h4>
              <p className="text-orange-800 text-sm">
                Learn active listening techniques and practice finding common ground. Consider taking a conflict resolution workshop or course.
              </p>
            </div>
          )}
          {results.scores.communication < 70 && (
            <div className="p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
              <h4 className="font-semibold text-teal-900 mb-2">Communication</h4>
              <p className="text-teal-800 text-sm">
                Work on clarity and structure in your responses. Practice delivering feedback constructively and consider public speaking courses.
              </p>
            </div>
          )}
          {results.scores.overall >= 80 && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-green-900 mb-2">Excellent Work!</h4>
              <p className="text-green-800 text-sm">
                Your EQ skills are strong! Continue to practice and mentor others. Consider leadership roles where you can apply these skills.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={onReset}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
        >
          Practice Again
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="border-purple-300 text-purple-600 hover:bg-purple-50 px-8 py-3"
        >
          Print Results
        </Button>
      </div>
    </div>
  );
}
