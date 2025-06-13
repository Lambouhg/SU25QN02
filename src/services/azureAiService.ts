// src/services/azureAiService.ts
import { ChatMessage, callOpenAI } from './openaiService';

export interface InterviewConfig {
  field: string;
  level: string;
  language: string;
}

interface InterviewResponse {
  answer: string;
  feedback?: string;
  currentTopic?: string;
  followUpQuestion?: string;
}

export async function processInterviewResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  language: string = 'en-US'
): Promise<InterviewResponse> {
  try {
    // Get the field and level from the conversation history
    const systemMessage = conversationHistory.find(msg => msg.role === 'system');
    let field = 'software development';
    let level = 'mid-level';

    // Try to extract field and level from system message if available
    if (systemMessage?.content) {
      const content = systemMessage.content;
      const fieldMatch = content.match(/position for a (.*?) position/);
      const levelMatch = content.match(/position at (.*?) level/);
      if (fieldMatch?.[1]) field = fieldMatch[1];
      if (levelMatch?.[1]) level = levelMatch[1];
    }

    // Create messages array with system prompt and conversation history
    const messages: ChatMessage[] = [
      { role: 'system', content: generateSystemPrompt(field, level, language) },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Call Azure OpenAI
    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(response.choices[0].message.content);
    } catch {
      // If not JSON, treat the entire response as a plain text answer
      const plainTextResponse = response.choices[0].message.content;
      result = {
        answer: plainTextResponse,
        feedback: undefined,
        currentTopic: undefined,
        shouldMoveToNewTopic: false,
        followUpQuestion: undefined
      };
    }

    // Construct the response
    let finalAnswer = result.answer;

    // Add feedback if provided
    if (result.feedback) {
      finalAnswer = `${result.feedback}\n\n${finalAnswer}`;
    }

    // Add follow-up question if provided and we're not moving to a new topic
    if (result.followUpQuestion && !result.shouldMoveToNewTopic) {
      finalAnswer = `${finalAnswer}\n\n${result.followUpQuestion}`;
    }

    return {
      answer: finalAnswer,
      currentTopic: result.currentTopic,
      feedback: result.feedback,
      followUpQuestion: result.followUpQuestion
    };

  } catch (error) {
    console.error('Error processing interview response:', error);
    // Return a graceful error response
    const errorMessage = {
      vi: 'Xin lỗi, tôi gặp lỗi khi xử lý câu trả lời của bạn. Vui lòng thử lại.',
      en: 'I apologize, but I encountered an error processing your response. Could you please try again?'
    };
    
    return {
      answer: language === 'vi-VN' ? errorMessage.vi : errorMessage.en
    };
  }
}

const generateSystemPrompt = (field: string, level: string, language: string) => `
You are an AI interviewer conducting a technical interview for a ${field} position at ${level} level. 
IMPORTANT: You must ONLY respond in ${language === 'vi-VN' ? 'Vietnamese' : 'English'} language.

Your role is to:
1. Focus on one topic/question at a time, specifically relevant to ${field} development
2. Listen carefully to the candidate's response
3. Provide immediate feedback or follow-up on their current answer
4. Adjust the technical depth based on the ${level} level
5. Move to a new topic only when the current one is thoroughly discussed
6. ALWAYS communicate in ${language === 'vi-VN' ? 'Vietnamese' : 'English'} - this is mandatory
7. ALWAYS format your response as a valid JSON object

Response format must be:
{
  "answer": "Your direct response or ONE specific question in ${language === 'vi-VN' ? 'Vietnamese' : 'English'}",
  "feedback": "Brief constructive feedback on their answer (if applicable)",
  "currentTopic": "The current topic being discussed",
  "shouldMoveToNewTopic": boolean,
  "followUpQuestion": "Optional follow-up question - use ONLY if their answer requires clarification"
}

Remember:
- Each response should contain only ONE main question
- Do not ask multiple questions in the same response
- Wait for the candidate's answer before asking follow-up questions
- Focus on getting a complete answer for one concept before moving to another

For Junior level: Focus on fundamental concepts and basic practical skills
For Mid-level: Include system design and advanced technical concepts
For Senior/Lead level: Deep dive into architecture decisions and leadership scenarios`;

export async function startInterview(config: InterviewConfig): Promise<InterviewResponse> {
  try {
    const systemPrompt = generateSystemPrompt(config.field, config.level, config.language);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: config.language === 'vi-VN'
          ? 'Bắt đầu cuộc phỏng vấn bằng tiếng Việt.'
          : 'Start the interview in English.'
      }
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    const result = JSON.parse(response.choices[0].message.content);
    return {
      answer: result.answer,
      followUpQuestion: undefined,
      feedback: undefined,
      currentTopic: undefined
    };

  } catch (error) {
    console.error('Error starting interview:', error);
    return {
      answer: config.language === 'vi-VN' 
        ? `Xin chào! Tôi là người phỏng vấn AI cho vị trí ${config.field} cấp độ ${config.level}. Bạn có thể giới thiệu về kinh nghiệm và kỹ năng của bạn trong lĩnh vực này không?` 
        : `Hello! I am your AI interviewer for the ${config.level} ${config.field} position. Could you tell me about your experience and skills in this field?`
    };
  }
}