"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BarChart3, 
  Trophy, 
  Target,
  Clock,
  BookOpen,
  ArrowRight,
  Star
} from 'lucide-react';

interface QuizResultsProps {
  score: {
    score: number;
    total: number;
    details?: Array<{
      isRight: boolean;
      correctIdx: number[];
      givenIdx: number[];
    }>;
  };
  timeUsed?: number;
  onRestart: () => void;
  onReview: () => void;
  onViewDetails?: () => void;
  items: Array<{
    questionId: string;
    stem: string;
    type: string;
    options?: { text: string }[];
  }>;
  attemptId?: string;
}

export default function QuizResults({
  score,
  timeUsed,
  onRestart,
  onReview,
  onViewDetails,
  items,
  attemptId
}: QuizResultsProps) {
  const percentage = Math.round((score.score / score.total) * 100);
  const correctAnswers = score.details?.filter(d => d.isRight).length || 0;
  const wrongAnswers = score.total - correctAnswers;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excellent', color: 'bg-green-500', icon: <Trophy className="w-4 h-4" /> };
    if (percentage >= 80) return { text: 'Good', color: 'bg-blue-500', icon: <Star className="w-4 h-4" /> };
    if (percentage >= 60) return { text: 'Fair', color: 'bg-yellow-500', icon: <Target className="w-4 h-4" /> };
    return { text: 'Needs Improvement', color: 'bg-red-500', icon: <BookOpen className="w-4 h-4" /> };
  };

  const scoreBadge = getScoreBadge(percentage);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Quiz Completed!</h1>
        </div>
        <p className="text-gray-600 text-lg">Here's how you performed</p>
      </div>

      {/* Score Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Main Score */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Badge className={`${scoreBadge.color} text-white px-4 py-2 text-lg`}>
                  <div className="flex items-center gap-2">
                    {scoreBadge.icon}
                    {scoreBadge.text}
                  </div>
                </Badge>
              </div>
              
              <div className="text-6xl font-bold text-gray-800">
                {score.score} / {score.total}
              </div>
              
              <div className={`text-3xl font-semibold ${getScoreColor(percentage)}`}>
                {percentage}%
              </div>
              
              <Progress value={percentage} className="h-3 max-w-md mx-auto" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Correct</h3>
                </div>
                <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-gray-600">questions</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Incorrect</h3>
                </div>
                <div className="text-2xl font-bold text-red-600">{wrongAnswers}</div>
                <div className="text-sm text-gray-600">questions</div>
              </div>

              {timeUsed && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Time Used</h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{formatTime(timeUsed)}</div>
                  <div className="text-sm text-gray-600">minutes</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {score.details && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">Question Review</h2>
            <p className="text-gray-600">Review your answers and learn from mistakes</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {score.details.map((detail, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  detail.isRight
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {detail.isRight ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-sm">
                        Question {index + 1}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-sm ${
                          detail.isRight
                            ? 'border-green-200 text-green-700 bg-green-50'
                            : 'border-red-200 text-red-700 bg-red-50'
                        }`}
                      >
                        {detail.isRight ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <p className="text-gray-800 font-medium mb-2">
                      {items[index]?.stem}
                    </p>
                    {!detail.isRight && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Correct answer:</span> Option {detail.correctIdx.map(i => i + 1).join(', ')}
                        <br />
                        <span className="font-medium">Your answer:</span> Option {detail.givenIdx.map(i => i + 1).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onRestart}
              variant="outline"
              className="flex items-center gap-2 px-8 py-3"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            
            <Button
              onClick={onReview}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Review Questions
              <ArrowRight className="w-4 h-4" />
            </Button>

            {onViewDetails && attemptId && (
              <Button
                onClick={onViewDetails}
                variant="outline"
                className="flex items-center gap-2 px-8 py-3 border-green-200 text-green-700 hover:bg-green-50"
              >
                <BarChart3 className="w-4 h-4" />
                View in History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
