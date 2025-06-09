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
 * Tạo danh sách câu hỏi cho một chủ đề
 */
export const generateQuestionsForTopic = async (topic: string) => {
  const systemPromptForQuestionGeneration = `Bạn là một chuyên gia phỏng vấn kỹ thuật. Nhiệm vụ của bạn là tạo ra 5 câu hỏi phỏng vấn về chủ đề "${topic}". \n\n  Yêu cầu:\n  1. Câu hỏi đầu tiên nên là câu hỏi cơ bản để đánh giá kiến thức nền tảng\n  2. Câu hỏi thứ hai nên tập trung vào kinh nghiệm thực tế\n  3. Câu hỏi thứ ba nên là tình huống thực tế hoặc case study\n  4. Câu hỏi thứ tư nên đánh giá khả năng giải quyết vấn đề\n  5. Câu hỏi cuối cùng nên là câu hỏi nâng cao về chủ đề\n\n  Trả về JSON object với format:\n  {\n    \"questions\": string[], // Mảng các câu hỏi\n    \"expectedKeywords\": string[], // Các từ khóa quan trọng cần có trong câu trả lời\n    \"difficultyLevel\": \"basic\" | \"intermediate\" | \"advanced\" // Độ khó của chủ đề\n  }`;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPromptForQuestionGeneration },
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
