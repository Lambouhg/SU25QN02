import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userAnswers } = await req.json();
    const { quizId } = await params;

    // Lấy quiz với questions gốc (có isCorrect)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    }) as any; // Cast to any to access answerMapping

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Tính điểm server-side
    let correctCount = 0;
    const questionsWithCorrectAnswers = quiz.questions.map((question: any) => {
      const userAnswer = userAnswers.find((a: any) => a.questionId === question.id);
      const answers = question.answers as any[];
      
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

      let originalSelectedIndexes: number[];

      if (mapping.length > 0) {
        // Quiz có answerMapping (secure quiz hoặc retry quiz) - cần chuyển đổi vị trí
        // mapping[originalIndex] = newIndex, nên để tìm originalIndex từ newIndex: tìm index của newIndex trong mapping
        originalSelectedIndexes = userAnswer.answerIndex.map(
          (shuffledIndex: number) => mapping.findIndex((value: number) => value === shuffledIndex)
        ).filter((idx: number) => idx !== -1);
      } else {
        // Quiz không có answerMapping (quiz thường) - sử dụng trực tiếp
        originalSelectedIndexes = userAnswer.answerIndex;
      }

      // Tính toán đáp án đúng từ vị trí gốc
      const correctIndexes = answers
        .map((answer: any, idx: number) => answer.isCorrect ? idx : -1)
        .filter((idx: number) => idx !== -1);

      // Kiểm tra đáp án đúng - sắp xếp cả hai mảng để so sánh chính xác
      const sortedSelected = [...originalSelectedIndexes].sort();
      const sortedCorrect = [...correctIndexes].sort();
      const isCorrect = (
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((idx: number, i: number) => idx === sortedCorrect[i])
      );

      if (isCorrect) {
        correctCount++;
      }

      // Trả về câu hỏi với đáp án đúng và kết quả
      return {
        ...question,
        userSelectedIndexes: userAnswer.answerIndex,
        isCorrect
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
        ? quiz.questions.map((q: any) => ({ topics: q.topics || [] }))
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

    return NextResponse.json({
      quiz: updatedQuiz,
      questions: questionsWithCorrectAnswers,
      score,
      correctCount,
      totalQuestions: quiz.questions.length
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 