import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createLevelMappingForAPI, createFieldMappingForAPI } from '@/services/levelMappingService';

export async function GET() {
  try {
    // Sử dụng mapping service
    const fieldMapping = createFieldMappingForAPI();
    const levelMapping = createLevelMappingForAPI();

    const allQuestions = await prisma.question.findMany({
      select: {
        fields: true,
        topics: true,
        levels: true
      }
    });

    const totalQuestions = allQuestions.length;
    
    // Extract unique values
    const allFields = Array.from(new Set(allQuestions.flatMap(q => q.fields || [])));
    const allTopics = Array.from(new Set(allQuestions.flatMap(q => q.topics || [])));
    const allLevels = Array.from(new Set(allQuestions.flatMap(q => q.levels || [])));

    // Count statistics với mapping
    const fieldCounts = new Map<string, number>();
    const topicCounts = new Map<string, number>();
    const levelCounts = new Map<string, number>();

    allQuestions.forEach(q => {
      (q.fields || []).forEach(field => {
        fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
      });
      (q.topics || []).forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
      (q.levels || []).forEach(level => {
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
      });
    });

    // Tạo mapped stats cho job roles
    const mappedFieldStats = Object.entries(fieldMapping).map(([jobRoleField, questionBankFields]) => {
      const count = questionBankFields.reduce((total, field) => {
        return total + (fieldCounts.get(field) || 0);
      }, 0);
      return { field: jobRoleField, count };
    });

    const mappedLevelStats = Object.entries(levelMapping).map(([jobRoleLevel, questionBankLevels]) => {
      const count = questionBankLevels.reduce((total, level) => {
        return total + (levelCounts.get(level) || 0);
      }, 0);
      return { level: jobRoleLevel, count };
    });

    return NextResponse.json({
      totalQuestions,
      fields: Object.keys(fieldMapping), // Chỉ hiển thị job role fields
      topics: allTopics,
      levels: Object.keys(levelMapping), // Chỉ hiển thị job role levels
      fieldStats: mappedFieldStats,
      topicStats: Array.from(topicCounts.entries()).map(([topic, count]) => ({ topic, count })),
      levelStats: mappedLevelStats
    });

  } catch (error) {
    console.error('Error fetching question bank stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
