import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const topic = searchParams.get("topic");

    if (!category || !topic) {
      return NextResponse.json(
        { error: "Category and topic are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all completed quiz attempts for this user
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        status: "completed",
        completedAt: { not: null }
      },
      orderBy: {
        completedAt: "desc"
      }
    });

    // Filter attempts by category and topic
    const filteredAttempts = [];

    for (const attempt of attempts) {
      // Get the questions for this attempt from itemsSnapshot
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemsSnapshot = attempt.itemsSnapshot as any[];
      if (!itemsSnapshot || !Array.isArray(itemsSnapshot)) continue;

      // Get the actual questions from database to check category and topic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const questionIds = itemsSnapshot.map((item: any) => item.questionId);
      const questions = await prisma.questionItem.findMany({
        where: {
          id: { in: questionIds }
        },
        select: {
          id: true,
          category: true,
          topics: true,
          level: true
        }
      });

      // Check if any question matches the category and topic
      const matchingQuestions = questions.filter(
        (q) => q.category === category && q.topics.includes(topic)
      );

      if (matchingQuestions.length > 0) {
        // Determine the level from the matching questions
        const questionLevels = matchingQuestions
          .map(q => q.level)
          .filter(Boolean);
        
        // Count level occurrences to find the most common one
        const levelCounts = questionLevels.reduce((acc, level) => {
          if (level) {
            acc[level] = (acc[level] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        const mostCommonLevel = Object.keys(levelCounts).length > 0 
          ? Object.keys(levelCounts).reduce((a, b) => 
              levelCounts[a] > levelCounts[b] ? a : b
            )
          : "junior";
        
        filteredAttempts.push({
          ...attempt,
          level: mostCommonLevel
        });
      }
    }

    // Calculate progress for each level
    const progress = {
      category,
      topic,
      levels: {
        junior: {
          unlocked: true, // Junior is always unlocked
          bestScore: 0,
          attempts: 0
        },
        middle: {
          unlocked: false,
          bestScore: 0,
          attempts: 0
        },
        senior: {
          unlocked: false,
          bestScore: 0,
          attempts: 0
        }
      }
    };

    // Process attempts to calculate progress
    for (const attempt of filteredAttempts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const level = (attempt as any).level || "junior";
      const score = attempt.score || 0;
      
      if (level === "junior") {
        progress.levels.junior.attempts++;
        if (score > progress.levels.junior.bestScore) {
          progress.levels.junior.bestScore = score;
        }
        // Unlock middle if score >= 9
        if (score >= 9) {
          progress.levels.middle.unlocked = true;
        }
      } else if (level === "middle") {
        progress.levels.middle.attempts++;
        if (score > progress.levels.middle.bestScore) {
          progress.levels.middle.bestScore = score;
        }
        // Unlock senior if score >= 9
        if (score >= 9) {
          progress.levels.senior.unlocked = true;
        }
      } else if (level === "senior") {
        progress.levels.senior.attempts++;
        if (score > progress.levels.senior.bestScore) {
          progress.levels.senior.bestScore = score;
        }
      }
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching quiz progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
