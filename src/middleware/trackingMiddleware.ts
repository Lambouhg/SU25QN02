import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserActivityService } from '../services/userActivityService';
import User from '@/models/user';

/**
 * Middleware để tự động tracking hoạt động người dùng
 * Middleware này sẽ:
 * 1. Tự động track các API calls
 * 2. Cập nhật streak học tập
 * 3. Thu thập dữ liệu về hoạt động người dùng
 */
export async function trackingMiddleware(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.next();

    // Lấy MongoDB user ID từ Clerk ID
    const user = await User.findOne({ clerkId });
    if (!user) return NextResponse.next();

    // Lấy path để xác định loại hoạt động
    const path = new URL(req.url).pathname;
    
    // Tracking dựa vào route và method
    const mongoUserId = user._id.toString();

    // 1. Track Interview Activities
    if (path.includes('/api/interviews')) {
      const interviewId = path.split('/').pop();
      if (interviewId) {
        if (req.method === 'POST') {
          // Bắt đầu phỏng vấn mới
          await UserActivityService.trackInterviewActivity(mongoUserId, interviewId);
        }
      }
    }

    // 2. Track Quiz Activities
    if (path.includes('/api/quizzes') && req.method === 'POST') {
      const body = await req.json();
      await UserActivityService.addActivity(mongoUserId, {
        type: 'quiz',
        score: body.score,
        duration: body.timeSpent,
        timestamp: new Date()
      });
    }

    // 3. Track Practice Sessions
    if (path.includes('/api/practice') && req.method === 'POST') {
      const body = await req.json();
      await UserActivityService.trackPracticeSession(
        mongoUserId,
        body.topic,
        body.duration,
        body.score
      );
    }

    // 4. Track Learning Materials Access
    if (path.includes('/api/learn') && req.method === 'GET') {
      await UserActivityService.addActivity(mongoUserId, {
        type: 'learning',
        duration: 0, // Sẽ được cập nhật khi người dùng rời trang
        timestamp: new Date()
      });
    }

    // 5. Track Goal Progress
    if (path.includes('/api/goals')) {
      const goalId = path.split('/').pop();
      if (goalId && req.method === 'PATCH') {
        const body = await req.json();
        await UserActivityService.trackGoalProgress(
          mongoUserId,
          goalId,
          body.status
        );
      }
    }

    // Luôn cập nhật streak học tập cho mọi hoạt động
    await UserActivityService.updateLearningStats(mongoUserId);

    return NextResponse.next();
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.next();
  }
}
