/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface BulkQuestionData {
  stem: string;
  type: string;
  level?: string;
  difficulty?: string;
  category?: string;
  fields?: string;
  topics?: string;
  skills?: string;
  tags?: string;
  explanation?: string;
  option1?: string;
  option1_correct?: boolean;
  option2?: string;
  option2_correct?: boolean;
  option3?: string;
  option3_correct?: boolean;
  option4?: string;
  option4_correct?: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  successfulIds: string[];
}

const db: any = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const { questions } = await req.json();
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions array is required and must not be empty" },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      successfulIds: []
    };

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const questionData: BulkQuestionData = questions[i];
      const rowNum = i + 1;

      try {
        // Parse array fields
        const topics = questionData.topics ? 
          questionData.topics.split(',').map(s => s.trim()).filter(Boolean) : [];
        const fields = questionData.fields ? 
          questionData.fields.split(',').map(s => s.trim()).filter(Boolean) : [];
        const skills = questionData.skills ? 
          questionData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        const tags = questionData.tags ? 
          questionData.tags.split(',').map(s => s.trim()).filter(Boolean) : [];

        // Normalize difficulty
        const normalizeDifficulty = (val: string | undefined) => {
          if (!val) return null;
          const s = val.toLowerCase();
          if (["easy", "medium", "hard"].includes(s)) return s;
          return null;
        };

        // Prepare options for choice questions
        const options: Array<{ text: string; isCorrect: boolean; order: number }> = [];
        if (['single_choice', 'multiple_choice'].includes(questionData.type)) {
          [
            { text: questionData.option1, correct: questionData.option1_correct },
            { text: questionData.option2, correct: questionData.option2_correct },
            { text: questionData.option3, correct: questionData.option3_correct },
            { text: questionData.option4, correct: questionData.option4_correct }
          ].forEach((opt, idx) => {
            if (opt.text?.trim()) {
              options.push({
                text: opt.text.trim(),
                isCorrect: !!opt.correct,
                order: idx
              });
            }
          });
        }

        // Create question item
        const created = await db.questionItem.create({
          data: {
            type: questionData.type,
            stem: questionData.stem,
            explanation: questionData.explanation || null,
            level: questionData.level || null,
            topics,
            fields,
            skills,
            difficulty: normalizeDifficulty(questionData.difficulty),
            category: questionData.category || null,
            tags,
            version: 1,
            isArchived: false,
            options: options.length > 0 ? {
              createMany: {
                data: options
              }
            } : undefined,
          },
          include: { options: true },
        });

        result.success++;
        result.successfulIds.push(created.id);
        
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Row ${rowNum}: ${errorMessage}`);
        console.error(`Error importing question at row ${rowNum}:`, error);
      }
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error during bulk import' },
      { status: 500 }
    );
  }
}
