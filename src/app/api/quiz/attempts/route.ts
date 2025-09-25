import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1), 50);

  const [rows, total, totalCompleted, totalWithScore] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, status: true, score: true, completedAt: true, startedAt: true, questionSetId: true, questionSet: { select: { name: true } }, itemsSnapshot: true },
    }),
    prisma.quizAttempt.count({ where: { userId: user.id } }),
    prisma.quizAttempt.count({ where: { userId: user.id, status: 'completed' } }),
    prisma.quizAttempt.findMany({ 
      where: { userId: user.id, status: 'completed', score: { not: null } },
      select: { score: true }
    }),
  ]);

  const avgScore = totalWithScore.length > 0 
    ? totalWithScore.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalWithScore.length
    : 0;

  const completionRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  return NextResponse.json({ 
    data: rows, 
    page, 
    pageSize, 
    total,
    stats: {
      totalCompleted,
      avgScore: parseFloat(avgScore.toFixed(1)),
      completionRate
    }
  });
}


