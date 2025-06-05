"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import PreInterviewSetup from '@/components/InterviewPractice/PreInterviewSetup';
import InterviewChat from '@/components/InterviewPractice/InterviewChat';
import InterviewGuidelines from '@/components/InterviewPractice/InterviewGuidelines';
import { extractTopics, generateQuestionsForTopic, evaluateAnswer } from '@/services/interviewService';
import { startSpeechRecognition, stopSpeechRecognition, textToSpeech } from '@/utils/speech/azureSpeechUtils';

const positionOptions = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UX/UI Designer',
  'Product Manager', 'Data Analyst', 'DevOps Engineer', 'Mobile Developer', 'QA Engineer'
];
const levelOptions = ['Junior', 'Mid-level', 'Senior', 'Lead'];
const LANGUAGES = [
  { key: 'vi', value: 'vi-VN', label: 'Tiếng Việt' },
  { key: 'en', value: 'en-US', label: 'English' }
];

let messageCounter = 0;

const createMessage = (sender: string, text: string, isError = false) => ({
  id: `msg_${++messageCounter}`,
  sender,
  text,
  timestamp: new Date().toISOString(),
  isError
});

const addMessageToConversation = (
  setConversation: React.Dispatch<React.SetStateAction<any[]>>,
  message: any,
  speakAiResponse: (text: string) => void,
  isSpeechEnabled: boolean,
  isSpeakerOn: boolean
) => {
  setConversation(prev => [...prev, message]);
  if (isSpeechEnabled && isSpeakerOn && message.sender === 'ai') {
    speakAiResponse(message.text);
  }
};

