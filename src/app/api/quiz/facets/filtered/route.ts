import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  try {
    if (category) {
      // Get topics for specific category
      const arrs = await prisma.questionItem.findMany({
        where: { 
          isArchived: false,
          type: { in: ['single_choice', 'multiple_choice'] },
          category: category
        },
        select: { topics: true },
      });

      const topicSet = new Set<string>();
      
      for (const it of arrs) {
        (it.topics || []).forEach((t) => t && topicSet.add(t));
      }

      const topics = Array.from(topicSet).sort();

      return NextResponse.json({ data: { topics } });
    } else {
      // Return all topics when no category selected
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

      const topics = Array.from(topicSet).sort();

      return NextResponse.json({ data: { topics } });
    }
  } catch (error) {
    console.error('Error fetching filtered facets:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}