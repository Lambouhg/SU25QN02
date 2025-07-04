// api/question-sets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from "@/lib/mongodb";
import QuestionSet from '@/models/questionSet';

// GET - Lấy tất cả question sets của user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const questionSets = await QuestionSet.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20) // Giới hạn 20 bộ câu hỏi gần nhất
      .select('-originalJDText'); // Không trả về full text để giảm size

    return NextResponse.json({ 
      success: true, 
      questionSets 
    });

  } catch (error) {
    console.error('Error fetching question sets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo mới question set
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      jobTitle, 
      questionType, 
      level, 
      questions, 
      originalJDText, 
      fileName 
    } = body;

    // Validation
    if (!jobTitle || !questionType || !level || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const questionSet = new QuestionSet({
      userId,
      jobTitle: jobTitle.trim(),
      questionType,
      level,
      questions,
      originalJDText,
      fileName
    });

    await questionSet.save();

    return NextResponse.json({ 
      success: true, 
      questionSet: {
        _id: questionSet._id,
        jobTitle: questionSet.jobTitle,
        questionType: questionSet.questionType,
        level: questionSet.level,
        questions: questionSet.questions,
        fileName: questionSet.fileName,
        createdAt: questionSet.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating question set:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
