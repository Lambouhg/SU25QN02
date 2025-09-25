import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { TrackingEventService } from '@/services/trackingEventService';
import { prisma } from '@/lib/prisma';
import { ActivityType } from '@prisma/client';

// Enhanced analytics with more detailed data
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'insights';
    const timeRange = searchParams.get('timeRange') || '30d';
    const skillName = searchParams.get('skillName');

    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '90d') days = 90;

    // Find user in database by clerkId
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    switch (action) {
      case 'insights': {
        const insights = await TrackingEventService.generateProgressInsights(dbUser.id);
        
        // Add enhanced skill analysis
        const skillsData = await prisma.userSkillSnapshot.findMany({
          where: { 
            userId: dbUser.id,
            createdAt: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Process skills with timeline
        const skillsMap = new Map();
        skillsData.forEach(snapshot => {
          const skillName = snapshot.skillName;
          const score = snapshot.score;
          
          if (!skillsMap.has(skillName)) {
            skillsMap.set(skillName, []);
          }
          skillsMap.get(skillName).push({
            score,
            date: snapshot.createdAt.toISOString().split('T')[0]
          });
        });

        const enhancedSkills = Array.from(skillsMap.entries()).map(([skillName, timeline]) => {
          const scores = timeline.map((t: { score: number }) => t.score);
          const latest = scores[0] || 0;
          const previous = scores[scores.length - 1] || 0;
          const improvement = scores.length > 1 ? ((latest - previous) / previous) * 100 : 0;
          
          return {
            skillName,
            currentScore: latest,
            improvement,
            trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
            timeline: timeline.slice(0, 10) // Last 10 data points
          };
        });

        return NextResponse.json({
          ...insights,
          skills: enhancedSkills
        });
      }

      case 'trends': {
        const trends = await TrackingEventService.getProgressTrends(dbUser.id, { 
          timeRange: timeRange as '7d' | '30d' | '90d' 
        });
        
        // Enhanced timeline with activity breakdown
        const activities = await prisma.userActivityEvent.findMany({
          where: {
            userId: dbUser.id,
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { timestamp: 'desc' }
        });

        console.log('🔍 Enhanced Analytics Debug:', {
          userId: dbUser.id,
          timeRange,
          days,
          activitiesFound: activities.length,
          dateRange: {
            from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          },
          sampleActivities: activities.slice(0, 3).map(a => ({
            timestamp: a.timestamp.toISOString(),
            activityType: a.activityType,
            score: a.score
          }))
        });

        // Group by periods - but ensure we show actual data points only
        // @ts-ignore - Disable strict typing for this section temporarily
        const timeline = [];
        
        // Create a map of actual activity dates
        // @ts-ignore
        const activityDateMap = new Map();
        activities.forEach(activity => {
          const dateKey = activity.timestamp.toISOString().split('T')[0];
          if (!activityDateMap.has(dateKey)) {
            activityDateMap.set(dateKey, []);
          }
          activityDateMap.get(dateKey).push(activity);
        });

        // Generate timeline based on actual data dates only
        const sortedDates = Array.from(activityDateMap.keys()).sort();
        
        sortedDates.forEach(dateKey => {
          const dayActivities = activityDateMap.get(dateKey);
          
          // @ts-ignore
          const activityBreakdown = dayActivities.reduce((acc, activity) => {
            const type = activity.activityType;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          // @ts-ignore
          const scores = dayActivities
            .filter(a => a.score !== null && !isNaN(a.score))
            .map(a => a.score as number);

          timeline.push({
            period: dateKey,
            // @ts-ignore
            avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 : 0,
            totalActivities: dayActivities.length,
            // @ts-ignore
            totalDuration: dayActivities.reduce((sum, a) => {
              return sum + (a.duration || 0);
            }, 0),
            activityBreakdown,
            rawScores: scores // For debugging
          });
        });

        console.log('📊 Timeline Generated:', {
          timelineLength: timeline.length,
          samplePeriods: timeline.slice(-3).map(t => ({
            period: t.period,
            avgScore: t.avgScore,
            totalActivities: t.totalActivities
          }))
        });

        return NextResponse.json({
          timeRange,
          totalEvents: activities.length,
          timeline: timeline.reverse(),
          overallTrend: trends
        });
      }

      case 'comparison': {
        const currentEnd = new Date();
        const currentStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const previousEnd = currentStart;
        const previousStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);
        
        const comparison = await TrackingEventService.comparePerformancePeriods(dbUser.id, {
          currentPeriod: { start: currentStart, end: currentEnd },
          previousPeriod: { start: previousStart, end: previousEnd }
        });
        return NextResponse.json(comparison);
      }

      case 'skills': {
        if (!skillName) {
          return NextResponse.json({ error: 'skillName parameter required' }, { status: 400 });
        }
        
        const skillTimeline = await TrackingEventService.getSkillProgressionTimeline(
          dbUser.id, 
          skillName
        );
        return NextResponse.json(skillTimeline);
      }

      case 'streak': {
        const streak = await TrackingEventService.getCurrentStreak(dbUser.id);
        return NextResponse.json({ currentStreak: streak });
      }

      case 'achievements': {
        const achievements = await TrackingEventService.checkRecentAchievements(dbUser.id);
        return NextResponse.json(achievements);
      }

      case 'alerts': {
        // Get weekly trends first for alerts
        const weeklyTrends = await TrackingEventService.getProgressTrends(dbUser.id, { 
          timeRange: '7d' 
        });
        const alerts = await TrackingEventService.checkProgressAlerts(dbUser.id, weeklyTrends);
        return NextResponse.json(alerts);
      }

      case 'dashboard_summary': {
        // Comprehensive dashboard data in one request
        const currentEnd = new Date();
        const currentStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const previousEnd = currentStart;
        const previousStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);
        
        const weeklyTrends = await TrackingEventService.getProgressTrends(dbUser.id, { 
          timeRange: '7d' 
        });
        
        const [insights, trends, comparison, streak, achievements, alerts] = await Promise.all([
          TrackingEventService.generateProgressInsights(dbUser.id),
          TrackingEventService.getProgressTrends(dbUser.id, { 
            timeRange: timeRange as '7d' | '30d' | '90d' 
          }),
          TrackingEventService.comparePerformancePeriods(dbUser.id, {
            currentPeriod: { start: currentStart, end: currentEnd },
            previousPeriod: { start: previousStart, end: previousEnd }
          }),
          TrackingEventService.getCurrentStreak(dbUser.id),
          TrackingEventService.checkRecentAchievements(dbUser.id),
          TrackingEventService.checkProgressAlerts(dbUser.id, weeklyTrends)
        ]);

        return NextResponse.json({
          insights,
          trends,
          comparison,
          streak,
          achievements,
          alerts,
          timeRange,
          generatedAt: new Date().toISOString()
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Enhanced Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Enhanced sample data creation
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in database by clerkId
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const body = await request.json();
    const { action, count = 50 } = body;

    if (action === 'create_enhanced_sample_data') {
      // Create comprehensive sample data
      const eventTypes: ActivityType[] = [ActivityType.quiz, ActivityType.interview, ActivityType.assessment, ActivityType.practice];
      const skills = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'Communication', 'Problem Solving'];
      const activities: Array<{
        userId: string;
        activityType: ActivityType;
        action: string;
        score: number;
        duration: number;
        timestamp: Date;
        metadata?: object;
      }> = [];
      const skillSnapshots: Array<{
        userId: string;
        skillName: string;
        score: number;
        createdAt: Date;
      }> = [];
      const dailyStats: Array<{
        userId: string;
        date: string;
        totalActivities: number;
        totalDuration: number;
        avgScore: number;
        activityTypeBreakdown: Record<string, number>;
        createdAt: Date;
        updatedAt: Date;
      }> = [];

      // Generate events over the last 90 days
      for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        const activityType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const baseScore = 60 + Math.random() * 40; // 60-100 range
        const progressFactor = (90 - daysAgo) / 90; // Slight improvement over time
        const score = Math.min(100, baseScore + progressFactor * 20 + (Math.random() - 0.5) * 10);
        
        activities.push({
          userId: dbUser.id,
          activityType,
          action: 'completed',
          score: Math.round(score * 10) / 10,
          duration: Math.floor(300 + Math.random() * 1200), // 5-25 minutes
          timestamp: date,
          metadata: {
            difficulty: ['easy', 'medium', 'medium'][Math.floor(Math.random() * 3)],
            category: skills[Math.floor(Math.random() * skills.length)]
          }
        });
      }

      // Create skill snapshots (individual snapshots for each skill each week)
      for (let week = 0; week < 12; week++) {
        const date = new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000);
        const weekProgress = (12 - week) / 12;
        
        skills.forEach(skill => {
          const score = Math.round((50 + weekProgress * 40 + Math.random() * 15) * 10) / 10;
          
          skillSnapshots.push({
            userId: dbUser.id,
            skillName: skill,
            score: score,
            createdAt: date
          });
        });
      }

      // Create daily stats
      for (let day = 0; day < 90; day++) {
        const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
        const hasActivity = Math.random() > 0.3; // 70% chance of activity
        
        if (hasActivity) {
          dailyStats.push({
            userId: dbUser.id,
            date: date.toISOString().split('T')[0],
            totalActivities: Math.floor(Math.random() * 8) + 1,
            totalDuration: Math.floor(Math.random() * 3600) + 600, // 10-70 minutes
            avgScore: Math.round((60 + Math.random() * 35) * 10) / 10,
            activityTypeBreakdown: {
              quiz: Math.floor(Math.random() * 3),
              interview: Math.floor(Math.random() * 2),
              assessment: Math.floor(Math.random() * 2),
              practice: Math.floor(Math.random() * 2)
            },
            createdAt: date,
            updatedAt: date
          });
        }
      }

      // Insert all data
      await Promise.all([
        prisma.userActivityEvent.createMany({ data: activities }),
        prisma.userSkillSnapshot.createMany({ data: skillSnapshots }),
        prisma.userDailyStats.createMany({ data: dailyStats })
      ]);

      return NextResponse.json({
        success: true,
        created: {
          activities: activities.length,
          skillSnapshots: skillSnapshots.length,
          dailyStats: dailyStats.length
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Enhanced Sample Data Creation Error:', error);
    return NextResponse.json(
      { error: 'Failed to create sample data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}