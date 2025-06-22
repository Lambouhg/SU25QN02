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

    const evaluation = JSON.parse(response.choices[0].message.content);
    
    return evaluation as InterviewEvaluation;
  } catch (error) {
    console.error('Error generating interview evaluation:', error);
    throw error;
  }
}
