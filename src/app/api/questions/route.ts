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

    console.log('🎯 Questions API called with params:', {
      topics: q.topics,
      skills: q.skills,
      fields: q.fields,
      pageSize: q.pageSize,
      allParams: q
    });

    const page = Math.max(parseInt(q.page || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 100);

    const where: any = {
      // Only return non-archived questions for review
      isArchived: false
    };
    
    if (q.type) where.type = q.type;
    if (q.level) where.level = q.level;
    if (q.search) where.stem = { contains: q.search, mode: "insensitive" };
    // 🔧 SIMPLIFIED: Only filter by category based on user's skills/topics
    if (q.topics) {
      const topicList = q.topics.split(",").map((s) => s.trim()).filter(Boolean);
      
      // Map user topics/skills to categories for better matching
      const topicToCategoryMapping: Record<string, string[]> = {
        'aws': ['DevOps', 'Cloud'],
        'docker': ['DevOps'],
        'kubernetes': ['DevOps'],
        'react': ['Software Development', 'Frontend Development'],
        'javascript': ['Software Development', 'Frontend Development'],
        'python': ['Software Development', 'Backend Development'],
        'node.js': ['Software Development', 'Backend Development'],
        'database': ['Database'],
        'sql': ['Database'],
        'mongodb': ['Database'],
        'devops': ['DevOps'],
        'cloud': ['DevOps', 'Cloud'],
        'frontend': ['Frontend Development'],
        'backend': ['Backend Development'],
        'mobile': ['Mobile Development'],
        'android': ['Mobile Development'],
        'ios': ['Mobile Development']
      };

      let mappedCategories: string[] = [];

      topicList.forEach(topic => {
        const topicLower = topic.toLowerCase();
        const categoriesForTopic = topicToCategoryMapping[topicLower] || [];
        mappedCategories.push(...categoriesForTopic);
      });

      // Remove duplicates
      mappedCategories = Array.from(new Set(mappedCategories));

      console.log('🔧 Topic to category mapping applied:', {
        originalTopics: topicList,
        mappedCategories
      });

      // Filter by category only - much simpler!
      if (mappedCategories.length > 0) {
        where.category = { in: mappedCategories };
      }
    }
    
    // 🔧 SIMPLIFIED: Map field filter to category directly
    if (q.fields) {
      const fieldList = q.fields.split(",").map((s) => s.trim()).filter(Boolean);
      
      // Direct field to category mapping
      const fieldToCategoryMapping: Record<string, string[]> = {
        'software development': ['Software Development'],
        'devops': ['DevOps'],
        'frontend development': ['Frontend Development'],
        'backend development': ['Backend Development'],
        'database': ['Database'],
        'mobile development': ['Mobile Development']
      };

      let mappedCategories: string[] = [];

      fieldList.forEach(field => {
        const fieldLower = field.toLowerCase();
        const categoriesForField = fieldToCategoryMapping[fieldLower] || [field];
        mappedCategories.push(...categoriesForField);
      });

      // Remove duplicates
      mappedCategories = Array.from(new Set(mappedCategories));

      console.log('🔧 Field to category mapping applied:', {
        originalFields: fieldList,
        mappedCategories
      });

      // Filter by category only
      where.category = { in: mappedCategories };
    }
    
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

    console.log('🎯 Questions API results:', {
      whereClause: where,
      totalFound: total,
      returnedCount: items.length,
      sampleQuestions: items.slice(0, 3).map((q: any) => ({
        id: q.id,
        stem: q.stem.substring(0, 50) + '...',
        topics: q.topics,
        skills: q.skills,
        fields: q.fields
      }))
    });

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