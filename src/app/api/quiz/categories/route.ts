import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Consolidated API để lấy tất cả thông tin cần thiết cho quiz setup
 * Lấy categories từ QuestionItem.category thực tế (không phải JobCategory)
 * Thay thế multiple APIs: /api/quiz/facets, /api/quiz/topics-skills, /api/positions
 */
export async function GET() {
  try {
    // Lấy tất cả questions để extract categories thực tế có câu hỏi
    const questions = await prisma.questionItem.findMany({
      where: {
        isArchived: false,
        type: { in: ['single_choice', 'multiple_choice'] },
        category: { not: null } // Chỉ lấy questions có category
      },
      select: {
        category: true,
        level: true,
        topics: true,
        skills: true,
        fields: true
      }
    });

    // Group questions by category
    const categoriesMap = new Map<string, {
      name: string;
      questions: typeof questions;
    }>();

    questions.forEach(question => {
      if (question.category) {
        if (!categoriesMap.has(question.category)) {
          categoriesMap.set(question.category, {
            name: question.category,
            questions: []
          });
        }
        categoriesMap.get(question.category)!.questions.push(question);
      }
    });

    // Build response data với hierarchy: Category → Topics → Skills
    const responseData = Array.from(categoriesMap.entries()).map(([categoryName, categoryData]) => {
      const categoryQuestions = categoryData.questions;
      
      // Extract available levels cho category này
      const availableLevels = Array.from(
        new Set(categoryQuestions.map(q => q.level).filter(Boolean))
      ).sort();

      // Extract fields từ questions
      const fieldsFromQuestions = Array.from(
        new Set(categoryQuestions.flatMap(q => q.fields || []))
      ).sort();

      // Tạo topics với skills tương ứng
      const topicsMap = new Map<string, Set<string>>();
      
      categoryQuestions.forEach(question => {
        const questionTopics = question.topics || [];
        const questionSkills = question.skills || [];
        
        questionTopics.forEach(topic => {
          if (!topicsMap.has(topic)) {
            topicsMap.set(topic, new Set<string>());
          }
          // Add skills cho topic này
          questionSkills.forEach(skill => {
            topicsMap.get(topic)!.add(skill);
          });
        });
      });

      // Convert topics map thành array với skills
      const topicsWithSkills = Array.from(topicsMap.entries()).map(([topicName, skillsSet]) => ({
        name: topicName,
        skills: Array.from(skillsSet).sort()
      })).sort((a, b) => a.name.localeCompare(b.name));

      // All skills trong category (flatten từ topics)
      const allSkillsInCategory = Array.from(
        new Set(categoryQuestions.flatMap(q => q.skills || []))
      ).sort();

      return {
        id: categoryName.toLowerCase().replace(/\s+/g, '-'), // Generate ID từ name
        name: categoryName,
        topics: topicsWithSkills, // Topics với skills tương ứng
        skills: allSkillsInCategory, // All skills trong category
        fields: fieldsFromQuestions,
        levels: availableLevels,
        questionCount: categoryQuestions.length
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Tính tổng stats
    const totalStats = {
      totalCategories: responseData.length,
      totalQuestions: questions.length,
      totalSkills: Array.from(new Set(questions.flatMap(q => q.skills || []))).length,
      totalTopics: Array.from(new Set(questions.flatMap(q => q.topics || []))).length,
      totalFields: Array.from(new Set(questions.flatMap(q => q.fields || []))).length
    };

    return NextResponse.json({
      data: responseData,
      stats: totalStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching quiz categories:', error);
    return NextResponse.json(
      { error: "Failed to fetch quiz categories" }, 
      { status: 500 }
    );
  }
}