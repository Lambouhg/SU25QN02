/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import TrackingEventService from "@/services/trackingEventService";

type SubmitBody = {
  attemptId: string;
  responses: Array<{ questionId: string; answer: number[] | number | string | null }>;
  timeUsed?: number;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SubmitBody;
  const { attemptId, responses, timeUsed } = body || {};
  if (!attemptId || !Array.isArray(responses)) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return NextResponse.json({ error: "attempt not found" }, { status: 404 });

  // Simple scoring: match selected indices with correct options order
  // We need ground truth from DB (not snapshot) for correctness
  let total = 0;
  let gained = 0;
  const sectionScores: Record<string, { gained: number; total: number }> = {};
  const details: Array<{ questionId: string; correctIdx: number[]; givenIdx: number[]; isRight: boolean }> = [];

  for (const snap of (attempt.itemsSnapshot as any[])) {
    total += (snap.weight ?? 1);
    const sec = snap.section || "__default__";
    sectionScores[sec] ||= { gained: 0, total: 0 };
    sectionScores[sec].total += (snap.weight ?? 1);

    const r = responses.find((x) => x.questionId === snap.questionId);
    if (!r) continue;

    const truth = await prisma.questionItem.findUnique({ where: { id: snap.questionId }, include: { options: true } });
    if (!truth) continue;
    const correctIdx = truth.options
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((o, idx) => ({ idx, isCorrect: o.isCorrect }))
      .filter((x) => x.isCorrect)
      .map((x) => x.idx);

    const given = Array.isArray(r.answer) ? (r.answer as number[]) : typeof r.answer === "number" ? [r.answer] : [];
    const isRight = given.length === correctIdx.length && given.every((g) => correctIdx.includes(g));
    if (isRight) {
      gained += (snap.weight ?? 1);
      sectionScores[sec].gained += (snap.weight ?? 1);
    }
    details.push({ questionId: snap.questionId, correctIdx, givenIdx: given, isRight });
  }

  // Calculate scaled score (out of 10)
  const scaledScore = total > 0 ? Math.round((gained / total) * 10 * 10) / 10 : 0;

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: "completed",
      completedAt: new Date(),
      responses,
      score: scaledScore,
      sectionScores,
      timeUsed: timeUsed || 0,
    },
  });

  // Tracking: record quiz completion event (non-blocking)
  try {
    // Prefer using attempt.userId (DB ID) to avoid dependency on Clerk auth in this route
    const dbUserId = attempt.userId;
    if (dbUserId) {
      // Infer metadata from attempt snapshot
      const itemsSnapshot = (attempt.itemsSnapshot as any[]) || [];
      const firstItem = itemsSnapshot[0] || {};
      // Best-effort derive field/topic/level
      const field = firstItem.category || firstItem.field || "general";
      const topic = (Array.isArray(firstItem.topics) ? firstItem.topics[0] : firstItem.topic) || "generic";
      const level = firstItem.level || "junior";
      const correctAnswers = details.filter((d) => d.isRight).length;
      await TrackingEventService.trackQuizCompleted({
        userId: dbUserId,
        quizId: attempt.id,
        field,
        topic,
        level,
        score: scaledScore,
        totalQuestions: total,
        correctAnswers,
        timeUsedSeconds: (timeUsed || 0),
      });
    }
  } catch (e) {
    console.error("[Quiz Submit] Tracking failed:", e);
  }

  return NextResponse.json({ data: { score: scaledScore, total, sectionScores, details } });
}


