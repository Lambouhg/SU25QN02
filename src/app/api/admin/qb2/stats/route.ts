import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get total questions count
    const totalQuestions = await prisma.questionItem.count();

    // Get question sets count
    const questionSets = await prisma.questionSet.count();

    // Get questions added in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentlyAdded = await prisma.questionItem.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Get questions by level
    const byLevel = await prisma.questionItem.groupBy({
      by: ['level'],
      _count: {
        id: true
      }
    });

    const levelStats = {
      junior: 0,
      middle: 0,
      senior: 0
    };

    byLevel.forEach(item => {
      if (item.level === 'junior') levelStats.junior = item._count.id;
      else if (item.level === 'middle') levelStats.middle = item._count.id;
      else if (item.level === 'senior') levelStats.senior = item._count.id;
    });

    // Get questions by type
    const byType = await prisma.questionItem.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    const typeStats = {
      single_choice: 0,
      multiple_choice: 0,
      free_text: 0,
      coding: 0
    };

    byType.forEach(item => {
      if (item.type === 'single_choice') typeStats.single_choice = item._count.id;
      else if (item.type === 'multiple_choice') typeStats.multiple_choice = item._count.id;
      else if (item.type === 'free_text') typeStats.free_text = item._count.id;
      else if (item.type === 'coding') typeStats.coding = item._count.id;
    });

    return NextResponse.json({
      totalQuestions,
      questionSets,
      recentlyAdded,
      byLevel: levelStats,
      byType: typeStats
    });

  } catch (error) {
    console.error('Error fetching question bank stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}