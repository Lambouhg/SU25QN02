import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
    const row = await prisma.quizAttempt.findUnique({ 
    where: { id }, 
    select: { 
      id: true, 
      status: true, 
      score: true, 
      completedAt: true, 
      startedAt: true, 
      itemsSnapshot: true, 
      responses: true, 
      questionSet: { select: { name: true } } 
    } 
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: row });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    
    // Check if quiz attempt exists and belongs to the user
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    });

    if (!quizAttempt) {
      return NextResponse.json({ error: "Quiz attempt not found or access denied" }, { status: 404 });
    }

    // Delete the quiz attempt
    await prisma.quizAttempt.delete({
      where: { id: id }
    });

    return NextResponse.json({ 
      message: "Quiz attempt deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting quiz attempt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

