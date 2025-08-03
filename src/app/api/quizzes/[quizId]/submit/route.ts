import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import { withCORS, corsOptionsResponse } from '@/lib/utils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { userAnswers } = await req.json();
    const { quizId } = await params;

    // Lấy quiz với questions gốc (có isCorrect)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!quiz) {
      return withCORS(NextResponse.json({ error: 'Quiz not found' }, { status: 404 }));
    }

    // Tính điểm server-side
    let correctCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questionsWithCorrectAnswers = quiz.questions.map((question: any) => {
      const userAnswer = userAnswers.find((a: { questionId: string; answerIndex: number[] }) => a.questionId === question.id);
      const answers = question.answers as Array<{ content: string; isCorrect?: boolean }>;
      
      if (!userAnswer || !answers) {
        return {
          ...question,
          userSelectedIndexes: [],
          isCorrect: false
        };
      }

      // Xử lý trường hợp user không chọn đáp án nào
      if (!userAnswer.answerIndex || userAnswer.answerIndex.length === 0) {
        return {
          ...question,
          userSelectedIndexes: [],
          isCorrect: false
        };
      }

      // Kiểm tra xem quiz có answerMapping không (secure quiz hoặc retry quiz)
      const answerMapping = quiz.answerMapping as Record<string, number[]> || {};
      const mapping = answerMapping[question.id] || [];

      console.log(`Question ${question.id}:`, {
        hasAnswerMapping: mapping.length > 0,
        mapping,
        userAnswer: userAnswer.answerIndex,
        answers: answers.map((a, idx) => ({ index: idx, content: a.content, isCorrect: a.isCorrect }))
      });

      let originalSelectedIndexes: number[];

      if (mapping.length > 0) {
        // Quiz có answerMapping (secure quiz hoặc retry quiz) - cần chuyển đổi vị trí
        // mapping[originalIndex] = newIndex, nên để tìm originalIndex từ newIndex: tìm index của newIndex trong mapping
        originalSelectedIndexes = userAnswer.answerIndex.map(
          (shuffledIndex: number) => {
            const originalIndex = mapping.findIndex((value: number) => value === shuffledIndex);
            console.log(`Mapping for shuffledIndex ${shuffledIndex}:`, {
              mapping,
              foundOriginalIndex: originalIndex,
              mappingValues: mapping.map((val, idx) => ({ originalIndex: idx, newIndex: val }))
            });
            return originalIndex;
          }
        ).filter((idx: number) => idx !== -1);
        
        console.log(`Converted indexes for question ${question.id}:`, {
          shuffledIndexes: userAnswer.answerIndex,
          originalIndexes: originalSelectedIndexes
        });
      } else {
        // Quiz không có answerMapping (quiz thường) - sử dụng trực tiếp
        originalSelectedIndexes = userAnswer.answerIndex;
      }

      // Tính toán đáp án đúng từ vị trí gốc
      const correctIndexes = answers
        .map((answer: { content: string; isCorrect?: boolean }, idx: number) => answer.isCorrect ? idx : -1)
        .filter((idx: number) => idx !== -1);

      // Kiểm tra đáp án đúng - sắp xếp cả hai mảng để so sánh chính xác
      const sortedSelected = [...originalSelectedIndexes].sort();
      const sortedCorrect = [...correctIndexes].sort();
      const isCorrect = (
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((idx: number, i: number) => idx === sortedCorrect[i])
      );

      console.log(`Result for question ${question.id}:`, {
        originalSelectedIndexes,
        correctIndexes,
        sortedSelected,
        sortedCorrect,
        isCorrect
      });

      if (isCorrect) {
        correctCount++;
      }

      // Trả về câu hỏi với đáp án đúng và kết quả
      return {
        ...question,
        userSelectedIndexes: userAnswer.answerIndex,
        isCorrect,
        // Trả về answers theo thứ tự đã shuffle mà user đã thấy
        answers: (() => {
          if (mapping.length > 0) {
            // Quiz có answerMapping - trả về answers theo thứ tự đã shuffle
            // mapping[originalIndex] = newIndex, nên để lấy answers theo thứ tự shuffle:
            // shuffledAnswers[newIndex] = originalAnswers[originalIndex]
            const shuffledAnswers = new Array(answers.length);
            mapping.forEach((newIndex, originalIndex) => {
              shuffledAnswers[newIndex] = {
                content: answers[originalIndex].content,
                isCorrect: answers[originalIndex].isCorrect
              };
            });
            
            console.log(`Submit - Question ${question.id} shuffled answers:`, {
              originalAnswers: answers.map((a, idx) => ({ index: idx, content: a.content, isCorrect: a.isCorrect })),
              mapping,
              shuffledAnswers: shuffledAnswers.map((a, idx) => ({ index: idx, content: a.content, isCorrect: a.isCorrect })),
              userSelectedIndexes: userAnswer.answerIndex
            });
            
            return shuffledAnswers;
          } else {
            // Quiz không có answerMapping - trả về answers gốc
            return answers.map((answer: { content: string; isCorrect?: boolean }) => ({
              content: answer.content,
              isCorrect: answer.isCorrect
            }));
          }
        })()
      };
    });

    // Tính điểm
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    // Update quiz với kết quả
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        userAnswers,
        score,
        completedAt: new Date(),
      },
    });

    // Tracking quiz completion
    try {
      // Chuyển đổi questions sang format phù hợp nếu cần
      const questions = Array.isArray(quiz.questions)
        ? quiz.questions.map((q: { topics?: string[] }) => ({ topics: q.topics || [] }))
        : [];
      // Gọi tracking
      await TrackingIntegrationService.trackQuizCompletion(
        quiz.userId,
        questions,
        correctCount,
        Math.max(1, Math.round((quiz.timeUsed || 0) / 60)) // luôn >= 1 phút
      );
    } catch (err) {
      console.error('Error tracking quiz completion:', err);
    }

    return withCORS(NextResponse.json({
      quiz: updatedQuiz,
      questions: questionsWithCorrectAnswers,
      score,
      correctCount,
      totalQuestions: quiz.questions.length
    }));
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return withCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 