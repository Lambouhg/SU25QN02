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

  const [rows, total] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, status: true, score: true, completedAt: true, startedAt: true, questionSetId: true, questionSet: { select: { name: true } } },
    }),
    prisma.quizAttempt.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ data: rows, page, pageSize, total });
}


