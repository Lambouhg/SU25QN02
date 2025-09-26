import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get saved questions for the user using the many-to-many relationship
    const userWithSavedQuestions = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        savedQuestionItems: {
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!userWithSavedQuestions) {
      return NextResponse.json([]);
    }

    // Transform data to match the expected format
    const transformedQuestions = userWithSavedQuestions.savedQuestionItems.map(question => ({
      id: question.id,
      question: question.stem,
      answers: question.options.map(option => ({
        content: option.text,
        isCorrect: option.isCorrect
      })),
      explanation: question.explanation,
      fields: question.fields,
      topics: question.topics,
      levels: question.level ? [question.level] : [],
      savedAt: question.updatedAt.toISOString(), // Use updatedAt as savedAt
      difficulty: question.difficulty
    }));

    return NextResponse.json(transformedQuestions);
  } catch (error) {
    console.error("Error fetching saved questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, questionIds } = body;

    // Support both single question and multiple questions
    const questionsToSave = questionIds || (questionId ? [questionId] : []);

    if (!questionsToSave || questionsToSave.length === 0) {
      return NextResponse.json({ error: "Question ID(s) are required" }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if all questions exist
    const existingQuestions = await prisma.questionItem.findMany({
      where: {
        id: { in: questionsToSave }
      },
      select: { id: true }
    });

    const existingQuestionIds = existingQuestions.map(q => q.id);
    const nonExistentQuestions = questionsToSave.filter((id: string) => !existingQuestionIds.includes(id));

    if (nonExistentQuestions.length > 0) {
      return NextResponse.json({ 
        error: `Questions not found: ${nonExistentQuestions.join(', ')}` 
      }, { status: 404 });
    }

    // Get already saved questions
    const alreadySaved = await prisma.user.findFirst({
      where: {
        id: user.id,
        savedQuestionItems: {
          some: {
            id: { in: questionsToSave }
          }
        }
      },
      include: {
        savedQuestionItems: {
          where: {
            id: { in: questionsToSave }
          },
          select: { id: true }
        }
      }
    });

    const alreadySavedIds = alreadySaved?.savedQuestionItems.map(q => q.id) || [];
    const newQuestionsToSave = questionsToSave.filter((id: string) => !alreadySavedIds.includes(id));

    if (newQuestionsToSave.length === 0) {
      return NextResponse.json({ 
        message: "All questions are already saved",
        saved: alreadySavedIds,
        skipped: alreadySavedIds
      }, { status: 200 });
    }

    // Save the new questions by connecting them to the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        savedQuestionItems: {
          connect: newQuestionsToSave.map((id: string) => ({ id }))
        }
      }
    });

    return NextResponse.json({ 
      message: "Questions saved successfully",
      saved: [...alreadySavedIds, ...newQuestionsToSave],
      newlySaved: newQuestionsToSave,
      skipped: alreadySavedIds
    }, { status: 201 });
  } catch (error) {
    console.error("Error saving questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove the saved question by disconnecting it from the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        savedQuestionItems: {
          disconnect: { id: questionId }
        }
      }
    });

    return NextResponse.json({ message: "Question removed from saved list" }, { status: 200 });
  } catch (error) {
    console.error("Error removing saved question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
