'use client';

'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProgressStats {
  totalInterviews: number;
  averageScore: number;
  studyStreak: number;
  totalStudyTime: number;
}

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
  stats: ProgressStats;
  skillProgress: SkillProgress[];
  currentFocus: string[];
  nextMilestones: Array<{
    goal: string;
    targetDate: Date;
  }>;
  recommendations: string[];
}

export default function TrackingDashboard() {
  const { isLoaded, user } = useUser();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/tracking');
        const data = await response.json();
        setProgress(data);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchProgress();
    }
  }, [isLoaded, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No progress data available yet. Start practicing to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Study Streak</h3>
          <p className="mt-2 text-3xl font-semibold">
            {progress.stats.studyStreak} days
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Interviews</h3>
          <p className="mt-2 text-3xl font-semibold">
            {progress.stats.totalInterviews}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
          <p className="mt-2 text-3xl font-semibold">
            {progress.stats.averageScore.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Study Time</h3>
          <p className="mt-2 text-3xl font-semibold">
            {(() => {
              const total = progress.stats.totalStudyTime;
              if (total < 60) return `${total} phút`;
              const hours = Math.floor(total / 60);
              const minutes = total % 60;
              return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
            })()}
          </p>
        </Card>
      </div>

      {/* Skills Progress */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Skills Progress</h2>
        <div className="space-y-6">
          {progress.skillProgress.map((skill) => (
            <div key={skill.name}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">{skill.name}</span>
                <span className="text-sm text-gray-500">{skill.level}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
              {skill.progress.length > 0 && (
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
      </Card>

      {/* Current Focus & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Focus</h2>
          <ul className="space-y-2">
            {(progress.currentFocus ?? []).map((focus: string, index: number) => (
              <li
                key={index}
                className="flex items-center text-gray-700"
              >
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                {focus}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {(progress.recommendations ?? []).map((recommendation: string, index: number) => (
              <li
                key={index}
                className="flex items-center text-gray-700"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {recommendation}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Upcoming Milestones */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Milestones</h2>
        <div className="space-y-4">
          {(progress.nextMilestones ?? []).map((milestone: { goal: string; targetDate: Date }, index: number) => (
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
      </Card>
    </div>
  );
}
