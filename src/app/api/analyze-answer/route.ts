import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '../../services/azureAiservicesforJD';

export async function POST(req: NextRequest) {
  try {
    const { question, answer, type } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Tạo prompt để AI phân tích câu trả lời
    const analysisPrompt = `
Analyze this interview answer and provide detailed feedback:

QUESTION: ${question}
ANSWER: ${answer}
QUESTION TYPE: ${type}

Please provide feedback in the following format:

STRENGTHS:
- [List 2-3 specific strengths of the answer]

AREAS FOR IMPROVEMENT:
- [List 2-3 specific areas that could be improved]

OVERALL SCORE: [Give a score from 1-10]

SUGGESTIONS:
- [Provide 2-3 specific suggestions for improvement]

SAMPLE IMPROVED ANSWER:
[Provide a brief example of how the answer could be enhanced]

Keep the feedback constructive, specific, and actionable. Focus on content, structure, clarity, and relevance to the question.
    `;

    const feedback = await getAIResponse(analysisPrompt, ['analysis']);

    return NextResponse.json({ 
      feedback: feedback,
      success: true 
    });

  } catch (error) {
    console.error('Error analyzing answer:', error);
    return NextResponse.json(
      { error: 'Failed to analyze answer. Please try again.' },
      { status: 500 }
    );
  }
}