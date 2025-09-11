import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // Distinct categories
  const cats = await prisma.questionItem.findMany({
    where: { isArchived: false },
    select: { category: true },
    distinct: ["category"],
  });

  // Collect topics and tags from arrays
  const arrs = await prisma.questionItem.findMany({
    where: { isArchived: false },
    select: { topics: true, tags: true },
  });
  const topicSet = new Set<string>();
  const tagSet = new Set<string>();
  for (const it of arrs) {
    (it.topics || []).forEach((t) => t && topicSet.add(t));
    (it.tags || []).forEach((t) => t && tagSet.add(t));
  }

  const categories = cats.map((c) => c.category).filter((v): v is string => !!v);
  const topics = Array.from(topicSet).sort();
  const tags = Array.from(tagSet).sort();

  return NextResponse.json({ data: { categories, topics, tags } });
}


