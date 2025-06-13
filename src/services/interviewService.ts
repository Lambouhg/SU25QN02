import { callOpenAI, ChatMessage } from './openaiService';

/**
 * Phân tích đoạn giới thiệu để trích xuất các chủ đề chính
 */
export const extractTopics = async (introduction: string) => {
  const prompt = `Hãy phân tích đoạn text sau và xác định xem đây có phải là lời giới thiệu bản thân và kinh nghiệm làm việc không. Nếu không phải, trả về JSON object với isIntroduction: false. Nếu đúng là giới thiệu, trả về JSON object với format:

  {
    "isIntroduction": boolean, // true nếu là lời giới thiệu, false nếu không
    "skills": string[], // Các kỹ năng kỹ thuật
    "experience": string[], // Các kinh nghiệm làm việc
    "projects": string[], // Các dự án đã làm
    "education": string[], // Thông tin học vấn
    "softSkills": string[] // Các kỹ năng mềm
  }

  Text cần phân tích:
  ${introduction}`;
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: "Trả về kết quả dưới dạng JSON object với các trường như mô tả" },
      { role: "user", content: prompt }
    ];
    const response = await callOpenAI(messages);
    const result = JSON.parse(response.choices[0].message.content.trim());
    if (!result.isIntroduction) {
      return [];
    }
    const allTopics = [
      ...(result.skills || []),
      ...(result.experience || []),
      ...(result.projects || []),
      ...(result.education || []),
      ...(result.softSkills || [])
    ];
    const uniqueTopics = allTopics.filter((item, index) => allTopics.indexOf(item) === index);
    return uniqueTopics;
  } catch (error) {
    console.error('Error extracting topics:', error);
    return [];
  }
};

/**
 * Tạo danh sách câu hỏi cho một chủ đề (chỉ lấy danh sách, không hỏi 1 lần 5 câu)
 */
export const generateQuestionsForTopic = async (topic: string) => {
  const systemPrompt = `Bạn là một nhà tuyển dụng kỹ thuật đang phỏng vấn ứng viên về chủ đề "${topic}". Hãy tạo ra 5 câu hỏi phỏng vấn theo thứ tự từ cơ bản đến nâng cao, mỗi câu hỏi nên ngắn gọn, rõ ràng và thực tế. Trả về JSON object:
{
  "questions": string[]
}`;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Hãy bắt đầu tạo danh sách câu hỏi.` }
  ];
  try {
    const response = await callOpenAI(messages);
    if (response.choices && response.choices.length > 0) {
      const text = response.choices[0].message.content.trim();
      const result = JSON.parse(text);
      if (!result.questions || !Array.isArray(result.questions)) {
        console.error('Invalid questions format received from AI:', result);
        return [];
      }
      return result.questions;
    } else {
      console.error("Unexpected API response format for question generation:", response);
      return [];
    }
  } catch (error) {
    console.error('Error generating questions for topic:', error);
    return [`Could not generate questions for ${topic}.`];
  }
};

/**
 * Gửi prompt để AI hỏi từng câu, nhận xét, hỏi sâu hoặc chuyển câu tiếp theo
 */
export const getNextInterviewStep = async (context: {
  currentQuestion: string,
  previousAnswers: string[],
  lastUserAnswer?: string,
  position?: string,
  phase: 'ask' | 'feedback' | 'summary',
  allQuestions?: string[]
}) => {
  let prompt = '';
  if (context.phase === 'ask') {
    prompt = `Bạn đang phỏng vấn ứng viên cho vị trí${context.position ? ' ' + context.position : ''}. Hãy hỏi câu hỏi sau và chờ ứng viên trả lời: "${context.currentQuestion}". Nếu ứng viên trả lời rồi, hãy nhận xét ngắn gọn và hỏi sâu thêm nếu cần, hoặc chuyển sang câu tiếp theo.`;
  } else if (context.phase === 'feedback') {
    prompt = `Ứng viên vừa trả lời: "${context.lastUserAnswer}" cho câu hỏi: "${context.currentQuestion}". Hãy nhận xét ngắn gọn (1-2 câu), nếu cần thì hỏi sâu thêm, nếu không thì chuyển sang câu tiếp theo.`;
  } else if (context.phase === 'summary') {
    prompt = `Dưới đây là toàn bộ câu trả lời của ứng viên cho các câu hỏi: ${JSON.stringify(context.allQuestions)}\n\nCâu trả lời: ${JSON.stringify(context.previousAnswers)}\n\nHãy tổng kết buổi phỏng vấn, nêu điểm mạnh, điểm yếu, và đề xuất cải thiện.`;
  }
  const messages: ChatMessage[] = [
    { role: "system", content: "Bạn là nhà tuyển dụng kỹ thuật, hãy giao tiếp tự nhiên, thân thiện, hỏi từng câu, nhận xét ngắn gọn, hỏi sâu nếu cần, và tổng kết cuối buổi." },
    { role: "user", content: prompt }
  ];
  try {
    const response = await callOpenAI(messages);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in interview step:', error);
    return 'Xin lỗi, đã có lỗi xảy ra khi phỏng vấn.';
  }
};

/**
 * Kiểm tra câu trả lời có đầy đủ không
 */
export const evaluateAnswer = async (question: string, answer: string) => {
  const prompt = `Hãy đánh giá câu trả lời sau cho câu hỏi "${question}":\n  ${answer}\n  \n  Trả về JSON object với format:\n  {\n    \"isComplete\": boolean, // Câu trả lời có đầy đủ không\n    \"score\": number, // Điểm số từ 0-10\n    \"strengths\": string[], // Các điểm mạnh trong câu trả lời\n    \"weaknesses\": string[], // Các điểm yếu cần cải thiện\n    \"missingPoints\": string[], // Các điểm chưa được đề cập\n    \"feedback\": string, // Phản hồi chi tiết\n    \"suggestedImprovements\": string[], // Các đề xuất cải thiện\n    \"followUpQuestions\": string[] // Các câu hỏi tiếp theo có thể hỏi\n  }`;
  try {    const messages: ChatMessage[] = [
      { role: "system", content: "Trả về kết quả dưới dạng JSON object với các trường như mô tả" },
      { role: "user", content: prompt }
    ];
    const response = await callOpenAI(messages);
    const evaluation = JSON.parse(response.choices[0].message.content.trim());
    return {
      isComplete: evaluation.isComplete || false,
      score: evaluation.score || 0,
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      missingPoints: evaluation.missingPoints || [],
      feedback: evaluation.feedback || "Không có phản hồi chi tiết",
      suggestedImprovements: evaluation.suggestedImprovements || [],
      followUpQuestions: evaluation.followUpQuestions || []
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      isComplete: false,
      score: 0,
      strengths: [],
      weaknesses: ["Không thể đánh giá câu trả lời"],
      missingPoints: [],
      feedback: "Có lỗi xảy ra khi đánh giá câu trả lời",
      suggestedImprovements: [],
      followUpQuestions: []
    };
  }
};
