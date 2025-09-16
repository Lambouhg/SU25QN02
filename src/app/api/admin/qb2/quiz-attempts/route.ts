import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type ListQuery = {
  page?: string;
  pageSize?: string;
  userId?: string;
  questionSetId?: string;
  status?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q: ListQuery = Object.fromEntries(searchParams.entries());
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (q.userId) where.userId = q.userId;
  if (q.questionSetId) where.questionSetId = q.questionSetId;
  if (q.status) where.status = q.status;

  const [items, total] = await Promise.all([
    db.quizAttempt.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        timeUsed: true,
        score: true,
        sectionScores: true,
        questionSet: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } },
      },
    }),
    db.quizAttempt.count({ where }),
  ]);

  return NextResponse.json({ data: items, page, pageSize, total });
}


