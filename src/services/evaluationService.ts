import { ChatMessage, callOpenAI } from './openaiService';
import { InterviewEvaluation } from './Avatar-AI';

export async function generateInterviewEvaluation(
  conversation: ChatMessage[],
  field: string,
  level: string,
  language: 'vi-VN' | 'en-US'
): Promise<InterviewEvaluation> {
  try {
    const prompt = `You are an expert technical interviewer reviewing a candidate interview for a ${level} ${field} position.
Based on the conversation history, provide a comprehensive evaluation in ${language === 'vi-VN' ? 'Vietnamese' : 'English'}.

Please analyze:
1. Technical competency
2. Communication skills
3. Problem-solving ability
4. Cultural fit
5. Overall potential

Format the response as a JSON object with the following structure:
{
  "technicalScore": number (1-10),
  "communicationScore": number (1-10),
  "problemSolvingScore": number (1-10),
  "cultureFitScore": number (1-10),
  "overallRating": number (1-10),
  "technicalStrengths": string[],
  "technicalWeaknesses": string[],
  "recommendations": string[],
  "hiringRecommendation": "strong_hire" | "hire" | "consider" | "reject",
  "detailedFeedback": {
    "technical": string,
    "softSkills": string,
    "experience": string,
    "potential": string
  },
  "salary_range": {
    "min": number,
    "max": number,
    "currency": string
  }
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: prompt },
      ...conversation
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    let content = response.choices[0].message.content.trim();
    
    
    
    // Remove any markdown formatting if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to find JSON object if there's additional text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    // If content doesn't look like JSON, return default evaluation
    if (!content.startsWith('{') || !content.endsWith('}')) {
      console.warn('AI returned non-JSON response, using default evaluation');
      return {
        technicalScore: 5,
        communicationScore: 5,
        problemSolvingScore: 5,
        cultureFitScore: 5,
        overallRating: 5,
        technicalStrengths: [language === 'vi-VN' ? 'Cần đánh giá thêm' : 'Needs further assessment'],
        technicalWeaknesses: [language === 'vi-VN' ? 'Không thể đánh giá' : 'Unable to assess'],
        recommendations: [language === 'vi-VN' ? 'Tiến hành phỏng vấn lại' : 'Consider re-interview'],
        hiringRecommendation: 'consider' as const,
        detailedFeedback: {
          technical: language === 'vi-VN' ? 'AI trả về định dạng không hợp lệ' : 'AI returned invalid format',
          softSkills: language === 'vi-VN' ? 'AI trả về định dạng không hợp lệ' : 'AI returned invalid format',
          experience: language === 'vi-VN' ? 'AI trả về định dạng không hợp lệ' : 'AI returned invalid format',
          potential: language === 'vi-VN' ? 'AI trả về định dạng không hợp lệ' : 'AI returned invalid format'
        },
        salary_range: {
          min: 10000000,
          max: 20000000,
          currency: 'VND'
        }
      };
    }

    const evaluation = JSON.parse(content);
    
    return evaluation as InterviewEvaluation;
  } catch (error) {
    console.error('Error generating interview evaluation:', error);
    
    // Return a default evaluation if any error occurs
    return {
      technicalScore: 5,
      communicationScore: 5,
      problemSolvingScore: 5,
      cultureFitScore: 5,
      overallRating: 5,
      technicalStrengths: [language === 'vi-VN' ? 'Lỗi trong quá trình đánh giá' : 'Error during evaluation'],
      technicalWeaknesses: [language === 'vi-VN' ? 'Không thể đánh giá do lỗi' : 'Unable to assess due to error'],
      recommendations: [language === 'vi-VN' ? 'Tiến hành phỏng vấn lại' : 'Consider re-interview'],
      hiringRecommendation: 'consider' as const,
      detailedFeedback: {
        technical: language === 'vi-VN' ? 'Lỗi trong quá trình đánh giá' : 'Error during evaluation',
        softSkills: language === 'vi-VN' ? 'Lỗi trong quá trình đánh giá' : 'Error during evaluation',
        experience: language === 'vi-VN' ? 'Lỗi trong quá trình đánh giá' : 'Error during evaluation',
        potential: language === 'vi-VN' ? 'Lỗi trong quá trình đánh giá' : 'Error during evaluation'
      },
      salary_range: {
        min: 10000000,
        max: 20000000,
        currency: 'VND'
      }
    };
  }
}
