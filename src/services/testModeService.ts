/**
 * testModeService.ts
 * Service for managing test mode interview functionality
 */

type TopicResponse = {
  topics: string[];
  error?: string;
};

type QuestionsResponse = {
  questions: string[];
  difficulty: string;
  targetSkills: string[];
  error?: string;
};

type ScoreResponse = {
  score: number;
  feedback: string;
  strengths: string[];
  improvementAreas: string[];
  suggestedAnswer: string;
  error?: string;
};

type InterviewData = {
  topic: string;
  question: string;
  answer: string;
  score: number;
  feedback?: string;
};

type AssessmentResponse = {
  overallScore: number;
  summary: string;
  technicalStrengths: string[];
  developmentAreas: string[];
  hiringRecommendation: string;
  recommendationRationale: string;
  feedbackForCandidate: string;
  error?: string;
};

/**
 * Extract technical topics from a job description
 */
export async function extractTopics(jobDescription: string): Promise<TopicResponse> {
  try {
    const response = await fetch('/api/test-mode/extract-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to extract topics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in extractTopics:', error);
    return { topics: [], error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

/**
 * Generate interview questions for a specific topic
 */
export async function generateQuestions(topic: string, level: string): Promise<QuestionsResponse> {
  try {
    const response = await fetch('/api/test-mode/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, level }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate questions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in generateQuestions:', error);
    return { 
      questions: [], 
      difficulty: '', 
      targetSkills: [],
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}

/**
 * Score a candidate's response to an interview question
 */
export async function scoreResponse(
  question: string, 
  userAnswer: string, 
  topic: string, 
  level: string
): Promise<ScoreResponse> {
  try {
    const response = await fetch('/api/test-mode/score-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userAnswer, topic, level }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to score response');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in scoreResponse:', error);
    return { 
      score: 0, 
      feedback: 'Error evaluating answer', 
      strengths: [], 
      improvementAreas: [],
      suggestedAnswer: '',
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}

/**
 * Generate a final assessment based on all interview responses
 */
export async function getFinalAssessment(
  interviewData: InterviewData[], 
  level: string, 
  candidateName?: string
): Promise<AssessmentResponse> {
  try {
    const response = await fetch('/api/test-mode/final-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewData, level, candidateName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate assessment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getFinalAssessment:', error);
    return { 
      overallScore: 0, 
      summary: 'Error generating assessment', 
      technicalStrengths: [], 
      developmentAreas: [],
      hiringRecommendation: 'No data',
      recommendationRationale: 'Unable to provide recommendation due to error',
      feedbackForCandidate: 'Assessment could not be generated',
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}
