import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await db.questionSet.findUnique({
    where: { id },
    include: { items: { include: { question: { include: { options: true } } } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, level, topics, fields, skills, status, version } = body || {};

  const exist = await db.questionSet.findUnique({ where: { id } });
  if (!exist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.questionSet.update({
    where: { id },
    data: {
      name: name ?? exist.name,
      description: description === undefined ? exist.description : description,
      level: level === undefined ? exist.level : level,
      topics: topics ?? exist.topics,
      fields: fields ?? exist.fields,
      skills: skills ?? exist.skills,
      status: status ?? exist.status,
      version: version ?? exist.version,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  
  try {
    // First check dependencies to provide informative error messages
    const dependencies = await db.$transaction(async (tx: typeof db) => {
      const quizAttempts = await tx.quizAttempt.count({ where: { questionSetId: id } });
      const questionLinks = await tx.questionSetQuestion.count({ where: { questionSetId: id } });
      return { quizAttempts, questionLinks };
    });

    // Log dependency info for debugging
    console.log(`Deleting question set ${id}:`, dependencies);

    await db.$transaction(async (tx: typeof db) => {
      // Delete QuizAttempts that reference this question set
      if (dependencies.quizAttempts > 0) {
        await tx.quizAttempt.deleteMany({ where: { questionSetId: id } });
      }
      
      // Delete QuestionSetQuestion links
      if (dependencies.questionLinks > 0) {
        await tx.questionSetQuestion.deleteMany({ where: { questionSetId: id } });
      }
      
      // Finally delete the QuestionSet
      await tx.questionSet.delete({ where: { id } });
    });
    
    return NextResponse.json({ 
      ok: true, 
      deleted: {
        questionSet: 1,
        quizAttempts: dependencies.quizAttempts,
        questionLinks: dependencies.questionLinks
      }
    });
  } catch (error) {
    console.error("Error deleting question set:", error);
    
    // Provide more specific error messages
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: "Cannot delete question set due to existing dependencies. Please contact support if this issue persists." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to delete question set. Please try again." },
      { status: 500 }
    );
  }
}


