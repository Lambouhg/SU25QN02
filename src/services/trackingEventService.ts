import prisma from '@/lib/prisma';
import { ActivityType, Prisma } from '@prisma/client';

type JsonValue = Prisma.JsonValue;

type NullableNumber = number | null | undefined;

// Progress Analytics Types
interface EventData {
  timestamp: Date;
  activityType: ActivityType;
  score: number | null;
  duration: number | null;
  skillDeltas: JsonValue; // JsonValue from Prisma  
  metadata: JsonValue; // JsonValue from Prisma
}

interface GroupedEvents {
  period: string;
  events: EventData[];
}

interface PeriodStats {
  totalActivities: number;
  avgScore: number;
  totalDuration: number;
  activityBreakdown: Record<string, number>;
  scoreDistribution: ScoreDistribution;
}

interface ScoreDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface TrendData {
  slope: number;
  direction: 'improving' | 'declining' | 'stable';
}

interface SkillTimelineEntry {
  score: number;
  date: Date;
  source: ActivityType | null;
  referenceId: string | null;
}

interface SkillSnapshot {
  skillName: string;
  score: number;
  createdAt: Date;
  source: ActivityType | null;
  referenceId: string | null;
}

export interface BaseEventInput {
  userId: string;
  activityType: ActivityType;
  feature: string;
  action: string; // 'started' | 'completed' | 'answered' | 'resumed' | 'retried' | 'evaluated'
  referenceId?: string;
  score?: NullableNumber;
  duration?: NullableNumber; // seconds
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  skillDeltas?: Record<string, number>;
}

export class TrackingEventService {
  static async recordEvent(event: BaseEventInput) {
    try {
      const timestamp = event.timestamp ?? new Date();

      const created = await prisma.userActivityEvent.create({
        data: {
          userId: event.userId,
          activityType: event.activityType,
          feature: event.feature,
          action: event.action,
          score: event.score ?? null,
          duration: event.duration ?? null,
        referenceId: event.referenceId ?? null,
        timestamp,
        metadata: (event.metadata ?? {}) as unknown as object,
        skillDeltas: (event.skillDeltas ?? {}) as unknown as object,
      }
    });

    await this.updateDailyStats({
      userId: event.userId,
      date: timestamp,
      score: event.score ?? null,
      duration: event.duration ?? 0,
      activityType: event.activityType,
      feature: event.feature,
    });

    if (event.skillDeltas && Object.keys(event.skillDeltas).length > 0) {
      await this.recordSkillSnapshots({
        userId: event.userId,
        skillDeltas: event.skillDeltas,
        source: event.activityType,
        referenceId: event.referenceId,
        createdAt: timestamp,
      });
    }

    return created;
    } catch (error) {
      console.error(`[TrackingEventService] recordEvent failed:`, error);
      throw error;
    }
  }

  static async trackQuizCompleted(input: {
    userId: string;
    quizId: string;
    field: string;
    topic: string;
    level: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeUsedSeconds: number; // seconds
    retryCount?: number;
    skillDeltas?: Record<string, number>;
  }) {
    return this.recordEvent({
      userId: input.userId,
      activityType: 'quiz',
      feature: 'secure_quiz',
      action: 'completed',
      referenceId: input.quizId,
      score: input.score,
      duration: input.timeUsedSeconds,
      metadata: {
        field: input.field,
        topic: input.topic,
        level: input.level,
        totalQuestions: input.totalQuestions,
        correctAnswers: input.correctAnswers,
        retryCount: input.retryCount ?? 0,
      },
      skillDeltas: input.skillDeltas,
    });
  }

  static async trackAssessmentCompleted(input: {
    userId: string;
    assessmentId: string;
    level: string;
    totalTimeSeconds: number;
    overallScore: number;
    jobRoleId?: string | null;
    history?: unknown;
    realTimeScores?: unknown;
    finalScores?: unknown;
    skillDeltas?: Record<string, number>;
  }) {
    console.log(`[TrackingEventService] trackAssessmentCompleted called with:`, input);
    
    try {
      const result = await this.recordEvent({
        userId: input.userId,
        activityType: 'assessment' as ActivityType, // Use 'assessment' for assessment activities to distinguish from quiz
        feature: 'assessment_test',
        action: 'completed',
        referenceId: input.assessmentId,
        score: input.overallScore,
        duration: input.totalTimeSeconds,
        metadata: {
          level: input.level,
          jobRoleId: input.jobRoleId ?? undefined,
          history: input.history,
          realTimeScores: input.realTimeScores,
          finalScores: input.finalScores,
        },
        skillDeltas: input.skillDeltas,
      });
      
      console.log(`[TrackingEventService] trackAssessmentCompleted successful:`, result);
      return result;
    } catch (error) {
      console.error(`[TrackingEventService] trackAssessmentCompleted failed:`, error);
      throw error;
    }
  }

