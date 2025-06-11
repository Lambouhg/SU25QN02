import { AzureOpenAI } from "openai";

// Hằng số cho dịch vụ Azure OpenAI
const AZURE_OPENAI_KEY = process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT =
  process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT ;
const AZURE_OPENAI_API_VERSION = "2024-04-01-preview";

// Khởi tạo SDK client
export const getOpenAIClient = () => {
  return new AzureOpenAI({
    apiKey: AZURE_OPENAI_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: AZURE_OPENAI_API_VERSION,
    deployment: AZURE_OPENAI_DEPLOYMENT,
    dangerouslyAllowBrowser: true, // Cho phép chạy trong trình duyệt - lưu ý bảo mật
  });
};

/**
 * Gửi tin nhắn đến Azure OpenAI service và nhận phản hồi (câu hỏi từ JD)
 * @param {string} userMessage - Tin nhắn từ người dùng (JD)
 * @param {Array} conversationHistory - Lịch sử cuộc trò chuyện (nếu có)
 * @param {Object} options - Cấu hình bổ sung (vị trí ứng tuyển, kỹ năng,...)
 * @returns {Promise<string>} - Phản hồi từ AI (câu hỏi từ JD)
 */
export const getAIResponse = async (
  userMessage,
  conversationHistory = [],
  options = {},
  retries = 3, // Số lần thử lại khi gặp lỗi
  delay = 60000 // Thời gian chờ giữa các lần thử lại (60 giây)
) => {
  try {
    // Đảm bảo conversationHistory luôn là một mảng
    if (!Array.isArray(conversationHistory)) {
      conversationHistory = [];
    }    // Prompt mô tả yêu cầu cho AI
    const systemPrompts = {
      technical: {
        en: `You are an AI that generates technical interview questions based on the provided job description (JD).
             Use the JD to create ONLY clear, direct technical questions that assess the candidate's technical skills.
             
             IMPORTANT RULES:
             - Generate ONLY actual questions, not headers or categories
             - Each line must be a complete, standalone question
             - Questions should end with a question mark (?) or be actionable requests
             - Do not include category headers like "Knowledge of .NET" or section titles
             - Focus on specific technical skills mentioned in the JD
             - Each question should be specific and interview-ready
             
             Format: One question per line, numbered if needed.`,
        vi: `Bạn là một AI tạo câu hỏi phỏng vấn kỹ thuật dựa trên mô tả công việc (JD) được cung cấp.
             Sử dụng JD để tạo ra CHỈ những câu hỏi kỹ thuật rõ ràng, trực tiếp để đánh giá kỹ năng kỹ thuật của ứng viên.
             
             QUY TẮC QUAN TRỌNG:
             - Chỉ tạo ra những câu hỏi thực sự, không phải tiêu đề hoặc danh mục
             - Mỗi dòng phải là một câu hỏi hoàn chỉnh, độc lập
             - Câu hỏi nên kết thúc bằng dấu hỏi (?) hoặc là yêu cầu cụ thể
             - Không bao gồm tiêu đề danh mục như "Kiến thức về .NET" hay tiêu đề phần
             - Tập trung vào các kỹ năng kỹ thuật cụ thể được đề cập trong JD
             - Mỗi câu hỏi phải cụ thể và sẵn sàng cho phỏng vấn
             
             Định dạng: Một câu hỏi mỗi dòng, đánh số nếu cần.`,
      },
      behavioral: {
        en: `You are an AI that generates behavioral interview questions based on the provided job description (JD).
             Use the JD to create ONLY clear, direct behavioral questions that assess the candidate's soft skills.
             
             IMPORTANT RULES:
             - Generate ONLY actual questions, not headers or categories
             - Each line must be a complete, standalone question
             - Questions should assess behavioral competencies and soft skills
             - Do not include category headers or section titles
             - Focus on behaviors and situations relevant to the role
             - Each question should be specific and interview-ready
             
             Format: One question per line, numbered if needed.`,
        vi: `Bạn là một AI tạo câu hỏi phỏng vấn hành vi dựa trên mô tả công việc (JD) được cung cấp.
             Sử dụng JD để tạo ra CHỈ những câu hỏi hành vi rõ ràng, trực tiếp để đánh giá kỹ năng mềm của ứng viên.
             
             QUY TẮC QUAN TRỌNG:
             - Chỉ tạo ra những câu hỏi thực sự, không phải tiêu đề hoặc danh mục
             - Mỗi dòng phải là một câu hỏi hoàn chỉnh, độc lập
             - Câu hỏi nên đánh giá năng lực hành vi và kỹ năng mềm
             - Không bao gồm tiêu đề danh mục hoặc tiêu đề phần
             - Tập trung vào hành vi và tình huống liên quan đến vai trò
             - Mỗi câu hỏi phải cụ thể và sẵn sàng cho phỏng vấn
             
             Định dạng: Một câu hỏi mỗi dòng, đánh số nếu cần.`,
      },
    };

    const questionType = options.questionType || 'technical';
    const language = options.language || 'vi';
    const systemPrompt = systemPrompts[questionType][language];

    const validateContent = (content) => {
      if (typeof content !== 'string' || content.trim() === '') {
        return 'N/A'; // Default value for invalid content
      }
      return content;
    };

    const messages = [
      { role: "system", content: validateContent(systemPrompt) },
      ...conversationHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: validateContent(msg.text),
      })),
      { role: "user", content: validateContent(userMessage) },
    ];

    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      messages: messages,
      model: AZURE_OPENAI_DEPLOYMENT,
      temperature: 0.7,
      max_completion_tokens: 2000,
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content.trim(); // Câu hỏi được AI trả về
    } else {
      throw new Error("API response format not as expected");
    }
  } catch (error) {
    if (error.statusCode === 429 && retries > 0) {
      // Nếu gặp lỗi 429, thử lại sau 60 giây
      console.log(`Rate limit exceeded. Retrying... ${retries} attempts left.`);
      await new Promise(resolve => setTimeout(resolve, delay)); // Chờ 60 giây
      return getAIResponse(userMessage, conversationHistory, options, retries - 1, delay); // Thử lại
    }

    console.error("Error calling Azure OpenAI:", error);
    throw error; // Ném lỗi ra ngoài nếu không có retries
  }
};
