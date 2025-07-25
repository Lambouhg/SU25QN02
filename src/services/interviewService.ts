import { callOpenAI, ChatMessage } from './openaiService';

/**
 * Analyze the introduction to extract main topics
 */
export const extractTopics = async (introduction: string) => {
  const prompt = `Analyze the following text and determine if it is a self-introduction and work experience. If not, return a JSON object with isIntroduction: false. If it is an introduction, return a JSON object with the format:

  {
    "isIntroduction": boolean, // true if it is an introduction, false otherwise
    "skills": string[], // Technical skills
    "experience": string[], // Work experiences
    "projects": string[], // Projects done
    "education": string[], // Education information
    "softSkills": string[] // Soft skills
  }

  Text to analyze:
  ${introduction}`;
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: "Return the result as a JSON object with the described fields" },
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
 * Generate a list of questions for a topic (5 questions, from basic to advanced)
 */
export const generateQuestionsForTopic = async (topic: string, level?: string) => {
  const levelText = level ? ` at the ${level} level` : '';
  const systemPrompt = `You are a technical interviewer interviewing a candidate on the topic of "${topic}"${levelText}. Generate 5 interview questions in order from basic to advanced. Each question should be concise, clear, and practical. Return a JSON object:
{
  "questions": string[]
}`;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Please generate the list of questions.` }
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
 * Send prompt for AI to ask each question, give feedback, ask follow-ups, or move to next question
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
    prompt = `You are interviewing a candidate for the position${context.position ? ' ' + context.position : ''}. Ask the following question and wait for the candidate's answer: "${context.currentQuestion}". If the candidate has already answered, give brief feedback and ask a follow-up if needed, or move to the next question.`;
  } else if (context.phase === 'feedback') {
    prompt = `The candidate just answered: "${context.lastUserAnswer}" for the question: "${context.currentQuestion}". Give brief feedback (1-2 sentences), ask a follow-up if needed, otherwise move to the next question.`;
  } else if (context.phase === 'summary') {
    prompt = `Below are all the candidate's answers to the questions: ${JSON.stringify(context.allQuestions)}\n\nAnswers: ${JSON.stringify(context.previousAnswers)}\n\nSummarize the interview, highlight strengths, weaknesses, and suggest improvements.`;
  }
  const messages: ChatMessage[] = [
    { role: "system", content: "You are a technical interviewer. Communicate naturally and friendly, ask one question at a time, give brief feedback, ask follow-ups if needed, and summarize at the end." },
    { role: "user", content: prompt }
  ];
  try {
    const response = await callOpenAI(messages);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in interview step:', error);
    return 'Sorry, an error occurred during the interview.';
  }
};

/**
 * Evaluate if the answer is complete
 */
export const evaluateAnswer = async (question: string, answer: string, historySummary?: string) => {
  const prompt = `Evaluate the following answer for the question "${question}":\n  ${answer}\n\nBelow is the history of previous questions and answers (if any):\n${historySummary || 'No history.'}\n\nWhen evaluating, refer to previous answers to avoid repeating concepts already answered, and do not ask the candidate to repeat definitions if already answered.\n\nReturn a JSON object with the format:\n  {\n    "isComplete": boolean, // Is the answer complete\n    "scores": {\n      "fundamental": number, // Fundamental knowledge (0-10)\n      "logic": number, // Logical reasoning (0-10)\n      "language": number // Language proficiency (0-10)\n    },\n    "suggestions": {\n      "fundamental": string,\n      "logic": string,\n      "language": string\n    },\n    "strengths": string[], // Strengths in the answer\n    "weaknesses": string[], // Weaknesses to improve\n    "missingPoints": string[], // Points not covered\n    "feedback": string, // Detailed feedback\n    "suggestedImprovements": string[], // Suggestions for improvement\n    "followUpQuestions": string[] // Possible follow-up questions\n  }`;
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: "Return the result as a JSON object with the described fields" },
      { role: "user", content: prompt }
    ];
    const response = await callOpenAI(messages);
    const evaluation = JSON.parse(response.choices[0].message.content.trim());
    // Detect irrelevant answer: if answer is too short, or scores are very low, or missingPoints covers all main points
    let isRelevant = true;
    if (
      typeof answer === 'string' && answer.trim().length < 10
    ) {
      isRelevant = false;
    } else if (
      evaluation.scores &&
      evaluation.scores.fundamental < 3 &&
      evaluation.scores.logic < 3 &&
      evaluation.scores.language < 3 &&
      (evaluation.missingPoints?.length ?? 0) > 0
    ) {
      isRelevant = false;
    }
    return {
      isComplete: evaluation.isComplete || false,
      scores: evaluation.scores || {
        fundamental: 0,
        logic: 0,
        language: 0
      },
      suggestions: evaluation.suggestions || {
        fundamental: '',
        logic: '',
        language: ''
      },
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      missingPoints: evaluation.missingPoints || [],
      feedback: evaluation.feedback || "No detailed feedback",
      suggestedImprovements: evaluation.suggestedImprovements || [],
      followUpQuestions: evaluation.followUpQuestions || [],
      isRelevant // Thêm trường này để TestPanel.tsx sử dụng
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      isComplete: false,
      scores: {
        fundamental: 0,
        logic: 0,
        language: 0
      },
      suggestions: {
        fundamental: '',
        logic: '',
        language: ''
      },
      strengths: [],
      weaknesses: ["Could not evaluate the answer"],
      missingPoints: [],
      feedback: "An error occurred while evaluating the answer",
      suggestedImprovements: [],
      followUpQuestions: []
    };
  }
};