  static async trackAvatarInterviewCompleted(input: {
    userId: string;
    interviewId: string;
    durationSeconds: number;
    overallRating?: number;
    questionCount?: number;
    coveredTopics?: string[];
    evaluationBreakdown?: Record<string, number>;
    language?: string;
    jobRoleId?: string | null;
    skillDeltas?: Record<string, number>;
    progress?: number;
  }) {
    // Validate duration (should be in seconds)
    if (input.durationSeconds < 0) {
      console.warn(`Invalid duration: ${input.durationSeconds}s for interview ${input.interviewId} - duration cannot be negative`);
    } else if (input.durationSeconds > 3600) {
      console.warn(`Suspicious duration: ${input.durationSeconds}s (${Math.round(input.durationSeconds/60)}min) for interview ${input.interviewId} - very long interview`);
    } else if (input.durationSeconds < 30) {
      console.warn(`Very short duration: ${input.durationSeconds}s for interview ${input.interviewId} - might be incomplete`);
    }
    
    console.log(`📊 Tracking avatar interview completion: ${input.interviewId}, duration: ${input.durationSeconds}s, score: ${input.overallRating || 'N/A'}`);
    
    return this.recordEvent({
      userId: input.userId,
      activityType: 'interview',
      feature: 'avatar_interview',
      action: 'completed',
      referenceId: input.interviewId,
      score: input.overallRating,
      duration: input.durationSeconds,
      metadata: {
        questionCount: input.questionCount,
        coveredTopics: input.coveredTopics,
        evaluationBreakdown: input.evaluationBreakdown,
        language: input.language,
        jobRoleId: input.jobRoleId ?? undefined,
        progress: typeof input.progress === 'number' ? input.progress : undefined,
      },
      skillDeltas: input.skillDeltas,
    });
  }

  static async trackJdAnswered(input: {
    userId: string;
    jdQuestionSetId: string;
    questionIndex: number;
    timeSpentSeconds?: number;
    overallScore?: number;
    strengths?: string[];
    improvements?: string[];
    detailedScores?: Record<string, number>;
    feedback?: string;
    skillDeltas?: Record<string, number>;
  }) {
    return this.recordEvent({
      userId: input.userId,
      activityType: 'jd',
      feature: 'jd_qa',
      action: 'answered',
      referenceId: `${input.jdQuestionSetId}:${input.questionIndex}`,
      score: input.overallScore,
      duration: input.timeSpentSeconds,
      metadata: {
        strengths: input.strengths ?? [],
        improvements: input.improvements ?? [],
        detailedScores: input.detailedScores ?? {},
        feedback: input.feedback,
      },
      skillDeltas: input.skillDeltas,
    });
  }

