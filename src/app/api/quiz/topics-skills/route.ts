import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  try {
    // Build where clause
    const where: Record<string, unknown> = {
      isArchived: false,
      type: { in: ['single_choice', 'multiple_choice'] }
    };

    if (category) where.category = category;

    // Get questions with topics and skills
    const questions = await prisma.questionItem.findMany({
      where,
      select: { 
        topics: true, 
        skills: true 
      },
    });

    // Build mapping of topics to their associated skills
    const topicSkillsMap: Record<string, Set<string>> = {};
    
    for (const q of questions) {
      const topics = q.topics || [];
      const skills = q.skills || [];
      
      for (const topic of topics) {
        if (topic) {
          if (!topicSkillsMap[topic]) {
            topicSkillsMap[topic] = new Set<string>();
          }
          // Add all skills from this question to this topic
          skills.forEach(skill => {
            if (skill) topicSkillsMap[topic].add(skill);
          });
        }
      }
    }

    // Convert Sets to arrays and sort
    const topicsWithSkills = Object.entries(topicSkillsMap).map(([topic, skillsSet]) => ({
      topic,
      skills: Array.from(skillsSet).sort()
    })).sort((a, b) => a.topic.localeCompare(b.topic));

    return NextResponse.json({ 
      data: topicsWithSkills 
    });
  } catch (error) {
    console.error('Error fetching topics-skills mapping:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}