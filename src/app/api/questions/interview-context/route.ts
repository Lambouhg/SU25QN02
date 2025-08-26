import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { 
  findJobRoleMappingByTitleAndLevel, 
  createAIContextForJobRole, 
  createQuestionFilterForJobRole 
} from '@/services/jobRoleQuestionMapping';
import { QuizLevel } from '@/services/levelMappingService';

export async function POST(req: Request) {
  try {
    const { field, level, topic, questionCount = 4, jobRoleTitle, jobRoleLevel } = await req.json();

    if (!field || !level) {
      return NextResponse.json(
        { error: 'Field and level are required' },
        { status: 400 }
      );
    }

    // Tìm job role mapping nếu có jobRoleTitle và jobRoleLevel
    let jobRoleMapping = null;
    if (jobRoleTitle && jobRoleLevel) {
      jobRoleMapping = findJobRoleMappingByTitleAndLevel(jobRoleTitle, jobRoleLevel);
    }

    // Build where clause for filtering
    const where: Prisma.QuestionWhereInput = {};
    
    if (jobRoleMapping) {
      // Sử dụng mapping từ job role
      const filter = createQuestionFilterForJobRole(jobRoleMapping);
      where.fields = { hasSome: filter.fields };
      where.topics = { hasSome: filter.topics };
      where.levels = { hasSome: filter.levels as QuizLevel[] };
    } else {
      // Fallback to old mapping logic
      if (field) {
        const fieldMapping: Record<string, string[]> = {
          'Frontend': ['Frontend Development', 'Web Development'],
          'Backend': ['Backend Development', 'Server Development'],
          'Full Stack': ['Full Stack Development', 'Web Development'],
          'Mobile': ['Mobile Development', 'iOS Development', 'Android Development'],
          'Data Science': ['Data Science', 'Machine Learning', 'AI'],
          'DevOps': ['DevOps', 'Infrastructure', 'Cloud'],
          'QA': ['Quality Assurance', 'Testing', 'QA'],
          'UI/UX': ['UI/UX Design', 'Design', 'User Experience']
        };
        const mappedFields = fieldMapping[field] || [field];
        where.fields = { hasSome: mappedFields };
      }
      
      if (level) {
        const levelMapping: Record<string, QuizLevel[]> = {
          'Intern': [QuizLevel.JUNIOR],
          'Junior': [QuizLevel.JUNIOR],
          'Mid': [QuizLevel.MIDDLE],
          'Senior': [QuizLevel.SENIOR],
          'Lead': [QuizLevel.SENIOR]
        };
        const mappedLevels = levelMapping[level] || [QuizLevel.JUNIOR];
        where.levels = { hasSome: mappedLevels };
      }
    }
    
    if (topic) {
      where.topics = { has: topic };
    }

    // Get questions from database
    const questions = await prisma.question.findMany({
      where,
      take: questionCount * 2, // Get more to allow for selection
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found for field: ${field}, level: ${level}, topic: ${topic || 'any'}` },
        { status: 404 }
      );
    }

    // Randomly select the required number of questions
    const selectedQuestions = questions
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, questionCount);

    // Convert questions to interview format
    const questionsForInterview = selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      answers: q.answers as Array<{ content: string; isCorrect: boolean }> || [],
      fields: q.fields || [],
      topics: q.topics || [],
      levels: q.levels || [],
      explanation: q.explanation || undefined
    }));

    // Create context prompt
    let contextPrompt: string;
    
    if (jobRoleMapping) {
      // Sử dụng AI context từ job role mapping
      contextPrompt = createAIContextForJobRole(jobRoleMapping);
      
      // Thêm question bank reference
      const questionsContext = questionsForInterview
        .map(q => {
          const options = q.answers.map((answer, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            return `${optionLetter}. ${answer.content}`;
          }).join('\n');

          const correctAnswers = q.answers
            .map((answer, index) => answer.isCorrect ? String.fromCharCode(65 + index) : null)
            .filter(Boolean)
            .join(', ');

          return `Question: ${q.question}

Options:
${options}

Correct Answer(s): ${correctAnswers}

Explanation: ${q.explanation || 'No explanation provided'}

---
`;
        })
        .join('\n\n');

      contextPrompt += `\n\nQUESTION BANK REFERENCE:
Use these questions as inspiration for your interview:

${questionsContext}

IMPORTANT: You can:
1. Ask these questions directly
2. Use them as inspiration to create similar questions
3. Adapt them based on the candidate's responses
4. Ask follow-up questions based on these topics

Ask exactly ${questionCount} technical questions and maintain a professional but friendly tone.`;
    } else {
      // Fallback to old context creation
      const questionsContext = questionsForInterview
        .map(q => {
          const options = q.answers.map((answer, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            return `${optionLetter}. ${answer.content}`;
          }).join('\n');

          const correctAnswers = q.answers
            .map((answer, index) => answer.isCorrect ? String.fromCharCode(65 + index) : null)
            .filter(Boolean)
            .join(', ');

          return `Question: ${q.question}

Options:
${options}

Correct Answer(s): ${correctAnswers}

Explanation: ${q.explanation || 'No explanation provided'}

---
`;
        })
        .join('\n\n');

      contextPrompt = `You are conducting a technical interview for a ${level} level ${field} position${topic ? ` focusing on ${topic}` : ''}.

IMPORTANT: Use the following questions from our question bank as a reference for your interview. You can:
1. Ask these questions directly
2. Use them as inspiration to create similar questions
3. Adapt them based on the candidate's responses
4. Ask follow-up questions based on these topics

Question Bank Reference:
${questionsContext}

INTERVIEW GUIDELINES:
- Ask exactly ${questionCount} technical questions
- Keep questions natural and conversational
- Provide constructive feedback
- Adapt difficulty based on candidate's responses
- Focus on practical knowledge and problem-solving skills
- End with a professional conclusion after all questions are answered

Remember to maintain a professional but friendly tone throughout the interview.`;
    }

    return NextResponse.json({
      questions: questionsForInterview,
      contextPrompt,
      usedQuestionIds: questionsForInterview.map(q => q.id),
      jobRoleMapping: jobRoleMapping ? {
        jobRoleKey: jobRoleMapping.jobRoleKey,
        jobRoleTitle: jobRoleMapping.jobRoleTitle,
        jobRoleLevel: jobRoleMapping.jobRoleLevel,
        categoryName: jobRoleMapping.categoryName,
        skills: jobRoleMapping.skills,
        interviewFocusAreas: jobRoleMapping.interviewFocusAreas
      } : null
    });

  } catch (error) {
    console.error('Error creating interview context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
