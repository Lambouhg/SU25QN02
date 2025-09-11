import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const rows = await db.questionSetQuestion.findMany({
    where: { questionSetId: id },
    orderBy: { order: "asc" },
    include: { question: { include: { options: true } } },
  });
  return NextResponse.json({ data: rows });
}

// Replace entire list of items for the set
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const list = await req.json();
  if (!Array.isArray(list)) return NextResponse.json({ error: "Body must be an array" }, { status: 400 });

  const data = list.map((row: any, idx: number) => ({
    questionSetId: id,
    questionId: row.questionId,
    order: row.order ?? idx,
    section: row.section ?? null,
    weight: row.weight ?? null,
    isRequired: row.isRequired ?? false,
    timeSuggestion: row.timeSuggestion ?? null,
  }));

  await db.$transaction(async (tx: any) => {
    await tx.questionSetQuestion.deleteMany({ where: { questionSetId: id } });
    if (data.length) await tx.questionSetQuestion.createMany({ data });
  });

  const rows = await db.questionSetQuestion.findMany({
    where: { questionSetId: id },
    orderBy: { order: "asc" },
    include: { question: { include: { options: true } } },
  });
  return NextResponse.json({ data: rows });
}


