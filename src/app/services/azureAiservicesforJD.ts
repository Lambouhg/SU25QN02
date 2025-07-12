import { AzureOpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Hằng số cho dịch vụ Azure OpenAI
const AZURE_OPENAI_KEY = process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = "2024-04-01-preview";

// Khởi tạo SDK client
export const getOpenAIClient = (): AzureOpenAI => {
  return new AzureOpenAI({
    apiKey: AZURE_OPENAI_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: AZURE_OPENAI_API_VERSION,
    deployment: AZURE_OPENAI_DEPLOYMENT,
    dangerouslyAllowBrowser: true, // Cho phép chạy trong trình duyệt - lưu ý bảo mật
  });
};

// Hàm validate nội dung
const validateContent = (content: string): string => {
  if (!content || content.trim().length === 0) {
    throw new Error("Content cannot be empty");
  }
  return content.trim();
};

// Hàm gọi Azure OpenAI API để lấy câu trả lời
export const getAIResponse = async (
  userMessage: string,
  conversationHistory: string[] = [],
  options: { retries?: number; delay?: number } = {},
  retries: number = 3,
  delay: number = 60000 // 60 giây
): Promise<string> => {
  try {
    // Tạo system prompt
    const systemPrompt = `Bạn là một chuyên gia tuyển dụng với nhiều năm kinh nghiệm. Nhiệm vụ của bạn là tạo ra các câu hỏi phỏng vấn chất lượng cao dựa trên mô tả công việc được cung cấp.

Quy tắc tạo câu hỏi:
1. Tạo câu hỏi phù hợp với loại được yêu cầu (technical hoặc behavioral)
2. Câu hỏi phải liên quan trực tiếp đến công việc được mô tả
3. Mỗi câu hỏi phải rõ ràng, cụ thể và có thể đánh giá được
4. Tạo đúng 10 câu hỏi
5. Trả về dưới dạng danh sách, mỗi câu hỏi trên một dòng
6. Không cần đánh số thứ tự, chỉ cần dấu gạch đầu dòng (-)

Ví dụ format trả về:
- Câu hỏi 1
- Câu hỏi 2
- Câu hỏi 3`;

    // Tạo messages array
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg, index) => ({
        role: (index % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: validateContent(msg)
      })),
      { role: "user", content: validateContent(userMessage) },
    ];

    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      messages: messages,
      model: AZURE_OPENAI_DEPLOYMENT!,
      temperature: 0.7,
      max_completion_tokens: 2000,
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message?.content?.trim() || ""; // Câu hỏi được AI trả về
    } else {
      throw new Error("API response format not as expected");
    }
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number };
    if (errorObj.statusCode === 429 && retries > 0) {
      // Nếu gặp lỗi 429, thử lại sau 60 giây
      console.log(`Rate limit exceeded. Retrying... ${retries} attempts left.`);
      await new Promise(resolve => setTimeout(resolve, delay)); // Chờ 60 giây
      return getAIResponse(userMessage, conversationHistory, options, retries - 1, delay); // Thử lại
    }

    console.error("Error calling Azure OpenAI:", error);
    throw error; // Ném lỗi ra ngoài nếu không có retries
  }
};
