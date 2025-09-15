import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

type QuestionData = {
  id: string;
  stem: string;
  type: any;
  difficulty: string | null;
  category: string | null;
  topics: string[];
  skills: string[];
  fields: string[];
};

export async function GET() {
  try {
    console.log('📋 Interview Context API: Starting query...');
    
    // First, check total count
    const totalCount = await prisma.questionItem.count();
    console.log(`📊 Total questions in database: ${totalCount}`);
    
    // Get all questions from the question bank for interview context
    const questions = await prisma.questionItem.findMany({
      select: {
        id: true,
        stem: true, // This is the question text
        type: true,
        difficulty: true,
        category: true,
        topics: true,
        skills: true,
        fields: true
      },
      // Limit to a reasonable number for testing
      take: 50,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Raw questions fetched: ${questions.length}`);
    console.log('📋 Sample question:', questions[0] || 'No questions found');

    // If no questions in database, provide some test questions
    if (questions.length === 0) {
      console.log('⚠️ No questions in database, providing test questions...');
      const testQuestions = [
        {
          id: 'test-1',
          question: 'What is React and how does it work?',
          context: {
            difficulty: 'medium',
            topic: 'react',
            skill: 'frontend',
            keywords: ['react', 'javascript', 'frontend']
          }
        },
        {
          id: 'test-2', 
          question: 'Explain the concept of closures in JavaScript.',
          context: {
            difficulty: 'medium',
            topic: 'javascript',
            skill: 'frontend',
            keywords: ['javascript', 'closures', 'scope']
          }
        },
        {
          id: 'test-3',
          question: 'What is the difference between SQL INNER JOIN and LEFT JOIN?',
          context: {
            difficulty: 'medium',
            topic: 'database',
            skill: 'backend',
            keywords: ['sql', 'database', 'joins']
          }
        }
      ];
      
      console.log(`📊 Interview Context API: Returning ${testQuestions.length} test questions`);
      return NextResponse.json({
        success: true,
        questions: testQuestions,
        total: testQuestions.length
      });
    }

    // Transform questions to the format expected by hybrid question selector
    const transformedQuestions = questions.map((q) => ({
      id: q.id,
      question: q.stem,
      context: {
        difficulty: q.difficulty?.toLowerCase() || 'medium',
        topic: q.category?.toLowerCase() || q.topics?.[0]?.toLowerCase() || 'general',
        skill: q.skills?.[0]?.toLowerCase() || q.fields?.[0]?.toLowerCase() || 'technical',
        keywords: [...(q.topics || []), ...(q.skills || []), ...(q.fields || [])]
      }
    }));

    console.log(`📊 Interview Context API: Returning ${transformedQuestions.length} questions`);
    
    return NextResponse.json({
      success: true,
      questions: transformedQuestions,
      total: transformedQuestions.length
    });

  } catch (error) {
    console.error('❌ Interview Context API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch questions',
        questions: [],
        total: 0
      },
      { status: 500 }
    );
  }
}