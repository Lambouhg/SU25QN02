/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Temporary adapter while client types refresh in editors
const db: any = prisma as any;

type ListQuery = {
  page?: string;
  pageSize?: string;
  type?: string;
  level?: string;
  search?: string;
  topics?: string; // comma separated
  fields?: string; // comma separated
  skills?: string; // comma separated
  category?: string;
  tags?: string; // comma separated
  difficulty?: string; // easy|medium|hard
};

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q: ListQuery = Object.fromEntries(searchParams.entries());

    const page = Math.max(parseInt(q.page || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 100);

    const where: any = {
      // Only return non-archived questions for review
      isArchived: false
    };
    
    if (q.type) where.type = q.type;
    if (q.level) where.level = q.level;
    if (q.search) where.stem = { contains: q.search, mode: "insensitive" };
    if (q.topics) where.topics = { hasSome: q.topics.split(",").map((s) => s.trim()).filter(Boolean) };
    if (q.fields) where.fields = { hasSome: q.fields.split(",").map((s) => s.trim()).filter(Boolean) };
    if (q.skills) where.skills = { hasSome: q.skills.split(",").map((s) => s.trim()).filter(Boolean) };
    if (q.category) where.category = q.category;
    if (q.tags) where.tags = { hasSome: q.tags.split(",").map((s) => s.trim()).filter(Boolean) };
    if (q.difficulty) where.difficulty = q.difficulty;

    const [items, total] = await Promise.all([
      db.questionItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        // Use only select, not include
        select: {
          id: true,
          stem: true,
          explanation: true,
          level: true,
          topics: true,
          fields: true,
          skills: true,
          category: true,
          tags: true,
          difficulty: true,
          type: true,
          options: {
            select: {
              id: true,
              text: true,
              isCorrect: true,
              order: true
            },
            orderBy: { order: 'asc' }
          }
        }
      }),
      db.questionItem.count({ where }),
    ]);

    return NextResponse.json({ 
      data: items, 
      page, 
      pageSize, 
      total,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching questions for review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', success: false }, 
      { status: 500 }
    );
  }
}