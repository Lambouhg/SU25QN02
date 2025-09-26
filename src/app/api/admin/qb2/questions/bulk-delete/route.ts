import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: "Invalid question IDs" }, { status: 400 });
    }

    // Validate all IDs are strings
    if (!questionIds.every(id => typeof id === 'string')) {
      return NextResponse.json({ error: "All question IDs must be strings" }, { status: 400 });
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (tx: any) => {
      // Delete question options for all questions
      await tx.questionOption.deleteMany({
        where: { questionId: { in: questionIds } }
      });

      // Delete question set associations for all questions
      await tx.questionSetQuestion.deleteMany({
        where: { questionId: { in: questionIds } }
      });

      // Delete the questions themselves
      const deleteResult = await tx.questionItem.deleteMany({
        where: { id: { in: questionIds } }
      });

      return deleteResult;
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} question(s)`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: "Failed to delete questions. Some questions may be in use." }, 
      { status: 500 }
    );
  }
}