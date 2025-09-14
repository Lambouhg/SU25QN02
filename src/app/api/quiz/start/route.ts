/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Start a quiz attempt. Supports two modes:
// - Set-based: pass questionSetId (must be published)
// - Filter-based: pass category/topic/tags/count to pick random questions
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { questionSetId?: string; category?: string; topic?: string; tags?: string; count?: number; level?: string };
  const { questionSetId, category, topic, tags, count = 10, level } = body || {};

  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  let items: Array<{ questionId: string; stem: string; type: string; options: Array<{ text: string; isCorrect: boolean }> }> = [];
  let resolvedSetId: string | null = null;

  if (questionSetId) {
    const set = await prisma.questionSet.findUnique({ where: { id: questionSetId } });
    if (!set || set.status !== "published") return NextResponse.json({ error: "Question set not available" }, { status: 404 });
    resolvedSetId = questionSetId;
    const rows = await prisma.questionSetQuestion.findMany({
      where: { questionSetId },
      orderBy: { order: "asc" },
      include: { question: { include: { options: true } } },
    });
    
    // Filter to only include single_choice and multiple_choice questions
    const filteredRows = rows.filter(r => 
      r.question.type === 'single_choice' || r.question.type === 'multiple_choice'
    );
    
    items = filteredRows.map((r) => ({
      questionId: r.questionId,
      stem: r.question.stem,
      type: r.question.type,
      options: (r.question.options || []).map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    }));
  } else {
    const where: any = {};
    // Only include single_choice and multiple_choice questions
    where.type = { in: ['single_choice', 'multiple_choice'] };
    
    if (category) where.category = category;
    if (topic) where.topics = { has: topic };
    if (level) where.level = level;
    if (tags) where.tags = { hasSome: String(tags).split(",").map((s) => s.trim()).filter(Boolean) };
    
    const pool = await prisma.questionItem.findMany({ where, include: { options: true } });
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, Math.max(1, Math.min(50, Number(count) || 10)));
    items = chosen.map((q) => ({
      questionId: q.id,
      stem: q.stem,
      type: q.type,
      options: (q.options || []).map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    }));

    // ensure a stable practice set id exists so quizAttempt.questionSetId is not null
    const practiceName = "Ad-hoc Practice";
    const practice = await prisma.questionSet.findFirst({ where: { name: practiceName, status: "draft" }, select: { id: true } });
    resolvedSetId = practice?.id || (await prisma.questionSet.create({ data: { name: practiceName, status: "draft", topics: [], fields: [], skills: [] }, select: { id: true } })).id;
  }

  // Snapshot hides correctness
  const snapshot = items.map((it) => ({
    questionId: it.questionId,
    stem: it.stem,
    type: it.type,
    options: (it.options || []).map((o) => ({ text: o.text })),
  }));

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      questionSetId: resolvedSetId as string,
      status: "in_progress",
      itemsSnapshot: snapshot,
    },
    select: { id: true },
  });

  return NextResponse.json({ data: { attemptId: attempt.id, items: snapshot } });
}


