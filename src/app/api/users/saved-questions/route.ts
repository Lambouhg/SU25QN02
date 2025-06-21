import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import User from '@/models/user';
import Question from '@/models/question';
import { connectDB } from '@/lib/mongodb';

// Helper: Kết nối DB và xác thực user
async function getUserFromRequest() {
  await connectDB();
  const { userId } = await auth();
  if (!userId) return { error: 'Unauthorized', status: 401 };
  const user = await User.findOne({ clerkId: userId });
  if (!user) return { error: 'User not found', status: 404 };
  return { user };
}

// GET: Lấy danh sách câu hỏi đã lưu (đã populate)
export async function GET() {
  try {
    const result = await getUserFromRequest();
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const user = await User.findById(result.user._id).populate('savedQuestions');
    return NextResponse.json(user.savedQuestions, { status: 200 });
  } catch (error) {
    console.error('Error fetching saved questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Lưu câu hỏi (nếu chưa có)
export async function POST(req: Request) {
  try {
    const result = await getUserFromRequest();
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const { questionId } = await req.json();
    if (!result.user.savedQuestions.includes(questionId)) {
      result.user.savedQuestions.push(questionId);
      await result.user.save();
    }
    return NextResponse.json({ message: 'Question saved successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error saving question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Toggle lưu/bỏ lưu câu hỏi
export async function PATCH(req: Request) {
  try {
    const result = await getUserFromRequest();
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const { questionId } = await req.json();
    const questionIdStr = questionId.toString();
    let message = '';
    if (result.user.savedQuestions.includes(questionIdStr)) {
      await User.findByIdAndUpdate(
        result.user._id,
        { $pull: { savedQuestions: questionIdStr } },
        { new: true }
      );
      message = 'Question unsaved successfully';
    } else {
      await User.findByIdAndUpdate(
        result.user._id,
        { $addToSet: { savedQuestions: questionIdStr } },
        { new: true }
      );
      message = 'Question saved successfully';
    }
    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error('Error toggling saved question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 