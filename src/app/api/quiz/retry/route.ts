import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Create a new quiz attempt with the same questions as a previous attempt
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { 
    originalAttemptId?: string;
    items: Array<{
      questionId: string;
      stem: string;
      type: string;
      options?: { text: string }[];
    }>;
  };
  const { originalAttemptId, items } = body || {};

  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No questions provided" }, { status: 400 });
  }

  try {
    // Get the original attempt to reuse the same questionSetId (if any)
    let questionSetId: string | null = null;
    
    if (originalAttemptId) {
      const originalAttempt = await prisma.quizAttempt.findUnique({
        where: { id: originalAttemptId },
        select: { questionSetId: true, userId: true }
      });
      
      if (originalAttempt && originalAttempt.userId === user.id) {
        questionSetId = originalAttempt.questionSetId; // Keep same questionSetId (null or actual ID)
      }
    }
    // If no original attempt or not found, questionSetId stays null (practice quiz)

    // Create new attempt with the same questions
    const snapshot = items.map((item) => ({
      questionId: item.questionId,
      stem: item.stem,
      type: item.type,
      options: (item.options || []).map((o) => ({ text: o.text })),
    }));

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        questionSetId: questionSetId, // null for practice, ID for company quiz
        status: "in_progress",
        itemsSnapshot: snapshot,
      },
      select: { id: true },
    });

    return NextResponse.json({ 
      data: { 
        attemptId: attempt.id, 
        items: snapshot 
      } 
    });

  } catch (error) {
    console.error("Error creating retry attempt:", error);
    return NextResponse.json(
      { error: "Failed to create retry attempt" },
      { status: 500 }
    );
  }
}