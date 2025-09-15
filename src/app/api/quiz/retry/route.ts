import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Create a new quiz attempt with the same questions as a previous attempt
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { 
    items: Array<{
      questionId: string;
      stem: string;
      type: string;
      options?: { text: string }[];
    }>;
  };
  const { items } = body || {};

  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No questions provided" }, { status: 400 });
  }

  try {
    // Create a temporary practice set for retry
    const retrySetName = `Retry Practice ${Date.now()}`;
    const retrySet = await prisma.questionSet.create({
      data: {
        name: retrySetName,
        status: "draft",
        topics: [],
        fields: [],
        skills: []
      },
      select: { id: true }
    });

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
        questionSetId: retrySet.id,
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