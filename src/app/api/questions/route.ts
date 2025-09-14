import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { question, answers, fields, topics, levels, explanation } = body;

    // Ensure fields, topics and levels are always arrays
    const validatedFields = Array.isArray(fields) ? fields : [];
    const validatedTopics = Array.isArray(topics) ? topics : [];
    const validatedLevels = Array.isArray(levels) ? levels : [];

    // Validate at least one correct answer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasCorrectAnswer = (answers as any[]).some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { error: 'At least one answer must be marked as correct' },
        { status: 400 }
      );
    }

    // Create question using QuestionItem model
    const newQuestion = await prisma.questionItem.create({
      data: {
        stem: question, // Map question to stem
        explanation,
        fields: validatedFields,
        topics: validatedTopics,
        level: validatedLevels[0] || null, // QuestionItem uses single level, take first one
        type: 'multiple_choice', // Default type
        difficulty: 'medium', // Default difficulty
        options: {
          create: answers.map((answer: { text: string; isCorrect: boolean }, index: number) => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
            order: index,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    // Map back to expected format
    const mappedResponse = {
      id: newQuestion.id,
      question: newQuestion.stem,
      explanation: newQuestion.explanation,
      fields: newQuestion.fields,
      topics: newQuestion.topics,
      levels: newQuestion.level ? [newQuestion.level] : [],
      answers: newQuestion.options?.map(option => ({
        text: option.text,
        isCorrect: option.isCorrect,
      })) || [],
      createdAt: newQuestion.createdAt,
      updatedAt: newQuestion.updatedAt,
    };

    return NextResponse.json(mappedResponse, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const field = searchParams.get('field');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const useUserPreferences = searchParams.get('useUserPreferences') === 'true';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    // Map to QuestionItem model fields
    if (field) where.fields = { has: field };
    
    // Topic filter with user preferences support
    if (useUserPreferences && userId && !topic) {
      // Load user preferences to get selected skills
      try {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { 
            interviewPreferences: true,
            preferredJobRole: {
              include: {
                category: true
              }
            }
          }
        });

        if (user?.interviewPreferences) {
          const prefs = user.interviewPreferences as { selectedSkills?: string[], customSkills?: string[] };
          const selectedSkills = prefs.selectedSkills || [];
          const customSkills = prefs.customSkills || [];
          const allUserSkills = [...selectedSkills, ...customSkills];
          
          if (allUserSkills.length > 0) {
            where.topics = { hasSome: allUserSkills };
            console.log(`[Questions API] Using user-selected skills for filtering:`, allUserSkills);
          } else if (user.preferredJobRole?.category?.skills) {
            // Fallback to category skills if no user-specific skills selected
            where.topics = { hasSome: user.preferredJobRole.category.skills };
            console.log(`[Questions API] Using category skills as fallback:`, user.preferredJobRole.category.skills);
          }
        }
      } catch (prefError) {
        console.warn('[Questions API] Could not load user preferences:', prefError);
        // Continue without user preference filtering
      }
    } else if (topic) {
      where.topics = { has: topic };
    }
    
    if (level) where.level = level; // QuestionItem uses 'level' (string) not 'levels' (array)
    if (search) {
      where.OR = [
        { stem: { contains: search, mode: 'insensitive' } }, // QuestionItem uses 'stem' not 'question'
        { explanation: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Use QuestionItem model instead of Question
    const total = await prisma.questionItem.count({ where });
    const questionItems = await prisma.questionItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { options: true }, // Include options for answers
    });

    // Map QuestionItem to expected Question format for compatibility
    const mappedQuestions = questionItems.map(item => ({
      id: item.id,
      question: item.stem, // Map stem to question
      explanation: item.explanation,
      fields: item.fields || [],
      topics: item.topics || [],
      levels: item.level ? [item.level] : [], // Convert level (string) to levels (array)
      difficulty: item.difficulty,
      answers: item.options?.map(option => ({
        text: option.text,
        isCorrect: option.isCorrect,
      })) || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({
      data: mappedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}