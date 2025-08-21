import { ChatMessage } from './openaiService';

export interface QuestionBankQuestion {
  id: string;
  question: string;
  answers: Array<{
    content: string;
    isCorrect: boolean;
  }>;
  fields: string[];
  topics: string[];
  levels: string[];
  explanation?: string;
}

export interface QuestionBankFilter {
  field?: string;
  topic?: string;
  level?: string;
  limit?: number;
  excludeIds?: string[];
}

/**
 * Lấy câu hỏi từ question bank dựa trên filter
 */
export async function getQuestionsFromBank(filter: QuestionBankFilter): Promise<QuestionBankQuestion[]> {
  try {
    const params = new URLSearchParams();
    
    if (filter.field) {
      params.append('field', filter.field);
    }
    
    if (filter.topic) {
      params.append('topic', filter.topic);
    }
    
    if (filter.level) {
      params.append('level', filter.level);
    }
    
    if (filter.limit) {
      params.append('limit', filter.limit.toString());
    }

    const response = await fetch(`/api/questions?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching questions from bank:', error);
    return [];
  }
}

/**
 * Chuyển đổi câu hỏi từ question bank thành format phù hợp cho AI interview
 */
export function convertQuestionForInterview(question: QuestionBankQuestion): string {
  const options = question.answers.map((answer, index) => {
    const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
    return `${optionLetter}. ${answer.content}`;
  }).join('\n');

  const correctAnswers = question.answers
    .map((answer, index) => answer.isCorrect ? String.fromCharCode(65 + index) : null)
    .filter(Boolean)
    .join(', ');

  return `Question: ${question.question}

Options:
${options}

Correct Answer(s): ${correctAnswers}

Explanation: ${question.explanation || 'No explanation provided'}

---
`;
}

/**
 * Tạo context cho AI interview sử dụng question bank
 */
export async function createInterviewContextWithQuestionBank(
  field: string,
  level: string,
  topic?: string,
  questionCount: number = 4
): Promise<{
  questions: QuestionBankQuestion[];
  contextPrompt: string;
  usedQuestionIds: string[];
}> {
  try {
    // Sử dụng API endpoint để lấy context
    const response = await fetch('/api/questions/interview-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field,
        level,
        topic,
        questionCount
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch interview context');
    }

    const data = await response.json();
    return {
      questions: data.questions || [],
      contextPrompt: data.contextPrompt || '',
      usedQuestionIds: data.usedQuestionIds || []
    };
  } catch (error) {
    console.error('Error creating interview context:', error);
    throw error;
  }
}

/**
 * Tạo system message cho AI với question bank context
 */
export async function createSystemMessageWithQuestionBank(
  field: string,
  level: string,
  topic?: string,
  language: 'vi-VN' | 'en-US' = 'en-US',
  questionCount: number = 4
): Promise<ChatMessage> {
  const { contextPrompt } = await createInterviewContextWithQuestionBank(
    field,
    level,
    topic,
    questionCount
  );

  const languageInstruction = language === 'vi-VN' 
    ? 'IMPORTANT: ONLY respond in Vietnamese.'
    : 'IMPORTANT: ONLY respond in English.';

  return {
    role: 'system',
    content: `${contextPrompt}

${languageInstruction}

RESPONSE FORMAT:
Return responses in this exact JSON structure:
{
  "answer": "Your response or question in NATURAL, PROFESSIONAL tone",
  "currentTopic": "Current topic being discussed",
  "nextTopic": "Next planned topic if needed",
  "shouldMoveToNewTopic": boolean,
  "followUpQuestion": "Optional follow-up for clarification",
  "interviewProgress": number (0-100),
  "isInterviewComplete": boolean,
  "currentScore": number (1-10),
  "questionCount": number,
  "completionDetails": {
    "coveredTopics": ["topics", "covered", "so far"],
    "skillAssessment": {
      "technical": number (1-10),
      "communication": number (1-10),
      "problemSolving": number (1-10)
    }
  }
}`
  };
}

/**
 * Lấy thống kê về question bank
 */
export async function getQuestionBankStats(): Promise<{
  totalQuestions: number;
  fields: string[];
  topics: string[];
  levels: string[];
  fieldStats: Array<{ field: string; count: number }>;
  topicStats: Array<{ topic: string; count: number }>;
  levelStats: Array<{ level: string; count: number }>;
}> {
  try {
    const response = await fetch('/api/questions/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch question bank stats');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting question bank stats:', error);
    return {
      totalQuestions: 0,
      fields: [],
      topics: [],
      levels: [],
      fieldStats: [],
      topicStats: [],
      levelStats: []
    };
  }
}
