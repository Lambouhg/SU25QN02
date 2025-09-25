import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const skill = searchParams.get('skill');

  try {
    // Build where clause based on cascading filters
    const where: Record<string, unknown> = {
      isArchived: false,
      type: { in: ['single_choice', 'multiple_choice'] }
    };

    if (category) where.category = category;
    if (skill) where.skills = { has: skill };

    // Get questions matching current filters
    const questions = await prisma.questionItem.findMany({
      where,
      select: { 
        skills: true, 
        level: true 
      },
    });

    // Collect available options for next filter levels
    const skillSet = new Set<string>();
    const levelSet = new Set<string>();
    
    for (const q of questions) {
      (q.skills || []).forEach((s) => s && skillSet.add(s));
      if (q.level) levelSet.add(q.level);
    }

    const skills = Array.from(skillSet).sort();
    const levels = Array.from(levelSet).sort();

    return NextResponse.json({ 
      data: { 
        skills, 
        levels 
      } 
    });
  } catch (error) {
    console.error('Error fetching filtered facets:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}