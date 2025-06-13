import { callOpenAI } from './openaiService';

// Trích xuất các chủ đề EQ từ đoạn giới thiệu (có thể mở rộng sau)
export const extractEQTopics = async (introduction: string) => {
  // Đơn giản trả về các chủ đề EQ mẫu
  return [
    'Xử lý xung đột',
    'Quản lý cảm xúc',
    'Làm việc nhóm',
    'Đồng cảm',
    'Thích nghi',
    'Giao tiếp',
    'Giải quyết vấn đề',
    'Tư duy tích cực'
  ];
};

// Sinh câu hỏi EQ cho một chủ đề
export const generateEQQuestionsForTopic = async (topic: string) => {
  const prompt = `Bạn là chuyên gia tâm lý. Hãy tạo 3 câu hỏi phỏng vấn EQ về chủ đề "${topic}". Trả về JSON object:\n{ \"questions\": string[] }`;
  const messages = [
    { role: 'system' as const, content: 'Bạn là chuyên gia tâm lý, giúp tạo câu hỏi phỏng vấn EQ.' },
    { role: 'user' as const, content: prompt }
  ];
  try {
    const response = await callOpenAI(messages);
    // response.choices[0].message.content chứa kết quả
    const result = JSON.parse(response.choices[0].message.content);
    return result.questions || [];
  } catch (error) {
    console.error('Error generating EQ questions:', error);
    return [];
  }
};

// Đánh giá câu trả lời EQ
export const evaluateEQAnswer = async (question: string, answer: string) => {
  const prompt = `Hãy đánh giá câu trả lời sau cho câu hỏi EQ: \"${question}\"\n${answer}\nTrả về JSON object:\n{\n  \"isComplete\": boolean,\n  \"score\": number, // 0-10\n  \"feedback\": string,\n  \"followUpQuestions\": string[]\n}`;
  const messages = [
    { role: 'system' as const, content: 'Bạn là chuyên gia tâm lý, giúp đánh giá câu trả lời EQ.' },
    { role: 'user' as const, content: prompt }
  ];
  try {
    const response = await callOpenAI(messages);
    const evaluation = JSON.parse(response.choices[0].message.content);
    return {
      isComplete: evaluation.isComplete || false,
      score: evaluation.score || 0,
      feedback: evaluation.feedback || '',
      followUpQuestions: evaluation.followUpQuestions || []
    };
  } catch (error) {
    console.error('Error evaluating EQ answer:', error);
    return {
      isComplete: false,
      score: 0,
      feedback: 'Có lỗi xảy ra khi đánh giá câu trả lời',
      followUpQuestions: []
    };
  }
};
