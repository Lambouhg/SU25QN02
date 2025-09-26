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
      
      // Extract practice mode information from sectionScores
      const sectionScores = attempt.sectionScores as { practiceMode?: string; metadata?: Record<string, unknown> } | null;
      let practiceMode = sectionScores?.practiceMode || 'company';
      let practiceMetadata = sectionScores?.metadata || {};
      
      // For older attempts without practice mode info, try to infer from question data
      if (!sectionScores?.practiceMode && !attempt.questionSetId) {
        // This is a practice quiz, try to analyze the first question to determine type
        const itemsSnapshot = attempt.itemsSnapshot as unknown as QuestionSnapshot[];
        if (itemsSnapshot && itemsSnapshot.length > 0) {
          // For now, default to 'topic' for old practice quizzes
          // In the future, we could analyze question metadata to make better guesses
          practiceMode = 'topic';
          practiceMetadata = { category: 'Practice', topic: 'Mixed Topics', level: 'Mixed' };
        }
      }
      
      // Check if this is a practice quiz (no linked question set)
      const isPracticeQuiz = !attempt.questionSetId;
      
      // Calculate retry count for same question set
      const retryCount = attempts.filter(a => 
        a.questionSetId === attempt.questionSetId && 
        a.completedAt && 
        attempt.completedAt &&
        a.completedAt <= attempt.completedAt
      ).length - 1; // Subtract 1 because first attempt is not a retry

      // Determine title based on practice mode
      let title = "";
      if (practiceMode === 'company' && attempt.questionSet) {
        // Question Sets: show question set name
        title = attempt.questionSet.name || "Question Set";
      } else if (practiceMode === 'topic') {
        // Topic Practice mode: Category - Topic - Level
        const category = practiceMetadata.category as string || "Unknown Category";
        const topic = practiceMetadata.topic as string || "Unknown Topic";
        const level = practiceMetadata.level as string || "Mixed";
        title = `${category} - ${topic} - ${level}`;
      } else if (practiceMode === 'skill') {
        // Skill Mastery mode: Category - Skill - Level
        const category = practiceMetadata.category as string || "Unknown Category";
        const skill = practiceMetadata.skill as string || "Unknown Skill";
        const level = practiceMetadata.level as string || "Mixed";
        title = `${category} - ${skill} - ${level}`;
      } else {
        // Fallback for older records without practice mode info
        title = isPracticeQuiz ? "Practice Quiz" : (attempt.questionSet?.name || "Quiz");
      }

      return {
        id: attempt.id,
        field: isPracticeQuiz ? "Practice" : (attempt.questionSet?.fields?.[0] || "General"),
        topic: isPracticeQuiz ? "Mixed Topics" : (attempt.questionSet?.topics?.[0] || attempt.questionSet?.name),
        level: isPracticeQuiz ? "mixed" : (attempt.questionSet?.level || "intermediate"),
        title: title, // Add the dynamic title
        practiceMode: practiceMode, // Add practice mode info
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