export default function TestPanel() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<any[]>([]);
  const [interviewing, setInterviewing] = useState(false);
  const [position, setPosition] = useState('Frontend Developer');
  const [level, setLevel] = useState('Junior');
  const [language, setLanguage] = useState('vi-VN');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  // Speech states
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('vi-VN');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [speechRecognizer, setSpeechRecognizer] = useState<any>(null);

  const [interviewState, setInterviewState] = useState({
    phase: 'introduction',
    topics: [],
    currentTopicIndex: 0,
    questions: [],
    currentQuestionIndex: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation]);

  // Speech handlers
  const startSpeechInteraction = () => {
    if (!isSpeechEnabled || typeof window === 'undefined') return;
    setIsListening(true);
    const recognizer = startSpeechRecognition(
      (text: string) => {
        if (text.trim()) {
          setMessage(text);
          handleSendMessage();
        }
      },
      (error: any) => {
        console.error("Speech recognition error:", error);
        setIsListening(false);
      },
      voiceLanguage
    );
    setSpeechRecognizer(recognizer);
  };

  const stopSpeechInteraction = async () => {
    setIsListening(false);
    if (speechRecognizer) {
      try {
        await stopSpeechRecognition(speechRecognizer);
        setSpeechRecognizer(null);
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechInteraction();
    } else {
      startSpeechInteraction();
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(prev => !prev);
  };

  const speakAiResponse = async (text: string) => {
    if (!isSpeakerOn || !isSpeechEnabled || typeof window === 'undefined') return;
    try {
      setIsAiSpeaking(true);
      await textToSpeech(text, voiceLanguage);
    } catch (error) {
      console.error("Error in text-to-speech:", error);
    } finally {
      setIsAiSpeaking(false);
    }
  };

  const startInterview = () => {
    setInterviewing(true);
    setInterviewState({
      phase: 'introduction',
      topics: [],
      currentTopicIndex: 0,
      questions: [],
      currentQuestionIndex: 0
    });
    const initialMessage = {
      id: Date.now(),
      sender: 'ai',
      text: `Xin chào! Tôi là AI Interviewer. Hôm nay chúng ta sẽ tiến hành phỏng vấn cho vị trí ${position} (${level}). Trước tiên, bạn có thể giới thiệu ngắn gọn về bản thân và kinh nghiệm làm việc của mình không?`,
      timestamp: new Date().toISOString()
    };
    setConversation([initialMessage]);
    if (isSpeechEnabled && isSpeakerOn) {
      speakAiResponse(initialMessage.text);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = createMessage('user', message);
    addMessageToConversation(setConversation, userMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    setMessage('');
    setIsAiThinking(true);
    try {
      switch (interviewState.phase) {
        case 'introduction':
          setIsAnalyzing(true);
          await handleIntroductionPhase(
            message,
            setConversation,
            setInterviewState,
            speakAiResponse,
            isSpeechEnabled,
            isSpeakerOn,
            position
          );
          break;
        case 'interviewing':
          await handleInterviewingPhase(
            message,
            interviewState,
            setInterviewState,
            setConversation,
            setInterviewing,
            speakAiResponse,
            isSpeechEnabled,
            isSpeakerOn
          );
          break;
        case 'completed':
          break;
      }
    } catch (error) {
      const errorMessage = createMessage(
        'ai',
        'Xin lỗi, đã có lỗi xảy ra trong quá trình phỏng vấn. Vui lòng thử lại hoặc bắt đầu lại cuộc phỏng vấn.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    } finally {
      setIsAiThinking(false);
      setIsAnalyzing(false);
    }
  };

  const getSkillsForPosition = (pos: string) => {
    const skillsMap: Record<string, string> = {
      'Frontend Developer': 'HTML, CSS, JavaScript, React, UI/UX',
      'Backend Developer': 'Node.js, Express, Python, Databases, API Design',
      'Full Stack Developer': 'Frontend, Backend, Databases, System Architecture',
      'UX/UI Designer': 'Design Principles, UX Research, Figma, Adobe XD',
      'Product Manager': 'Product Strategy, User Research, Agile, Roadmapping',
      'Data Analyst': 'SQL, Excel, Data Visualization, Statistics',
      'DevOps Engineer': 'CI/CD, AWS, Docker, Kubernetes, Monitoring',
      'Mobile Developer': 'React Native, Flutter, iOS, Android',
      'QA Engineer': 'Testing Methodologies, Test Automation, Quality Assurance'
    };
    return skillsMap[pos] || 'giao tiếp, giải quyết vấn đề, làm việc nhóm';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Phase handling functions
  const handleIntroductionPhase = async (
    message: string,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean,
    position: string
  ) => {
    const topics = await extractTopics(message);
    if (!topics || topics.length === 0) {
      const skills = getSkillsForPosition(position);
      const clarificationMessage = createMessage(
        'ai',
        `Tôi thấy bạn chưa giới thiệu về bản thân và kinh nghiệm làm việc. Bạn có thể giới thiệu ngắn gọn về:\n1. Tên và vị trí hiện tại của bạn\n2. Kinh nghiệm làm việc trong lĩnh vực ${position}\n3. Các kỹ năng chính của bạn\n\nĐối với vị trí ${position}, chúng tôi thường tìm kiếm các kỹ năng như: ${skills}.`
      );
      addMessageToConversation(setConversation, clarificationMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    const technicalKeywords = ['frontend', 'backend', 'fullstack', 'react', 'angular', 'vue', 'javascript', 'html', 'css', 'api', 'database', 'sql', 'python', 'java', 'c++', 'c#', 'devops', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mobile', 'ios', 'android', 'qa', 'testing', 'ui/ux', 'next.js', 'tailwind css'];
    const prioritizedTopics = topics.sort((a: string, b: string) => {
      const aIsTechnical = technicalKeywords.some(keyword => a.toLowerCase().includes(keyword)) ? 1 : 0;
      const bIsTechnical = technicalKeywords.some(keyword => b.toLowerCase().includes(keyword)) ? 1 : 0;
      return bIsTechnical - aIsTechnical;
    });
    const firstTopic = prioritizedTopics[0];
    const questions = await generateQuestionsForTopic(firstTopic);
    if (!questions || questions.length === 0) {
      const noQuestionsMessage = createMessage(
        'ai',
        `Xin lỗi, tôi gặp khó khăn khi tạo câu hỏi chi tiết về chủ đề ${firstTopic}. Bạn có muốn thử giới thiệu lại hoặc tập trung vào các kỹ năng khác không?`
      );
      addMessageToConversation(setConversation, noQuestionsMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    setInterviewState({
      phase: 'interviewing',
      topics,
      currentTopicIndex: 0,
      questions,
      currentQuestionIndex: 0
    });
    const firstQuestion = createMessage('ai', questions[0]);
    addMessageToConversation(setConversation, firstQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const handleInterviewingPhase = async (
    message: string,
    interviewState: any,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    const currentQuestion = interviewState.questions[interviewState.currentQuestionIndex];
    if (!currentQuestion) {
      const errorMessage = createMessage(
        'ai',
        'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi hiện tại. Chúng ta hãy thử chuyển sang chủ đề khác nhé.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      await handleTopicTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    const evaluation = await evaluateAnswer(currentQuestion, message);
    if (!evaluation || typeof evaluation.isComplete === 'undefined') {
      const errorMessage = createMessage(
        'ai',
        'Xin lỗi, có lỗi xảy ra khi đánh giá câu trả lời của bạn. Chúng ta hãy thử chuyển sang câu hỏi tiếp theo nhé.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    let responseText = '';
    if (evaluation.score >= 8) {
      responseText = `Rất tốt! Câu trả lời của bạn đạt ${evaluation.score}/10 điểm. ${evaluation.feedback}`;
      if (evaluation.strengths.length > 0) {
        responseText += `\n\nĐiểm mạnh của bạn:\n${evaluation.strengths.map((s: string) => `- ${s}`).join('\n')}`;
      }
    } else if (evaluation.score >= 5) {
      responseText = `Câu trả lời của bạn đạt ${evaluation.score}/10 điểm. ${evaluation.feedback}`;
      if (evaluation.missingPoints.length > 0) {
        responseText += `\n\nBạn có thể bổ sung thêm về:\n${evaluation.missingPoints.map((p: string) => `- ${p}`).join('\n')}`;
      }
    } else {
      responseText = `Câu trả lời của bạn cần cải thiện (${evaluation.score}/10 điểm). ${evaluation.feedback}`;
      if (evaluation.suggestedImprovements.length > 0) {
        responseText += `\n\nĐề xuất cải thiện:\n${evaluation.suggestedImprovements.map((i: string) => `- ${i}`).join('\n')}`;
      }
    }
    if (evaluation.followUpQuestions.length > 0) {
      responseText += `\n\nCâu hỏi tiếp theo: ${evaluation.followUpQuestions[0]}`;
    }
    const responseMessage = createMessage('ai', responseText);
    addMessageToConversation(setConversation, responseMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    if (evaluation.isComplete && evaluation.followUpQuestions.length === 0) {
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    }
  };

  const handleQuestionTransition = async (
    interviewState: any,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    const nextQuestionIndex = interviewState.currentQuestionIndex + 1;
    if (nextQuestionIndex < interviewState.questions.length) {
      setInterviewState((prev: any) => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex
      }));
      const nextQuestion = createMessage('ai', interviewState.questions[nextQuestionIndex]);
      addMessageToConversation(setConversation, nextQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    await handleTopicTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const handleTopicTransition = async (
    interviewState: any,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    const nextTopicIndex = interviewState.currentTopicIndex + 1;
    if (nextTopicIndex < interviewState.topics.length) {
      const nextTopic = interviewState.topics[nextTopicIndex];
      const nextTopicQuestions = await generateQuestionsForTopic(nextTopic);
      if (!nextTopicQuestions || nextTopicQuestions.length === 0) {
        const noQuestionsMessage = createMessage(
          'ai',
          `Xin lỗi, tôi gặp khó khăn khi tạo câu hỏi chi tiết về chủ đề ${nextTopic}. Chúng ta có thể chuyển sang chủ đề khác hoặc kết thúc phỏng vấn.`
        );
        addMessageToConversation(setConversation, noQuestionsMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
        const nextNextTopicIndex = nextTopicIndex + 1;
        if (nextNextTopicIndex < interviewState.topics.length) {
          setInterviewState((prev: any) => ({
            ...prev,
            currentTopicIndex: nextNextTopicIndex,
            questions: [],
            currentQuestionIndex: 0
          }));
        } else {
          await endInterview(setInterviewState, setInterviewing, setConversation, speakAiResponse, isSpeechEnabled, isSpeakerOn);
        }
        return;
      }
      setInterviewState((prev: any) => ({
        ...prev,
        currentTopicIndex: nextTopicIndex,
        questions: nextTopicQuestions,
        currentQuestionIndex: 0
      }));
      const nextQuestion = createMessage('ai', nextTopicQuestions[0]);
      addMessageToConversation(setConversation, nextQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    await endInterview(setInterviewState, setInterviewing, setConversation, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const endInterview = async (
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    setInterviewState((prev: any) => ({
      ...prev,
      phase: 'completed'
    }));
    const endingMessage = createMessage(
      'ai',
      'Cảm ơn bạn đã tham gia buổi phỏng vấn. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.'
    );
    addMessageToConversation(setConversation, endingMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    setInterviewing(false);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Mode (AI Interview)
        </Typography>
        {!interviewing ? (
          <PreInterviewSetup
            position={position}
            isSpeechEnabled={isSpeechEnabled}
            onPositionChange={(e: any) => setPosition(e.target.value)}
            onSpeechToggle={() => setIsSpeechEnabled(prev => !prev)}
            onStartInterview={startInterview}
            positionOptions={positionOptions}
            level={level}
            setLevel={setLevel}
            levelOptions={levelOptions}
            language={language}
            setLanguage={setLanguage}
            LANGUAGES={LANGUAGES}
          />
        ) : (
          <InterviewChat
            position={position}
            level={level}
            isSpeechEnabled={isSpeechEnabled}
            voiceLanguage={voiceLanguage}
            language={language}
            isListening={isListening}
            isSpeakerOn={isSpeakerOn}
            isAiSpeaking={isAiSpeaking}
            conversation={conversation}
            message={message}
            isAiThinking={isAiThinking}
            onToggleLanguage={() => setVoiceLanguage(prev => prev === 'vi-VN' ? 'en-US' : 'vi-VN')}
            onToggleSpeechRecognition={toggleSpeechRecognition}
            onToggleSpeaker={toggleSpeaker}
            onSpeechToggle={() => setIsSpeechEnabled(prev => !prev)}
            onMessageChange={(e: any) => setMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            messageListRef={messageListRef}
            handleKeyPress={handleKeyPress}
          />
        )}
        <InterviewGuidelines />
      </Box>
    </Container>
  );
}