  // Internals
  private static normalizeDateToUTC(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  static async updateDailyStats(input: {
    userId: string;
    date: Date;
    score: NullableNumber;
    duration: number; // seconds
    activityType: ActivityType;
    feature: string;
  }) {
    const day = this.normalizeDateToUTC(input.date);

    const existing = await prisma.userDailyStats.findUnique({
      where: { userId_date: { userId: input.userId, date: day } }
    });

    if (!existing) {
      await prisma.userDailyStats.create({
        data: {
          userId: input.userId,
          date: day,
          totalActivities: 1,
          totalDuration: Math.max(0, Math.round(input.duration ?? 0)),
          avgScore: input.score ?? null,
          activityTypeBreakdown: {
            [input.activityType]: 1,  // Only count by activityType, not feature
          } as unknown as object,
          skillAverages: {},
        }
      });
      return;
    }

    const prevCount = existing.totalActivities ?? 0;
    const prevAvg = existing.avgScore ?? null;
    const nextCount = prevCount + 1;

    let nextAvg: number | null = prevAvg;
    if (typeof input.score === 'number') {
      if (typeof prevAvg === 'number') {
        nextAvg = (prevAvg * prevCount + input.score) / nextCount;
      } else {
        nextAvg = input.score;
      }
    }

    const prevBreakdown = (existing.activityTypeBreakdown as Record<string, number> | null) ?? {};
    const nextBreakdown = { ...prevBreakdown } as Record<string, number>;
    nextBreakdown[input.activityType] = (nextBreakdown[input.activityType] ?? 0) + 1;
    // Removed duplicate feature counting

    await prisma.userDailyStats.update({
      where: { userId_date: { userId: input.userId, date: day } },
      data: {
        totalActivities: nextCount,
        totalDuration: (existing.totalDuration ?? 0) + Math.max(0, Math.round(input.duration ?? 0)),
        avgScore: nextAvg,
        activityTypeBreakdown: nextBreakdown as unknown as object,
      }
    });
  }

  static async recordSkillSnapshots(input: {
    userId: string;
    skillDeltas: Record<string, number>;
    source?: ActivityType;
    referenceId?: string;
    createdAt?: Date;
  }) {
    const createdAt = input.createdAt ?? new Date();
    const entries = Object.entries(input.skillDeltas);
    if (entries.length === 0) return;

    // Filter out non-numeric scores to prevent database errors
    const validEntries = entries.filter(([skillName, score]) => {
      if (typeof score !== 'number') {
        console.warn(`Skipping skill snapshot for ${skillName}: expected number, got ${typeof score}`, score);
        return false;
      }
      return true;
    });

    if (validEntries.length === 0) return;

    await prisma.$transaction(
      validEntries.map(([skillName, score]) =>
        prisma.userSkillSnapshot.create({
          data: {
            userId: input.userId,
            skillName,
            score,
            source: input.source ?? null,
            referenceId: input.referenceId ?? null,
            createdAt,
          }
        })
      )
    );
  }

  // =====================================================
  // 🎯 PROGRESS ANALYTICS API - Phase 1 Implementation
  // =====================================================

  /**
   * Get progress trends over time periods using UserDailyStats for better performance
   */
  static async getProgressTrends(userId: string, options: {
    timeRange: '7d' | '30d' | '90d' | '1y';
    activityTypes?: ActivityType[];
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const endDate = new Date();
    const startDate = this.getStartDateForRange(options.timeRange);
    
    console.log(`[ProgressAnalytics] Getting trends for user ${userId}, range: ${options.timeRange} (using UserDailyStats)`);
    
    // Use UserDailyStats instead of UserActivityEvent for better performance
    const dailyStats = await prisma.userDailyStats.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });

    const timeline = dailyStats.map(stat => ({
      period: stat.date.toISOString().split('T')[0],
      avgScore: stat.avgScore || 0,
      totalActivities: stat.totalActivities,
      totalDuration: stat.totalDuration,
      activityBreakdown: this.normalizeActivityTypes(stat.activityTypeBreakdown as Record<string, number> | null),
      skillChanges: stat.skillAverages as Record<string, number> || {}
    }));
    
    return {
      timeRange: options.timeRange,
      totalEvents: dailyStats.reduce((sum, stat) => sum + stat.totalActivities, 0),
      timeline,
      overallTrend: { slope: 0, direction: 'stable' as const }, // Simplified trend calculation
      insights: [], // Simplified insights
      // Add summary metrics for milestones
      streak: await this.getCurrentStreak(userId),
      totalActivities: dailyStats.reduce((sum, stat) => sum + stat.totalActivities, 0),
      weeklyAvgScore: this.calculateWeeklyAverage(dailyStats),
      totalStudyTime: dailyStats.reduce((sum, stat) => sum + stat.totalDuration, 0)
    };
  }

  /**
   * Compare performance between two time periods
   */
  static async comparePerformancePeriods(userId: string, options: {
    currentPeriod: { start: Date; end: Date };
    previousPeriod: { start: Date; end: Date };
    metric?: 'score' | 'duration' | 'frequency';
  }) {
    console.log(`[ProgressAnalytics] Comparing periods for user ${userId}`);
    
    const [currentStats, previousStats] = await Promise.all([
      this.getStatsForPeriod(userId, options.currentPeriod),
      this.getStatsForPeriod(userId, options.previousPeriod)
    ]);

    const metric = options.metric || 'score';
    const improvement = this.calculateImprovement(currentStats, previousStats, metric);
    
    return {
      current: currentStats,
      previous: previousStats,
      improvement: {
        percentage: improvement,
        trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
        significance: Math.abs(improvement) > 10 ? 'significant' : 'minor'
      },
      insights: this.generateComparisonInsights(currentStats, previousStats)
    };
  }

