/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const db: any = prisma as any;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const set = await db.questionSet.findUnique({ where: { id } });
  if (!set || set.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await db.questionSetQuestion.findMany({
    where: { questionSetId: id },
    orderBy: { order: "asc" },
    include: {
      question: {
        include: { options: true },
      },
    },
  });

  // Filter to only include single_choice and multiple_choice questions
  const filteredItems = items.filter((row: any) => 
    row.question.type === 'single_choice' || row.question.type === 'multiple_choice'
  );

  // public response: return needed fields only
  const data = filteredItems.map((row: any) => ({
    questionId: row.questionId,
    order: row.order,
    section: row.section,
    weight: row.weight,
    isRequired: row.isRequired,
    timeSuggestion: row.timeSuggestion,
    question: {
      id: row.question.id,
      type: row.question.type,
      stem: row.question.stem,
      explanation: row.question.explanation,
      level: row.question.level,
      topics: row.question.topics,
      fields: row.question.fields,
      skills: row.question.skills,
      category: row.question.category,
      tags: row.question.tags,
      difficulty: row.question.difficulty,
      options: row.question.options.map((o: any) => ({ id: o.id, text: o.text, order: o.order })),
    },
  }));

  return NextResponse.json({ data });
}


