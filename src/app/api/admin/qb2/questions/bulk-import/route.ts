/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import prisma from "@/lib/prisma";
import { batchCheckQuestionDuplicates } from '@/services/questionDuplicateService';

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
  option5?: string;
  option5_correct?: boolean;
  option6?: string;
  option6_correct?: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  duplicatesFound: number;
  errors: string[];
  warnings: string[];
  successfulIds: string[];
  duplicateDetails: Array<{
    questionIndex: number;
    status: 'success' | 'failed' | 'skipped' | 'duplicate' | 'warning';
    message: string;
    duplicateInfo?: any;
  }>;
}

const db: any = prisma as any;

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    let dbUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!dbUser) {
      // Create user if not exists
      try {
        dbUser = await db.user.create({
          data: {
            clerkId: userId,
            email: `temp_${userId}@example.com`, // Temporary email, should be updated
            roleId: "ba1383db-8bbc-4bc8-952f-cb2b6ce8d363" // Default role
          }
        });
      } catch (userCreateError) {
        console.error('Failed to create user:', userCreateError);
        return NextResponse.json({ 
          error: 'User not found and could not be created' 
        }, { status: 403 });
      }
    }

    const { questions, skipDuplicateCheck = false, similarityThreshold = 0.85 } = await req.json();
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (questions.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 questions allowed per batch' }, { status: 400 });
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      duplicatesFound: 0,
      errors: [],
      warnings: [],
      successfulIds: [],
      duplicateDetails: []
    };

    // Check for duplicates if not skipped
    let duplicateCheckResults: Array<any> = [];
    if (!skipDuplicateCheck) {
      console.log('Starting duplicate check for', questions.length, 'questions...');
      
      try {
        const questionsForCheck = questions.map((q: BulkQuestionData) => ({
          stem: q.stem,
          category: q.category,
          fields: q.fields ? q.fields.split(',').map(f => f.trim()).filter(Boolean) : []
        }));

        duplicateCheckResults = await batchCheckQuestionDuplicates(
          questionsForCheck,
          similarityThreshold
        );
        
        console.log('Duplicate check completed:', duplicateCheckResults.length, 'results');
      } catch (duplicateError) {
        console.error('Duplicate check failed:', duplicateError);
        result.warnings.push('Duplicate check failed, proceeding without duplicate detection');
        // Continue without duplicate check if it fails
        duplicateCheckResults = questions.map((_: any, index: number) => ({
          questionIndex: index,
          isDuplicate: false,
          recommendation: 'save'
        }));
      }
    } else {
      // Skip duplicate check
      duplicateCheckResults = questions.map((_: any, index: number) => ({
        questionIndex: index,
        isDuplicate: false,
        recommendation: 'save'
      }));
    }

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const questionData: BulkQuestionData = questions[i];
      const rowNum = i + 1;
      const duplicateResult = duplicateCheckResults.find(r => r.questionIndex === i);

      try {
        // Handle duplicate detection - only skip if very high confidence rejection
        const shouldSkip = duplicateResult?.isDuplicate && 
                          duplicateResult?.recommendation === 'reject' &&
                          duplicateResult.confidence > 0.8; // Higher confidence threshold

        if (shouldSkip) {
          result.skipped++;
          result.duplicatesFound++;
          result.duplicateDetails.push({
            questionIndex: i,
            status: 'duplicate',
            message: `Skipped - High similarity detected (${Math.round((duplicateResult.confidence || 0) * 100)}% confidence)`,
            duplicateInfo: {
              similarQuestions: duplicateResult.similarQuestions || [],
              confidence: duplicateResult.confidence,
              recommendation: duplicateResult.recommendation
            }
          });
          continue;
        }

        // Parse array fields - handle both string and array types
        const parseArrayField = (field: any): string[] => {
          if (!field) return [];
          if (Array.isArray(field)) return field.map(s => String(s).trim()).filter(Boolean);
          if (typeof field === 'string') return field.split(',').map(s => s.trim()).filter(Boolean);
          return [];
        };

        const topics = parseArrayField(questionData.topics);
        const fields = parseArrayField(questionData.fields);
        const skills = parseArrayField(questionData.skills);
        const tags = parseArrayField(questionData.tags);

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
            { text: questionData.option4, correct: questionData.option4_correct },
            { text: questionData.option5, correct: questionData.option5_correct },
            { text: questionData.option6, correct: questionData.option6_correct }
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

        // Validate required fields
        if (!questionData.type || !questionData.stem) {
          throw new Error('Missing required fields: type and stem are required');
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
            createdById: dbUser.id, // Use dbUser.id instead of userId
            options: options.length > 0 ? {
              createMany: {
                data: options
              }
            } : undefined,
          },
          include: { options: true },
        });

        console.log(`Successfully created question ${created.id} for row ${rowNum}`);

        result.success++;
        result.successfulIds.push(created.id);

        // Include duplicate warning if similarity detected but not rejected
        let message = 'Successfully saved';
        let duplicateInfo = undefined;
        
        if (duplicateResult?.similarQuestions?.length > 0 && duplicateResult?.recommendation === 'review') {
          message += ` (Warning: Similar questions found - please review)`;
          duplicateInfo = {
            similarQuestions: duplicateResult.similarQuestions,
            confidence: duplicateResult.confidence,
            recommendation: duplicateResult.recommendation
          };
          result.warnings.push(`Row ${rowNum}: Similar questions detected`);
        }
        
        result.duplicateDetails.push({
          questionIndex: i,
          status: duplicateInfo ? 'warning' : 'success',
          message,
          duplicateInfo
        });
        
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Row ${rowNum}: ${errorMessage}`);
        result.duplicateDetails.push({
          questionIndex: i,
          status: 'failed',
          message: `Failed to save: ${errorMessage}`
        });
        console.error(`Error importing question at row ${rowNum}:`, error);
        console.error(`Question data for row ${rowNum}:`, JSON.stringify(questionData, null, 2));
      }
    }

    return NextResponse.json({
      message: `Import completed: ${result.success} saved, ${result.failed} failed, ${result.skipped} skipped`,
      ...result
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error during bulk import' },
      { status: 500 }
    );
  }
}
