/**
 * useTestModeInterview.ts
 * Custom hook for managing test mode interview state and flow
 */

import { useState, useCallback } from 'react';
import { 
  extractTopics, 
  generateQuestions, 
  scoreResponse, 
  getFinalAssessment 
} from '@/services/testModeService';

export interface TopicData {
  name: string;
  selected: boolean;
}

interface InterviewQuestion {
  id: string;
  text: string;
}

interface InterviewAnswer {
  questionId: string;
  question: string;
  answer: string;
  topic: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvementAreas?: string[];
  suggestedAnswer?: string;
}

interface InterviewAssessment {
  overallScore: number;
  summary: string;
  technicalStrengths: string[];
  developmentAreas: string[];
  hiringRecommendation: string;
  recommendationRationale: string;
  feedbackForCandidate: string;
}

export type InterviewStep = 
  'input' | 
  'topics' | 
  'questions' | 
  'interview' |
  'feedback' | 
  'complete';

export default function useTestModeInterview() {
  // State variables
  const [step, setStep] = useState<InterviewStep>('input');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [candidateName, setCandidateName] = useState<string>('');
  const [positionLevel, setPositionLevel] = useState<string>('Mid-level');
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<InterviewAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper functions
  const resetError = () => setError(null);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Step 1: Process job description to extract topics
  const processJobDescription = useCallback(async () => {
    setLoading(true);
    resetError();

    try {
      if (!jobDescription.trim()) {
        throw new Error('Job description is required');
      }

      const result = await extractTopics(jobDescription);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.topics || result.topics.length === 0) {
        throw new Error('No topics could be extracted from the job description');
      }

      const topicsData: TopicData[] = result.topics.map(topic => ({
        name: topic,
        selected: false
      }));

      setTopics(topicsData);
      setStep('topics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process job description');
    } finally {
      setLoading(false);
    }
  }, [jobDescription]);

  // Toggle topic selection
  const toggleTopic = useCallback((topicName: string) => {
    setTopics(prev => 
      prev.map(topic => 
        topic.name === topicName 
          ? { ...topic, selected: !topic.selected }
          : topic
      )
    );
  }, []);

  // Step 2: Start interview with selected topics
  const startInterview = useCallback(async () => {
    setLoading(true);
    resetError();

    try {
      const selectedTopics = topics.filter(topic => topic.selected);
      
      if (selectedTopics.length === 0) {
        throw new Error('Please select at least one topic');
      }

      // Get first topic and generate questions for it
      const firstTopic = selectedTopics[0].name;
      setCurrentTopic(firstTopic);
      
      const questionsResult = await generateQuestions(firstTopic, positionLevel);
      
      if (questionsResult.error) {
        throw new Error(questionsResult.error);
      }
      
      if (!questionsResult.questions || questionsResult.questions.length === 0) {
        throw new Error('No questions could be generated for the selected topic');
      }

      // Set target skills
      setTargetSkills(questionsResult.targetSkills || []);
      
      // Format questions with IDs
      const formattedQuestions = questionsResult.questions.map(q => ({
        id: generateId(),
        text: q
      }));
      
      setQuestions(formattedQuestions);
      setCurrentQuestionIndex(0);
      setStep('interview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  }, [topics, positionLevel]);

  // Step 3: Submit an answer and get feedback
  const submitAnswer = useCallback(async (answer: string) => {
    setLoading(true);
    resetError();

    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      if (!currentQuestion) {
        throw new Error('No current question found');
      }

      // Score the response
      const scoreResult = await scoreResponse(
        currentQuestion.text,
        answer,
        currentTopic,
        positionLevel
      );
      
      if (scoreResult.error) {
        throw new Error(scoreResult.error);
      }

      // Add answer to the list
      const newAnswer: InterviewAnswer = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer,
        topic: currentTopic,
        score: scoreResult.score,
        feedback: scoreResult.feedback,
        strengths: scoreResult.strengths,
        improvementAreas: scoreResult.improvementAreas,
        suggestedAnswer: scoreResult.suggestedAnswer
      };
      
      setAnswers(prev => [...prev, newAnswer]);
      setStep('feedback');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  }, [questions, currentQuestionIndex, currentTopic, positionLevel]);

  // Move to next question or topic
  const nextQuestion = useCallback(async () => {
    setLoading(true);
    resetError();

    try {
      // Check if we have more questions for the current topic
      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question in current topic
        setCurrentQuestionIndex(prev => prev + 1);
        setStep('interview');
        setLoading(false);
        return;
      }
      
      // Check if we have more topics
      const selectedTopics = topics.filter(topic => topic.selected);
      const currentTopicIndex = selectedTopics.findIndex(t => t.name === currentTopic);
      
      if (currentTopicIndex < selectedTopics.length - 1) {
        // Move to next topic
        const nextTopic = selectedTopics[currentTopicIndex + 1].name;
        setCurrentTopic(nextTopic);
        
        // Generate questions for next topic
        const questionsResult = await generateQuestions(nextTopic, positionLevel);
        
        if (questionsResult.error) {
          throw new Error(questionsResult.error);
        }
        
        if (!questionsResult.questions || questionsResult.questions.length === 0) {
          throw new Error(`No questions could be generated for ${nextTopic}`);
        }
        
        // Format questions with IDs
        const formattedQuestions = questionsResult.questions.map(q => ({
          id: generateId(),
          text: q
        }));
        
        setQuestions(formattedQuestions);
        setCurrentQuestionIndex(0);
        setStep('interview');
      } else {
        // All topics completed, generate final assessment
        const assessmentData = answers.map(a => ({
          topic: a.topic,
          question: a.question,
          answer: a.answer,
          score: a.score || 0,
          feedback: a.feedback
        }));
        
        const assessmentResult = await getFinalAssessment(
          assessmentData,
          positionLevel,
          candidateName
        );
        
        if (assessmentResult.error) {
          throw new Error(assessmentResult.error);
        }
        
        setAssessment({
          overallScore: assessmentResult.overallScore,
          summary: assessmentResult.summary,
          technicalStrengths: assessmentResult.technicalStrengths,
          developmentAreas: assessmentResult.developmentAreas,
          hiringRecommendation: assessmentResult.hiringRecommendation,
          recommendationRationale: assessmentResult.recommendationRationale,
          feedbackForCandidate: assessmentResult.feedbackForCandidate
        });
        
        setStep('complete');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move to next question');
    } finally {
      setLoading(false);
    }
  }, [currentQuestionIndex, questions, topics, currentTopic, positionLevel, answers, candidateName]);

  // Reset the interview
  const resetInterview = useCallback(() => {
    setJobDescription('');
    setCandidateName('');
    setPositionLevel('Mid-level');
    setTopics([]);
    setCurrentTopic('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTargetSkills([]);
    setAssessment(null);
    setError(null);
    setStep('input');
  }, []);

  return {
    // State
    step,
    jobDescription,
    candidateName,
    positionLevel,
    topics,
    currentTopic,
    questions,
    currentQuestionIndex,
    currentQuestion: questions[currentQuestionIndex],
    answers,
    targetSkills,
    assessment,
    loading,
    error,
    
    // Progress info
    progress: {
      currentQuestion: currentQuestionIndex + 1,
      totalQuestions: questions.length,
      currentTopic,
      completedTopics: Array.from(new Set(answers.map(a => a.topic))).length,
      totalTopics: topics.filter(t => t.selected).length
    },
    
    // Actions
    setJobDescription,
    setCandidateName,
    setPositionLevel,
    toggleTopic,
    processJobDescription,
    startInterview,
    submitAnswer,
    nextQuestion,
    resetInterview
  };
}
