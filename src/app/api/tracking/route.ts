import { NextResponse } from 'next/server';
// Refactored to read from event-based tracking models
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface ProgressData {
  activities?: Array<{ timestamp: string }>;
  recentActivities?: Array<{ timestamp: string }>;
  skillProgress?: Array<{
    name: string;
    level: string;
    score: number;
    progress: Array<{
      date: Date;
      score: number;
    }>;
  }>;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tìm user trong Prisma database bằng clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      // Initialize a new user if needed
      return NextResponse.json({
        stats: {
          totalInterviews: 0,
          averageScore: 0,
          studyStreak: 0,
          totalStudyTime: 0
        },
        skillProgress: [],
        currentFocus: ['Complete your profile', 'Start your first interview practice'],
        nextMilestones: [
          {
            goal: 'Complete first interview practice',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ],
        recommendations: [
          'Complete your profile to get personalized recommendations',
          'Try a practice interview to assess your current level',
          'Set your learning goals in the dashboard'
        ]
      });
    }

    // Build progress from new event-based storage
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch aggregates and recent events in parallel
    const [dailyStats, recentEvents, skillSnapshots, last60Events] = await Promise.all([
      prisma.userDailyStats.findMany({
        where: { userId: user.id, date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
      }),
      prisma.userActivityEvent.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 20,
      }),
      prisma.userSkillSnapshot.findMany({
        where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.userActivityEvent.findMany({
        where: { userId: user.id, timestamp: { gte: sixtyDaysAgo } },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    // Compute stats
    const totalActivities = dailyStats.reduce((s, d) => s + (d.totalActivities || 0), 0);
    const totalStudyTime = dailyStats.reduce((s, d) => s + (d.totalDuration || 0), 0);
    const scoredDays = dailyStats.filter(d => typeof d.avgScore === 'number');
    const averageScore = scoredDays.length > 0
      ? scoredDays.reduce((s, d) => s + (d.avgScore || 0), 0) / scoredDays.length
      : 0;

    // Simple study streak: count consecutive recent days with activity
    let studyStreak = 0;
    const datesSet = new Set(dailyStats.filter(d => (d.totalActivities || 0) > 0).map(d => d.date.toISOString().slice(0,10)));
    for (let i = 0; i < 60; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0,10);
      if (datesSet.has(key)) studyStreak++; else break;
    }

    // Skill trends: group snapshots by skill with source breakdown
    const skillTrendsMap: Record<string, Array<{ createdAt: Date; score: number; source: string }>> = {};
    for (const s of skillSnapshots) {
      const name = s.skillName;
      if (!skillTrendsMap[name]) skillTrendsMap[name] = [];
      skillTrendsMap[name].push({ 
        createdAt: s.createdAt, 
        score: s.score, 
        source: s.source || 'unknown'
      });
    }
    const skillTrends = Object.entries(skillTrendsMap).map(([skill, history]) => ({ skill, history }));

    // Helper function to determine skill level based on score
    // Thresholds adjusted for 10-point scale per test
    const getSkillLevel = (score: number): string => {
      if (score >= 8.5) return 'expert';     // 85%+ mastery
      if (score >= 7.0) return 'advanced';   // 70%+ proficient
      if (score >= 5.5) return 'intermediate'; // 55%+ developing
      return 'beginner';                      // <55% learning
    };

    // Transform skillTrends into simplified skillProgress format with average scoring
    const skillProgress = skillTrends.map(({ skill, history }) => {
      // Sort history by date to ensure proper chronological order
      const sortedHistory = history.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      // Calculate average score from all sessions
      const totalScore = sortedHistory.reduce((sum, h) => sum + h.score, 0);
      const averageScore = sortedHistory.length > 0 ? totalScore / sortedHistory.length : 0;
      
      // Get latest and previous for trend calculation
      const latest = sortedHistory[sortedHistory.length - 1];
      const previous = sortedHistory[sortedHistory.length - 2];
      
      const level = getSkillLevel(averageScore);
      
      // Calculate trend based on latest vs previous
      const trend = previous ? latest.score - previous.score : null;
      
      // Determine source display name from latest session
      const sourceDisplay = latest.source === 'ASSESSMENT' || latest.source === 'assessment' ? 'Assessment' : 
                           latest.source === 'AVATAR_INTERVIEW' || latest.source === 'interview' ? 'Interview' : 
                           latest.source || 'Unknown';

      return {
        name: skill,
        level,
        score: Math.round(averageScore * 10) / 10, // Average score instead of latest
        trend: trend ? Math.round(trend * 10) / 10 : null,
        source: sourceDisplay,
        lastUpdated: latest.createdAt,
        totalSessions: sortedHistory.length,
        progress: sortedHistory.map(h => ({
          date: h.createdAt,
          score: Math.round(h.score * 10) / 10,
          source: h.source === 'ASSESSMENT' || h.source === 'assessment' ? 'Assessment' : 
                  h.source === 'AVATAR_INTERVIEW' || h.source === 'interview' ? 'Interview' : 
                  h.source || 'Unknown'
        }))
      };
    });

    // Normalization helpers and improvement metrics
    const normalizeScore = (v: unknown): number | null => {
      if (typeof v !== 'number' || isNaN(v)) return null;
      if (v <= 10) return Math.max(0, Math.min(100, v * 10));
      if (v <= 100) return Math.max(0, Math.min(100, v));
      return Math.max(0, Math.min(100, v));
    };

    type DimKey = 'Technical Knowledge' | 'Problem Solving' | 'Communication' | 'Presentation' | 'DOMAIN';
    const dims: DimKey[] = ['Technical Knowledge', 'Problem Solving', 'Communication', 'Presentation', 'DOMAIN'];

    type EventRow = {
      feature?: string | null;
      activityType?: string | null;
      score?: number | null;
      duration?: number | null;
      referenceId?: string | null;
      timestamp: Date;
      metadata?: unknown;
    };
    const mapEventToDims = (e: EventRow): Partial<Record<DimKey, number>> => {
      const feature = e.feature || '';
      const score = normalizeScore(e.score);
      const md = (e.metadata || {}) as Record<string, unknown>;
      const out: Partial<Record<DimKey, number>> = {};

      if (feature === 'secure_quiz') {
        if (score != null) {
          out['Technical Knowledge'] = score; out['Problem Solving'] = score; out.DOMAIN = score;
        }
        return out;
      }
      if (feature === 'assessment_test') {
        const fs = (md.finalScores || {}) as Record<string, unknown>;
        const fund = normalizeScore(fs.fundamental ?? fs.fundamentalKnowledge);
        const prob = normalizeScore(fs.logic ?? fs.logicalReasoning);
        const comm = normalizeScore(fs.language ?? fs.languageFluency ?? fs.communication);
        if (fund != null) out['Technical Knowledge'] = fund;
        if (prob != null) out['Problem Solving'] = prob;
        if (comm != null) out['Communication'] = comm;
        if (score != null && Object.keys(out).length === 0) out.DOMAIN = score;
        return out;
      }
      if (feature === 'avatar_interview') {
        const eb = (md.evaluationBreakdown || {}) as Record<string, unknown>;
        const tech = normalizeScore(eb.technicalScore ?? eb.technical);
        const comm = normalizeScore(eb.communicationScore ?? eb.communication);
        const ps = normalizeScore(eb.problemSolvingScore ?? eb.problemSolving);
        const del = normalizeScore(eb.deliveryScore ?? eb.delivery);
        if (tech != null) out['Technical Knowledge'] = tech; // Technical fundamentals
        if (ps != null) out['Problem Solving'] = ps;     // Problem solving
        if (comm != null) out['Communication'] = comm; // Communication
        if (del != null) out['Presentation'] = del; // Delivery/presentation skills
        if (score != null && Object.keys(out).length === 0) out.DOMAIN = score;
        return out;
      }
      if (feature === 'jd_qa') {
        // JD overall or detailed
        const ds = (md.detailedScores || {}) as Record<string, unknown>;
        const comm = normalizeScore(ds.Communication ?? ds.communication ?? ds.Writing ?? ds.writing);
        if (comm != null) out['Communication'] = comm;
        if (score != null) out.DOMAIN = score;
        return out;
      }
      if (score != null) out.DOMAIN = score;
      return out;
    };

    // Build windowed aggregates
    const inCurrentWindow = (d: Date) => d >= thirtyDaysAgo && d <= now;
    const inPreviousWindow = (d: Date) => d >= sixtyDaysAgo && d < thirtyDaysAgo;

    const currentEvents = last60Events.filter(e => inCurrentWindow(new Date(e.timestamp)));
    const previousEvents = last60Events.filter(e => inPreviousWindow(new Date(e.timestamp)));

    const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const safePush = (obj: Record<string, number[]>, key: string, v: number | null) => { if (v != null) { (obj[key] ||= []).push(v); } };

    const calcOverallFromEvents = (events: EventRow[]) => {
      const values: number[] = [];
      for (const e of events) {
        const s = normalizeScore(e.score);
        if (s != null) values.push(s);
      }
      return avg(values);
    };

    const overallCurrent = calcOverallFromEvents(currentEvents);
    const overallPrevious = calcOverallFromEvents(previousEvents);
    const improvementDelta = Number((overallCurrent - overallPrevious).toFixed(2));

    // Dimension currents
    const dimValsCurrent: Record<DimKey, number[]> = { 
      'Technical Knowledge': [], 
      'Problem Solving': [], 
      'Communication': [], 
      'Presentation': [],
      DOMAIN: [] 
    };
    for (const e of currentEvents) {
      const m = mapEventToDims(e);
      for (const d of dims) safePush(dimValsCurrent, d, m[d] ?? null);
    }
    const dimensionsCurrent = Object.fromEntries(dims.map(d => [d, Number(avg(dimValsCurrent[d]).toFixed(2))]));

    // Mode breakdown (by feature)
    const featuresCurrent: Record<string, number[]> = {};
    for (const e of currentEvents) {
      const sc = normalizeScore(e.score);
      if (sc != null) safePush(featuresCurrent, e.feature || e.activityType || 'other', sc);
    }
    const modeBreakdown = Object.fromEntries(Object.entries(featuresCurrent).map(([k, arr]) => [k, Number(avg(arr).toFixed(2))]));

    // Trend (daily overall)
    const trendMap: Record<string, number[]> = {};
    for (const e of currentEvents) {
      const key = new Date(e.timestamp).toISOString().slice(0,10);
      const sc = normalizeScore(e.score);
      if (sc != null) safePush(trendMap, key, sc);
    }
    const trend = Object.entries(trendMap).sort((a,b) => a[0].localeCompare(b[0])).map(([date, arr]) => ({ date, overall: Number(avg(arr).toFixed(2)) }));

    // Dimension trends (daily)
    const dimTrendMap: Record<DimKey, Record<string, number[]>> = { 
      'Technical Knowledge': {}, 
      'Problem Solving': {}, 
      'Communication': {}, 
      'Presentation': {},
      DOMAIN: {} 
    };
    for (const e of currentEvents) {
      const key = new Date(e.timestamp).toISOString().slice(0,10);
      const dimsVal = mapEventToDims(e);
      for (const d of dims) {
        const v = dimsVal[d] ?? null;
        if (v != null) safePush(dimTrendMap[d], key, v);
      }
    }
    const dimensionTrends = Object.fromEntries(dims.map(d => [d, Object.entries(dimTrendMap[d]).sort((a,b) => a[0].localeCompare(b[0])).map(([date, arr]) => ({ date, value: Number(avg(arr).toFixed(2)) }))]));

    const response: ProgressData & {
      stats: { totalActivities: number; averageScore: number; studyStreak: number; totalStudyTime: number };
      recentActivities: Array<{ timestamp: string; activityType: string; type?: string; feature?: string; score?: number | null; duration?: number | null; referenceId?: string | null }>;
      allActivities: Array<{ timestamp: string; type: string; score?: number | null }>;
      skillTrends: Array<{ skill: string; history: Array<{ createdAt: Date; score: number }> }>;
      normalized: {
        overallCurrent: number;
        overallPrevious: number;
        improvementDelta: number;
        trend: Array<{ date: string; overall: number }>;
        dimensions: Record<DimKey, number>;
        dimensionTrends: Record<DimKey, Array<{ date: string; value: number }>>;
        modeBreakdown: Record<string, number>;
      };
    } = {
      stats: {
        totalActivities,
        averageScore: Number(averageScore.toFixed(2)),
        studyStreak,
        totalStudyTime,
      },
      recentActivities: recentEvents.map(e => ({
        timestamp: e.timestamp.toISOString(),
        activityType: e.activityType,
        type: (e.activityType as string) === 'assessment' ? 'assessment' : e.activityType,
        feature: e.feature || undefined,
        score: e.score,
        duration: e.duration,
        referenceId: e.referenceId,
      })),
      allActivities: last60Events.map(e => ({
        timestamp: e.timestamp.toISOString(),
        type: (e.activityType as string) === 'assessment' ? 'assessment' : e.activityType || 'other',
        score: e.score,
      })),
      skillProgress,
      skillTrends,
      normalized: {
        overallCurrent: Number(overallCurrent.toFixed(2)),
        overallPrevious: Number(overallPrevious.toFixed(2)),
        improvementDelta,
        trend,
        dimensions: dimensionsCurrent as Record<DimKey, number>,
        dimensionTrends: dimensionTrends as Record<DimKey, Array<{ date: string; value: number }>>,
        modeBreakdown,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching progress:', error);
    // Return a more detailed error message in development
    const message = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'Failed to fetch progress';
      
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
