import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { batchCheckQuestionDuplicates } from '@/services/questionDuplicateService';

interface CheckDuplicateRequest {
  questions: Array<{
    stem: string;
    category?: string;
    fields?: string[];
  }>;
  similarityThreshold?: number;
}

interface CheckDuplicateResponse {
  results: Array<{
    questionIndex: number;
    isDuplicate: boolean;
    similarQuestions: Array<{
      questionId: string;
      similarity: number;
      reason: string;
      stem: string;
    }>;
    confidence: number;
    recommendation: 'save' | 'review' | 'reject';
  }>;
  summary: {
    total: number;
    duplicates: number;
    warnings: number;
    safe: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - you can remove this if you want public access)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CheckDuplicateRequest = await request.json();
    
    if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ 
        error: 'Questions array is required and must not be empty' 
      }, { status: 400 });
    }

    if (body.questions.length > 20) {
      return NextResponse.json({ 
        error: 'Maximum 20 questions allowed per check' 
      }, { status: 400 });
    }

    // Validate each question
    for (let i = 0; i < body.questions.length; i++) {
      const question = body.questions[i];
      if (!question.stem || typeof question.stem !== 'string' || !question.stem.trim()) {
        return NextResponse.json({ 
          error: `Question ${i + 1}: stem is required and must be non-empty` 
        }, { status: 400 });
      }
    }

    const similarityThreshold = body.similarityThreshold || 0.8;
    
    // Validate similarity threshold
    if (similarityThreshold < 0.5 || similarityThreshold > 1.0) {
      return NextResponse.json({ 
        error: 'Similarity threshold must be between 0.5 and 1.0' 
      }, { status: 400 });
    }

    console.log(`Starting duplicate check for ${body.questions.length} questions with threshold ${similarityThreshold}...`);

    // Perform duplicate check
    const duplicateResults = await batchCheckQuestionDuplicates(
      body.questions,
      similarityThreshold
    );

    // Calculate summary
    const summary = {
      total: body.questions.length,
      duplicates: duplicateResults.filter(r => r.recommendation === 'reject').length,
      warnings: duplicateResults.filter(r => r.recommendation === 'review').length,
      safe: duplicateResults.filter(r => r.recommendation === 'save').length
    };

    const response: CheckDuplicateResponse = {
      results: duplicateResults,
      summary
    };

    console.log(`Duplicate check completed: ${summary.duplicates} duplicates, ${summary.warnings} warnings, ${summary.safe} safe`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Duplicate check error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check duplicates',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}

// GET endpoint to get current database stats
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get basic stats about existing questions
    const { default: prisma } = await import('@/lib/prisma');
    
    const stats = await prisma.questionItem.groupBy({
      by: ['category'],
      where: {
        isArchived: false
      },
      _count: {
        id: true
      }
    });

    const totalQuestions = await prisma.questionItem.count({
      where: {
        isArchived: false
      }
    });

    return NextResponse.json({
      totalQuestions,
      categoryCounts: stats.map(s => ({
        category: s.category || 'Uncategorized',
        count: s._count.id
      }))
    });

  } catch (error) {
    console.error('Error getting database stats:', error);
    return NextResponse.json({
      error: 'Failed to get database stats'
    }, { status: 500 });
  }
}