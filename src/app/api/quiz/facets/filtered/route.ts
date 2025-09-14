import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  try {
    if (category) {
      // Get topics and tags for specific category
      const arrs = await prisma.questionItem.findMany({
        where: { 
          isArchived: false,
          type: { in: ['single_choice', 'multiple_choice'] },
          category: category
        },
        select: { topics: true, tags: true },
      });

      const topicSet = new Set<string>();
      const tagSet = new Set<string>();
      
      for (const it of arrs) {
        (it.topics || []).forEach((t) => t && topicSet.add(t));
        (it.tags || []).forEach((t) => t && tagSet.add(t));
      }

      const topics = Array.from(topicSet).sort();
      const tags = Array.from(tagSet).sort();

      return NextResponse.json({ data: { topics, tags } });
    } else {
      // Return all topics and tags when no category selected
      const arrs = await prisma.questionItem.findMany({
        where: { 
          isArchived: false,
          type: { in: ['single_choice', 'multiple_choice'] }
        },
        select: { topics: true, tags: true },
      });

      const topicSet = new Set<string>();
      const tagSet = new Set<string>();
      
      for (const it of arrs) {
        (it.topics || []).forEach((t) => t && topicSet.add(t));
        (it.tags || []).forEach((t) => t && tagSet.add(t));
      }

      const topics = Array.from(topicSet).sort();
      const tags = Array.from(tagSet).sort();

      return NextResponse.json({ data: { topics, tags } });
    }
  } catch (error) {
    console.error('Error fetching filtered facets:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}