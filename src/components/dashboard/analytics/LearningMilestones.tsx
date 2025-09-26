'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Award,
  Zap,
  Calendar
} from 'lucide-react';

interface Achievement {
  type: string;
  milestone: number;
  title: string;
  description: string;
  unlockedAt?: string;
}

interface LearningMilestonesProps {
  achievements: Achievement[];
  currentStreak: number;
  totalActivities: number;
  weeklyAvgScore: number;
  monthlyAvgScore: number;
  totalStudyTime: number;
}

const LearningMilestones: React.FC<LearningMilestonesProps> = ({
  currentStreak,
  totalActivities,
  weeklyAvgScore,
  totalStudyTime
}) => {
  // Define possible milestones
  const allMilestones = [
    // Streak Milestones
    { type: 'streak', threshold: 3, title: '3-Day Streak', description: 'Study for 3 consecutive days', icon: Flame, color: 'orange' },
    { type: 'streak', threshold: 7, title: 'Weekly Warrior', description: 'Study for 1 week straight', icon: Flame, color: 'orange' },
    { type: 'streak', threshold: 14, title: 'Two-Week Champion', description: 'Study for 2 weeks straight', icon: Flame, color: 'red' },
    { type: 'streak', threshold: 30, title: 'Monthly Master', description: 'Study for 1 month straight', icon: Trophy, color: 'gold' },
    
    // Activity Milestones
    { type: 'activities', threshold: 5, title: 'Getting Started', description: 'Complete 5 activities', icon: Target, color: 'blue' },
    { type: 'activities', threshold: 10, title: 'Committed Learner', description: 'Complete 10 activities', icon: CheckCircle2, color: 'green' },
    { type: 'activities', threshold: 25, title: 'Practice Expert', description: 'Complete 25 activities', icon: Star, color: 'purple' },
    { type: 'activities', threshold: 50, title: 'Dedication Master', description: 'Complete 50 activities', icon: Award, color: 'gold' },
    { type: 'activities', threshold: 100, title: 'Century Club', description: 'Complete 100 activities', icon: Trophy, color: 'gold' },
    
    // Score Milestones
    { type: 'score', threshold: 70, title: 'Solid Performer', description: 'Weekly average score reaches 70%', icon: TrendingUp, color: 'green' },
    { type: 'score', threshold: 80, title: 'High Achiever', description: 'Weekly average score reaches 80%', icon: Star, color: 'purple' },
    { type: 'score', threshold: 90, title: 'Excellence Award', description: 'Weekly average score reaches 90%', icon: Trophy, color: 'gold' },
    
    // Study Time Milestones (in minutes)
    { type: 'study_time', threshold: 60, title: 'First Hour', description: 'Total study time reaches 1 hour', icon: Clock, color: 'blue' },
    { type: 'study_time', threshold: 300, title: 'Five Hours Strong', description: 'Total study time reaches 5 hours', icon: Clock, color: 'green' },
    { type: 'study_time', threshold: 600, title: 'Ten Hour Hero', description: 'Total study time reaches 10 hours', icon: Zap, color: 'purple' },
    { type: 'study_time', threshold: 1200, title: 'Study Marathon', description: 'Total study time reaches 20 hours', icon: Award, color: 'gold' }
  ];

  // Check which milestones have been achieved
  const checkMilestone = (milestone: typeof allMilestones[0]) => {
    switch (milestone.type) {
      case 'streak':
        return currentStreak >= milestone.threshold;
      case 'activities':
        return totalActivities >= milestone.threshold;
      case 'score':
        return weeklyAvgScore >= milestone.threshold;
      case 'study_time':
        // Convert totalStudyTime from seconds to minutes for comparison
        const studyTimeInMinutes = totalStudyTime / 60;
        return studyTimeInMinutes >= milestone.threshold;
      default:
        return false;
    }
  };

  // Calculate next milestones
  const getNextMilestones = () => {
    return allMilestones
      .filter(m => !checkMilestone(m))
      .sort((a, b) => getProgress(b) - getProgress(a)) // Sort by progress descending
      .slice(0, 4);
  };

  const getProgress = (milestone: typeof allMilestones[0]) => {
    let current = 0;
    switch (milestone.type) {
      case 'streak':
        current = currentStreak;
        break;
      case 'activities':
        current = totalActivities;
        break;
      case 'score':
        current = weeklyAvgScore;
        break;
      case 'study_time':
        // Convert totalStudyTime from seconds to minutes for progress calculation
        current = totalStudyTime / 60;
        break;
    }
    return Math.min((current / milestone.threshold) * 100, 100);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'orange':
        return 'text-orange-500 bg-orange-100';
      case 'red':
        return 'text-red-500 bg-red-100';
      case 'gold':
        return 'text-yellow-500 bg-yellow-100';
      case 'blue':
        return 'text-blue-500 bg-blue-100';
      case 'green':
        return 'text-green-500 bg-green-100';
      case 'purple':
        return 'text-purple-500 bg-purple-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const unlockedMilestones = allMilestones.filter(checkMilestone);
  const nextMilestones = getNextMilestones();
  
  // Debug logging for milestones
  console.log('📊 All milestones check:', allMilestones.map(m => ({
    title: m.title,
    type: m.type,
    threshold: m.threshold,
    achieved: checkMilestone(m),
    progress: getProgress(m)
  })));
  console.log('🎯 Next milestones debug:', nextMilestones.map(m => ({ 
    title: m.title, 
    achieved: checkMilestone(m), 
    progress: getProgress(m) 
  })));
  console.log('🏆 Unlocked milestones:', unlockedMilestones.map(m => m.title));
  console.log('📊 Next milestones length:', nextMilestones.length);

  return (
    <div className="space-y-6">
      {/* Achievements Unlocked */}
      <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Trophy className="h-5 w-5" />
            Unlocked Achievements ({unlockedMilestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unlockedMilestones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedMilestones.map((milestone, index) => {
                const IconComponent = milestone.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200 shadow-sm">
                    <div className={`p-2 rounded-full ${getColorClass(milestone.color)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{milestone.title}</h4>
                      <p className="text-xs text-gray-600">{milestone.description}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Achieved
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-gray-600">Keep studying to unlock your first achievement!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Towards Next Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Upcoming Goals
          </CardTitle>
          <p className="text-sm text-gray-600">You are getting close to these achievements</p>
        </CardHeader>
        <CardContent>
          {nextMilestones.length > 0 ? (
            <div className="space-y-4">
              {nextMilestones.map((milestone, index) => {
              const IconComponent = milestone.icon;
              const progress = getProgress(milestone);
              
              return (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-full ${getColorClass(milestone.color)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(progress)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {milestone.type === 'streak' && `${currentStreak}/${milestone.threshold} days`}
                        {milestone.type === 'activities' && `${totalActivities}/${milestone.threshold} activities`}
                        {milestone.type === 'score' && `${Math.round(weeklyAvgScore)}%/${milestone.threshold}%`}
                        {milestone.type === 'study_time' && `${Math.round(totalStudyTime/60)}h/${Math.round(milestone.threshold/60)}h`}
                      </span>
                      <span>
                        {milestone.type === 'streak' && `Remaining ${milestone.threshold - currentStreak} days`}
                        {milestone.type === 'activities' && `Remaining ${milestone.threshold - totalActivities} activities`}
                        {milestone.type === 'score' && `Remaining ${Math.round(milestone.threshold - weeklyAvgScore)}%`}
                        {milestone.type === 'study_time' && `Remaining ${Math.round((milestone.threshold - totalStudyTime)/60)}h`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No upcoming goals!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Statistics Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calendar className="h-5 w-5" />
            Study Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{currentStreak}</div>
              <div className="text-sm text-blue-600">Current streak</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{totalActivities}</div>
              <div className="text-sm text-blue-600">Total activities</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <Star className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{Math.round(weeklyAvgScore)}%</div>
              <div className="text-sm text-blue-600">Weekly avg. score</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{Math.round(totalStudyTime/60)}h</div>
              <div className="text-sm text-blue-600">Total study time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningMilestones;