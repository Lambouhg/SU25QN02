import { getAIResponse, getOpenAIClient } from './openaiService';

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
  const prompt = `Bạn là chuyên gia tâm lý. Hãy tạo 3 câu hỏi phỏng vấn EQ về chủ đề "${topic}". Trả về JSON object:
  { "questions": string[] }`;
  try {
    const response = await getAIResponse(prompt, [], {
      instruction: 'Trả về kết quả dưới dạng JSON object với trường questions.'
    });
    const result = JSON.parse(response);
    return result.questions || [];
  } catch (error) {
    console.error('Error generating EQ questions:', error);
    return [];
  }
};

// Đánh giá câu trả lời EQ
export const evaluateEQAnswer = async (question: string, answer: string) => {
  const prompt = `Hãy đánh giá câu trả lời sau cho câu hỏi EQ: "${question}"
${answer}
Trả về JSON object:
{
  "isComplete": boolean,
  "score": number, // 0-10
  "feedback": string,
  "followUpQuestions": string[]
}`;
  try {
    const response = await getAIResponse(prompt, [], {
      instruction: 'Trả về kết quả dưới dạng JSON object.'
    });
    const evaluation = JSON.parse(response);
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
