import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

interface QuestionOption {
  text: string;
}

interface QuestionSnapshot {
  questionId: string;
  stem: string;
  type: string;
  options?: QuestionOption[];
}

interface ResponseItem {
  questionId: string;
  answer: number | number[] | string | null;
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    // Get all completed quiz attempts for this user
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        status: "completed"
      },
      include: {
        questionSet: {
          select: {
            name: true,
            level: true,
            topics: true,
            fields: true,
            skills: true
          }
        }
      },
      orderBy: {
        completedAt: "desc"
      }
    });

    // Transform to match frontend interface
    const quizHistory = attempts.map(attempt => {
      const itemsSnapshot = attempt.itemsSnapshot as unknown as QuestionSnapshot[];
      const responses = (attempt.responses as unknown as ResponseItem[]) || [];
      
      // Check if this is a practice quiz (no linked question set)
      const isPracticeQuiz = !attempt.questionSetId;
      
      // Calculate retry count for same question set
      const retryCount = attempts.filter(a => 
        a.questionSetId === attempt.questionSetId && 
        a.completedAt && 
        attempt.completedAt &&
        a.completedAt <= attempt.completedAt
      ).length - 1; // Subtract 1 because first attempt is not a retry

      return {
        id: attempt.id,
        field: isPracticeQuiz ? "Practice" : (attempt.questionSet?.fields?.[0] || "General"),
        topic: isPracticeQuiz ? "Mixed Topics" : (attempt.questionSet?.topics?.[0] || attempt.questionSet?.name),
        level: isPracticeQuiz ? "mixed" : (attempt.questionSet?.level || "intermediate"),
        completedAt: attempt.completedAt?.toISOString() || attempt.startedAt.toISOString(),
        score: attempt.score || 0,
        timeUsed: attempt.timeUsed || 0,
        timeLimit: itemsSnapshot.length * 120, // 2 minutes per question default
        totalQuestions: itemsSnapshot.length,
        retryCount: isPracticeQuiz ? 0 : retryCount, // Don't show retry count for practice
        userAnswers: responses.map(response => ({
          questionId: response.questionId,
          answerIndex: Array.isArray(response.answer) ? response.answer : [response.answer],
          isCorrect: false // We don't store this, would need to recalculate if needed
        })),
        questions: itemsSnapshot.map(item => ({
          id: item.questionId,
          question: item.stem,
          answers: (item.options || []).map((opt: QuestionOption) => ({
            content: opt.text,
            isCorrect: false // Don't expose correct answers for security
          })),
          explanation: ""
        }))
      };
    });

    return NextResponse.json(quizHistory);
    
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz history" },
      { status: 500 }
    );
  }
}