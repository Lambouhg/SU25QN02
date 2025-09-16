import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // Distinct categories from single_choice and multiple_choice questions only
  const cats = await prisma.questionItem.findMany({
    where: { 
      isArchived: false,
      type: { in: ['single_choice', 'multiple_choice'] }
    },
    select: { category: true },
    distinct: ["category"],
  });

  // Collect topics from arrays (single_choice and multiple_choice only)
  const arrs = await prisma.questionItem.findMany({
    where: { 
      isArchived: false,
      type: { in: ['single_choice', 'multiple_choice'] }
    },
    select: { topics: true },
  });
  const topicSet = new Set<string>();
  for (const it of arrs) {
    (it.topics || []).forEach((t) => t && topicSet.add(t));
  }

  const categories = cats.map((c) => c.category).filter((v): v is string => !!v);
  const topics = Array.from(topicSet).sort();

  return NextResponse.json({ data: { categories, topics } });
}