  /**
   * Get skill progression timeline
   */
  static async getSkillProgressionTimeline(userId: string, skillName?: string) {
    console.log(`[ProgressAnalytics] Getting skill progression for user ${userId}, skill: ${skillName || 'all'}`);
    
    const query = {
      where: {
        userId,
        ...(skillName && { skillName })
      },
      orderBy: { createdAt: 'asc' as const },
      select: {
        skillName: true,
        score: true,
        createdAt: true,
        source: true,
        referenceId: true
      }
    };

    const snapshots = await prisma.userSkillSnapshot.findMany(query);
    
    return this.processSkillTimeline(snapshots);
  }

  /**
   * Get current learning streak
   */
  static async getCurrentStreak(userId: string): Promise<number> {
    console.log(`[ProgressAnalytics] Calculating streak for user ${userId}`);
    
    const dailyStats = await prisma.userDailyStats.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true, totalActivities: true }
    });

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const stat of dailyStats) {
      const statDate = new Date(stat.date);
      statDate.setHours(0, 0, 0, 0);
      
      if (statDate.getTime() === currentDate.getTime() && stat.totalActivities > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (statDate.getTime() === currentDate.getTime() - 24 * 60 * 60 * 1000 && stat.totalActivities > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Generate comprehensive progress insights
   */
  static async generateProgressInsights(userId: string) {
    console.log(`[ProgressAnalytics] Generating insights for user ${userId}`);
    
    const [
      weeklyTrends,
      monthlyTrends,
      currentStreak,
      skillProgression
    ] = await Promise.all([
      this.getProgressTrends(userId, { timeRange: '7d' }),
      this.getProgressTrends(userId, { timeRange: '30d' }),
      this.getCurrentStreak(userId),
      this.getSkillProgressionTimeline(userId)
    ]);

    const insights = {
      summary: {
        currentStreak,
        weeklyAvgScore: weeklyTrends.timeline.length > 0 
          ? this.calculateAverage(weeklyTrends.timeline.map(t => t.avgScore).filter(Boolean) as number[])
          : 0,
        monthlyAvgScore: monthlyTrends.timeline.length > 0
          ? this.calculateAverage(monthlyTrends.timeline.map(t => t.avgScore).filter(Boolean) as number[])
          : 0,
        totalActivitiesThisMonth: monthlyTrends.totalEvents
      },
      trends: {
        weekly: weeklyTrends.overallTrend,
        monthly: monthlyTrends.overallTrend
      },
      skills: skillProgression,
      recommendations: this.generateSmartRecommendations(weeklyTrends, monthlyTrends, skillProgression),
      achievements: await this.checkRecentAchievements(userId),
      alerts: await this.checkProgressAlerts(userId, weeklyTrends)
    };

    return insights;
  }

  /**
   * Check for achievements based on recent activity
   */
  static async checkRecentAchievements(userId: string) {
    const achievements = [];
    
    // Check streak achievements
    const streak = await this.getCurrentStreak(userId);
    if ([7, 14, 30, 60, 90].includes(streak)) {
      achievements.push({
        type: 'streak',
        milestone: streak,
        title: `${streak} Day Streak!`,
        description: `Completed activities for ${streak} consecutive days`,
        earnedAt: new Date()
      });
    }

    // Check perfect scores
    const perfectScores = await this.countRecentPerfectScores(userId, 30);
    if ([1, 5, 10, 25].includes(perfectScores)) {
      achievements.push({
        type: 'excellence',
        milestone: perfectScores,
        title: `${perfectScores} Perfect Score${perfectScores > 1 ? 's' : ''}!`,
        description: `Achieved ${perfectScores} perfect scores this month`,
        earnedAt: new Date()
      });
    }

    return achievements;
  }

  /**
   * Check for progress alerts
   */
  static async checkProgressAlerts(userId: string, weeklyTrends: { overallTrend: TrendData; totalEvents: number }) {
    const alerts = [];
    
    // Performance decline alert
    if (weeklyTrends.overallTrend.slope < -0.5) {
      alerts.push({
        type: 'performance_decline',
        severity: 'warning',
        message: 'Your performance has declined this week',
        suggestions: [
          'Review recent feedback and mistakes',
          'Take breaks to avoid burnout',
          'Focus on fundamentals'
        ]
      });
    }
    
    // Low activity alert
    if (weeklyTrends.totalEvents < 3) {
      alerts.push({
        type: 'low_activity',
        severity: 'info',
        message: 'Your activity level is lower than usual',
        suggestions: [
          'Set daily learning goals',
          'Try shorter practice sessions',
          'Join study groups or challenges'
        ]
      });
    }

    return alerts;
  }

  // =====================================================
  // 🛠️ HELPER METHODS
  // =====================================================

  private static getStartDateForRange(range: string): Date {
    const now = new Date();
    switch (range) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private static groupEventsByTime(events: EventData[], groupBy: string): GroupedEvents[] {
    const groups: { [key: string]: EventData[] } = {};
    
    events.forEach(event => {
      let key: string;
      const date = new Date(event.timestamp);
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    
    return Object.entries(groups).map(([period, events]) => ({ period, events }));
  }

  private static async getStatsForPeriod(userId: string, period: { start: Date; end: Date }) {
    const events = await prisma.userActivityEvent.findMany({
      where: {
        userId,
        timestamp: { gte: period.start, lte: period.end }
      }
    });

    const scores = events.map(e => e.score).filter(Boolean) as number[];
    
    return {
      totalActivities: events.length,
      avgScore: this.calculateAverage(scores),
      totalDuration: events.reduce((sum, e) => sum + (e.duration || 0), 0),
      activityBreakdown: this.groupByActivityType(events),
      scoreDistribution: this.calculateScoreDistribution(scores)
    };
  }

  private static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private static calculateWeeklyAverage(dailyStats: Array<{avgScore?: number | null}>): number {
    const lastWeek = dailyStats.slice(0, 7);
    const scores = lastWeek
      .map(stat => stat.avgScore)
      .filter((score): score is number => score !== null && score !== undefined);
    return this.calculateAverage(scores);
  }

  private static normalizeActivityTypes(activityBreakdown: Record<string, number> | null): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    Object.entries(activityBreakdown || {}).forEach(([type, count]) => {
      const normalizedType = 
        (type === 'assessment' || type === 'assessment_test') ? 'assessment' :
        (type === 'interview' || type === 'avatar_interview') ? 'interview' :
        (type === 'quiz' || type === 'secure_quiz') ? 'quiz' :
        (type === 'jd' || type === 'jd_qa') ? 'jd' : // Added JD normalization
        type;
      
      normalized[normalizedType] = (normalized[normalizedType] || 0) + count;
    });
    
    return normalized;
  }

  private static calculateImprovement(current: PeriodStats, previous: PeriodStats, metric: string): number {
    const currentValue = current[metric === 'score' ? 'avgScore' : 
                                 metric === 'duration' ? 'totalDuration' : 'totalActivities'];
    const previousValue = previous[metric === 'score' ? 'avgScore' : 
                                  metric === 'duration' ? 'totalDuration' : 'totalActivities'];
    
    if (!previousValue || previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  private static groupByActivityType(events: EventData[]) {
    return events.reduce((acc, event) => {
      acc[event.activityType] = (acc[event.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private static aggregateSkillDeltas(events: EventData[]) {
    const skillTotals: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.skillDeltas) {
        const deltas = typeof event.skillDeltas === 'string' 
          ? JSON.parse(event.skillDeltas) 
          : event.skillDeltas;
          
        Object.entries(deltas).forEach(([skill, delta]) => {
          skillTotals[skill] = (skillTotals[skill] || 0) + (delta as number);
        });
      }
    });
    
    return skillTotals;
  }

  private static calculateTrendSlope(grouped: GroupedEvents[]): TrendData {
    if (grouped.length < 2) return { slope: 0, direction: 'stable' };
    
    const scores = grouped.map(g => g.events.map((e: EventData) => e.score).filter(Boolean)).flat() as number[];
    if (scores.length < 2) return { slope: 0, direction: 'stable' };
    
    // Simple linear regression for trend
    const n = scores.length;
    const sumX = scores.reduce((sum, _, i) => sum + i, 0);
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + (i * score), 0);
    const sumX2 = scores.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return {
      slope,
      direction: slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable'
    } as TrendData;
  }

  private static generateTrendInsights(grouped: GroupedEvents[]) {
    const insights = [];
    
    if (grouped.length >= 2) {
      const recent = grouped.slice(-3);
      const avgRecentScore = this.calculateAverage(
        recent.map(g => this.calculateAverage(g.events.map(e => e.score).filter(Boolean) as number[])).filter(Boolean) as number[]
      );
      
      if (avgRecentScore > 80) {
        insights.push({ type: 'high_performance', message: 'Excellent recent performance!' });
      } else if (avgRecentScore < 60) {
        insights.push({ type: 'improvement_needed', message: 'Consider focusing on weak areas' });
      }
    }
    
    return insights;
  }

  private static generateComparisonInsights(current: PeriodStats, previous: PeriodStats) {
    const insights = [];
    
    if (current.avgScore > previous.avgScore + 5) {
      insights.push({ 
        type: 'score_improvement', 
        message: `Score improved by ${(current.avgScore - previous.avgScore).toFixed(1)} points` 
      });
    }
    
    if (current.totalActivities > previous.totalActivities * 1.5) {
      insights.push({ 
        type: 'increased_engagement', 
        message: 'Activity level has increased significantly' 
      });
    }
    
    return insights;
  }

  private static processSkillTimeline(snapshots: SkillSnapshot[]) {
    const bySkill = snapshots.reduce((acc, snapshot) => {
      if (!acc[snapshot.skillName]) {
        acc[snapshot.skillName] = [];
      }
      acc[snapshot.skillName].push({
        score: snapshot.score,
        date: snapshot.createdAt,
        source: snapshot.source,
        referenceId: snapshot.referenceId
      });
      return acc;
    }, {} as Record<string, SkillTimelineEntry[]>);

    return Object.entries(bySkill).map(([skillName, timeline]) => ({
      skillName,
      timeline,
      currentScore: timeline[timeline.length - 1]?.score || 0,
      improvement: this.calculateSkillImprovement(timeline),
      trend: this.calculateSkillTrend(timeline)
    }));
  }

  private static calculateSkillImprovement(timeline: SkillTimelineEntry[]) {
    if (timeline.length < 2) return 0;
    
    const first = timeline[0].score;
    const last = timeline[timeline.length - 1].score;
    
    return ((last - first) / first) * 100;
  }

  private static calculateSkillTrend(timeline: SkillTimelineEntry[]) {
    if (timeline.length < 3) return 'insufficient_data';
    
    const recent = timeline.slice(-5).map(t => t.score);
    
    // Simple trend calculation for skills
    if (recent.length < 2) return 'insufficient_data';
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    return change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable';
  }

  private static generateSmartRecommendations(
    weekly: { overallTrend: TrendData }, 
    monthly: { overallTrend: TrendData }, 
    skills: { skillName: string; currentScore: number; trend: string }[]
  ) {
    const recommendations = [];
    
    // Performance-based recommendations
    if (weekly.overallTrend.direction === 'declining') {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Focus on reviewing fundamentals and recent mistakes',
        actions: ['Review incorrect answers', 'Practice easier questions', 'Take study breaks']
      });
    }
    
    // Skill-based recommendations
    const weakestSkill = skills.length > 0 ? skills.reduce((worst, skill) => 
      (skill.currentScore < worst.currentScore) ? skill : worst
    ) : null;
    
    if (weakestSkill && weakestSkill.currentScore < 70) {
      recommendations.push({
        type: 'skill_focus',
        priority: 'medium',
        message: `Improve your ${weakestSkill.skillName} skills`,
        actions: [`Practice ${weakestSkill.skillName} exercises`, 'Study related concepts', 'Seek additional resources']
      });
    }
    
    return recommendations;
  }

  private static async countRecentPerfectScores(userId: string, days: number): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const count = await prisma.userActivityEvent.count({
      where: {
        userId,
        timestamp: { gte: since },
        score: { gte: 90 } // Consider 90+ as perfect
      }
    });
    
    return count;
  }

  private static calculateScoreDistribution(scores: number[]) {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    scores.forEach(score => {
      if (score >= 85) distribution.excellent++;
      else if (score >= 70) distribution.good++;
      else if (score >= 50) distribution.fair++;
      else distribution.poor++;
    });
    
    return distribution;
  }
}

export default TrackingEventService;


