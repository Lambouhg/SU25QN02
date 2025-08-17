"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, Users, MessageCircle } from 'lucide-react';
import StartScreenEQ from './StartScreenEQ';
import InterviewScreenEQ from './InterviewScreenEQ';
import ResultScreenEQ from './ResultScreenEQ';

const EQ_SCENARIOS = [
	{
		category: "Workplace Relationships",
		scenarios: [
			{
				id: 1,
				title: "Team Member Support",
				description: "You notice a team member is upset after a meeting. How would you approach them?",
				difficulty: "Medium"
			},
			{
				id: 2,
				title: "Conflict Resolution",
				description: "Describe a time you had to resolve a conflict between colleagues.",
				difficulty: "Hard"
			},
			{
				id: 3,
				title: "Handling Feedback",
				description: "How do you handle feedback that you disagree with?",
				difficulty: "Medium"
			},
			{
				id: 4,
				title: "Credit Recognition",
				description: "A colleague takes credit for your work. How do you respond?",
				difficulty: "Hard"
			},
			{
				id: 5,
				title: "Public Criticism",
				description: "Your manager gives you negative feedback in front of the team. How do you handle it?",
				difficulty: "Hard"
			}
		]
	},
	{
		category: "Stress Management",
		scenarios: [
			{
				id: 6,
				title: "Multiple Deadlines",
				description: "You're overwhelmed with multiple deadlines. How do you manage the stress?",
				difficulty: "Medium"
			},
			{
				id: 7,
				title: "Extreme Pressure",
				description: "Describe a time when you had to work under extreme pressure.",
				difficulty: "Hard"
			},
			{
				id: 8,
				title: "Client Criticism",
				description: "How do you handle criticism from clients or stakeholders?",
				difficulty: "Medium"
			},
			{
				id: 9,
				title: "Mistake Management",
				description: "You make a mistake that affects the team. How do you handle it?",
				difficulty: "Hard"
			},
			{
				id: 10,
				title: "Work-Life Balance",
				description: "How do you maintain work-life balance during busy periods?",
				difficulty: "Medium"
			}
		]
	},
	{
		category: "Leadership & Teamwork",
		scenarios: [
			{
				id: 11,
				title: "Team Motivation",
				description: "How do you motivate team members who are struggling?",
				difficulty: "Hard"
			},
			{
				id: 12,
				title: "Difficult Team Member",
				description: "Describe a time when you had to lead a difficult team member.",
				difficulty: "Hard"
			},
			{
				id: 13,
				title: "Supervisor Disagreement",
				description: "How do you handle disagreements with your supervisor?",
				difficulty: "Medium"
			},
			{
				id: 14,
				title: "Delivering Bad News",
				description: "You need to deliver bad news to your team. How do you approach it?",
				difficulty: "Hard"
			},
			{
				id: 15,
				title: "Building Trust",
				description: "How do you build trust with new team members?",
				difficulty: "Medium"
			}
		]
	},
	{
		category: "Communication & Empathy",
		scenarios: [
			{
				id: 16,
				title: "Different Communication Styles",
				description: "How do you communicate with someone who has a different communication style?",
				difficulty: "Medium"
			},
			{
				id: 17,
				title: "Showing Empathy",
				description: "Describe a time when you had to show empathy to a colleague.",
				difficulty: "Medium"
			},
			{
				id: 18,
				title: "Difficult Client Conversations",
				description: "How do you handle difficult conversations with clients?",
				difficulty: "Hard"
			},
			{
				id: 19,
				title: "Constructive Feedback",
				description: "You need to give constructive feedback. How do you approach it?",
				difficulty: "Medium"
			},
			{
				id: 20,
				title: "Cultural Differences",
				description: "How do you handle cultural differences in the workplace?",
				difficulty: "Medium"
			}
		]
	}
];

const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];

export interface ConversationMessage {
	id: string | number;
	sender: 'user' | 'ai';
	text: string;
	isError?: boolean;
	timestamp?: string;
}

interface RealTimeScores {
	emotionalAwareness: number;
	conflictResolution: number;
	communication: number;
	suggestions: {
		emotionalAwareness: string;
		conflictResolution: string;
		communication: string;
	};
}

interface EvaluationScores {
	emotionalAwareness: number;
	conflictResolution: number;
	communication: number;
	overall: number;
}

interface HistoryStage {
	question: string;
	answer: string;
	evaluation: {
		scores: {
			emotionalAwareness: number;
			conflictResolution: number;
			communication: number;
		};
		suggestions: {
			emotionalAwareness: string;
			conflictResolution: string;
			communication: string;
		};
	};
	topic: string;
	timestamp: string;
}

interface InterviewState {
	phase: 'introduction' | 'interviewing' | 'completed';
	categories: string[];
	currentCategoryIndex: number;
	scenarios: Array<{
		id: number;
		title: string;
		description: string;
		difficulty: string;
	}>;
	currentScenarioIndex: number;
}

const createMessage = (sender: 'user' | 'ai', text: string, isError = false): ConversationMessage => ({
	id: Date.now(), sender, text, timestamp: new Date().toISOString(), isError
});

export default function TestPanelEQ() {
	const [message, setMessage] = useState('');
	const [conversation, setConversation] = useState<ConversationMessage[]>([]);
	const [interviewing, setInterviewing] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState(EQ_SCENARIOS[0].category);
	const [level, setLevel] = useState('Beginner');
	const [duration, setDuration] = useState(20);
	const [isAiThinking, setIsAiThinking] = useState(false);
	const messageListRef = useRef<HTMLDivElement | null>(null);

	const [interviewState, setInterviewState] = useState<InterviewState>({
		phase: 'introduction',
		categories: [],
		currentCategoryIndex: 0,
		scenarios: [],
		currentScenarioIndex: 0
	});

	const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);
	const [history, setHistory] = useState<HistoryStage[]>([]);
	const [showResult, setShowResult] = useState(false);

	const [realTimeScores, setRealTimeScores] = useState<RealTimeScores>({
		emotionalAwareness: 0,
		conflictResolution: 0,
		communication: 0,
		suggestions: {
			emotionalAwareness: '',
			conflictResolution: '',
			communication: ''
		}
	});

	const [lastFeedback, setLastFeedback] = useState<string | null>(null);
	const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);
	const [remainingTime, setRemainingTime] = useState<number>(duration);

	const [position, setPosition] = useState('');
	const [positionOptions, setPositionOptions] = useState<string[]>([]);

	useEffect(() => {
		if (messageListRef.current) {
			messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
		}
	}, [conversation]);

	useEffect(() => {
		if (interviewing && !hasSentInitialMessage) {
			const initialMessage = createMessage('ai', `Welcome to the EQ Interview! Today we'll explore your emotional intelligence in the context of ${selectedCategory} at the ${level} level. Let's start by understanding your approach to workplace situations. Could you tell me about a recent experience where you had to manage emotions in a professional setting?`);
			setConversation([initialMessage]);
			setHasSentInitialMessage(true);
		}
	}, [interviewing, selectedCategory, level, hasSentInitialMessage]);

	useEffect(() => {
		fetch('/api/positions')
			.then(res => res.json())
			.then((data: Record<string, unknown>[]) => {
				if (Array.isArray(data)) {
					setPositionOptions(Array.from(new Set(data.map((p) => (p as { title: string }).title))));
					if (!position && data.length > 0) setPosition((data[0] as { title: string }).title);
				}
			});
	}, [position]);

	const startEQInterview = () => {
		setShowResult(false);
		setInterviewing(true);
		setInterviewState({
			phase: 'introduction',
			categories: [selectedCategory],
			currentCategoryIndex: 0,
			scenarios: [],
			currentScenarioIndex: 0
		});
		setHasSentInitialMessage(false);
		setHistory([]);
		setRealTimeScores({
			emotionalAwareness: 0,
			conflictResolution: 0,
			communication: 0,
			suggestions: {
				emotionalAwareness: '',
				conflictResolution: '',
				communication: ''
			}
		});
		setConversation([]);
		setMessage('');
		setLastFeedback(null);
		setInterviewStartTime(Date.now());
	};

	const handleSendMessage = async () => {
		if (!message.trim()) return;
		const userMessage = createMessage('user', message);
		addMessageToConversation(setConversation, userMessage);
		setMessage('');
		setIsAiThinking(true);
		
		try {
			switch (interviewState.phase) {
				case 'introduction':
					await handleIntroductionPhase();
					break;
				case 'interviewing':
					await handleInterviewingPhase(message);
					break;
				case 'completed':
					break;
			}
		} catch {
			const errorMessage = createMessage(
				'ai',
				'Sorry, an error occurred while processing your response. Please try again.',
				true
			);
			addMessageToConversation(setConversation, errorMessage);
		} finally {
			setIsAiThinking(false);
		}
	};

	const handleIntroductionPhase = async () => {
		// Simulate AI processing for introduction
		const scenarios = EQ_SCENARIOS.find(cat => cat.category === selectedCategory)?.scenarios || [];
		if (scenarios.length === 0) {
			const errorMessage = createMessage(
				'ai',
				'Sorry, I\'m having trouble generating scenarios for this category. Let\'s try a different approach.',
				true
			);
			addMessageToConversation(setConversation, errorMessage);
			return;
		}

		setInterviewState({
			phase: 'interviewing',
			categories: [selectedCategory],
			currentCategoryIndex: 0,
			scenarios,
			currentScenarioIndex: 0
		});

		const thankMessage = createMessage(
			'ai',
			`Thank you for sharing your experience! Now let's explore some specific scenarios to better understand your EQ approach.\n\n${scenarios[0].description}`
		);
		addMessageToConversation(setConversation, thankMessage);
	};

	const handleInterviewingPhase = async (message: string) => {
		const currentScenario = interviewState.scenarios[interviewState.currentScenarioIndex].description;
		if (!currentScenario) {
			const errorMessage = createMessage(
				'ai',
				'Sorry, an error occurred while processing the current scenario. Let\'s try the next one.',
				true
			);
			addMessageToConversation(setConversation, errorMessage);
			await handleScenarioTransition();
			return;
		}

		// Simulate EQ evaluation
		const evaluation = await simulateEQEvaluation(currentScenario, message);
		
		if (evaluation && evaluation.scores) {
			setRealTimeScores({
				emotionalAwareness: evaluation.scores.emotionalAwareness,
				conflictResolution: evaluation.scores.conflictResolution,
				communication: evaluation.scores.communication,
				suggestions: {
					emotionalAwareness: evaluation.suggestions?.emotionalAwareness || '',
					conflictResolution: evaluation.suggestions?.conflictResolution || '',
					communication: evaluation.suggestions?.communication || ''
				}
			});
		}

		// Save to history
		addHistoryStage({
			question: currentScenario,
			answer: message,
			evaluation,
			topic: selectedCategory,
			timestamp: new Date().toISOString()
		});

		// Format feedback
		let responseText = `**EQ Assessment:**\n`;
		if (evaluation.strengths && evaluation.strengths.length > 0) {
			responseText += `- **Strengths:**\n`;
			responseText += evaluation.strengths.map((s: string) => `  - ${s}`).join("\n") + "\n";
		}
		if (evaluation.areasForImprovement && evaluation.areasForImprovement.length > 0) {
			responseText += `- **Areas for Improvement:**\n`;
			responseText += evaluation.areasForImprovement.map((a: string) => `  - ${a}`).join("\n") + "\n";
		}
		if (evaluation.suggestions) {
			responseText += `- **Suggestions:**\n`;
			responseText += `  - Emotional Awareness: ${evaluation.suggestions.emotionalAwareness}\n`;
			responseText += `  - Conflict Resolution: ${evaluation.suggestions.conflictResolution}\n`;
			responseText += `  - Communication: ${evaluation.suggestions.communication}\n\n`;
		}

		setLastFeedback(responseText);

		// Check if we should continue or end
		if (interviewState.currentScenarioIndex >= interviewState.scenarios.length - 1) {
			await endInterview();
		} else {
			await handleScenarioTransition();
		}
	};

	const simulateEQEvaluation = async (question: string, answer: string) => {
		// Simulate AI evaluation with realistic scoring
		const emotionalKeywords = ['feel', 'emotion', 'understand', 'empathy', 'support', 'listen'];
		const conflictKeywords = ['resolve', 'discuss', 'mediate', 'compromise', 'solution', 'dialogue'];
		const communicationKeywords = ['clear', 'explain', 'communicate', 'express', 'articulate', 'convey'];

		const emotionalScore = Math.min(100, Math.max(0, 
			emotionalKeywords.filter(keyword => answer.toLowerCase().includes(keyword)).length * 20 + 
			Math.random() * 30
		));
		
		const conflictScore = Math.min(100, Math.max(0,
			conflictKeywords.filter(keyword => answer.toLowerCase().includes(keyword)).length * 20 +
			Math.random() * 30
		));
		
		const communicationScore = Math.min(100, Math.max(0,
			communicationKeywords.filter(keyword => answer.toLowerCase().includes(keyword)).length * 20 +
			Math.random() * 30
		));

		return {
			scores: {
				emotionalAwareness: Math.round(emotionalScore),
				conflictResolution: Math.round(conflictScore),
				communication: Math.round(communicationScore)
			},
			strengths: [
				emotionalScore > 70 ? 'Good emotional awareness' : null,
				conflictScore > 70 ? 'Strong conflict resolution approach' : null,
				communicationScore > 70 ? 'Clear communication style' : null
			].filter(Boolean) as string[],
			areasForImprovement: [
				emotionalScore < 50 ? 'Consider acknowledging emotions more explicitly' : null,
				conflictScore < 50 ? 'Focus on collaborative problem-solving' : null,
				communicationScore < 50 ? 'Work on clarity and structure in responses' : null
			].filter(Boolean) as string[],
			suggestions: {
				emotionalAwareness: 'Practice mindfulness and self-reflection',
				conflictResolution: 'Learn active listening techniques',
				communication: 'Work on clarity and structure in responses'
			}
		};
	};

	const handleScenarioTransition = async () => {
		const nextScenarioIndex = interviewState.currentScenarioIndex + 1;
		if (nextScenarioIndex < interviewState.scenarios.length) {
			const nextScenario = createMessage('ai', interviewState.scenarios[nextScenarioIndex].description);
			addMessageToConversation(setConversation, nextScenario);
			setInterviewState(prev => ({
				...prev,
				currentScenarioIndex: nextScenarioIndex
			}));
		} else {
			await endInterview();
		}
	};

	const endInterview = async () => {
		setInterviewState(prev => ({
			...prev,
			phase: 'completed'
		}));
		
		const endingMessage = createMessage(
			'ai',
			'Thank you for completing the EQ interview! We will now analyze your responses and provide a comprehensive assessment.'
		);
		addMessageToConversation(setConversation, endingMessage);
		setInterviewing(false);
		setShowResult(true);

		let totalTime = null;
		if (interviewStartTime) {
			const diffMs = Date.now() - interviewStartTime;
			totalTime = Math.ceil(diffMs / 60000);
		}

		try {
			await fetch('/api/assessment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'eq', // Thêm type cho EQ
					duration,
					selectedCategory,
					level,
					history,
					realTimeScores,
					totalTime,
					position,
				})
			});

		} catch (error) {
			console.error('Error saving EQ result:', error);
		}
	};

	const handleReset = () => {
		setShowResult(false);
		setInterviewing(false);
		setConversation([]);
		setMessage('');
		setInterviewState({
			phase: 'introduction',
			categories: [],
			currentCategoryIndex: 0,
			scenarios: [],
			currentScenarioIndex: 0
		});
	};

	const calculateFinalScores = (): EvaluationScores => {
		if (history.length === 0) {
			return {
				emotionalAwareness: 0,
				conflictResolution: 0,
				communication: 0,
				overall: 0
			};
		}

		const validStages = history.filter(stage => 
			stage.evaluation?.scores && 
			typeof stage.evaluation.scores.emotionalAwareness === 'number' &&
			typeof stage.evaluation.scores.conflictResolution === 'number' &&
			typeof stage.evaluation.scores.communication === 'number'
		);

		if (validStages.length === 0) {
			return {
				emotionalAwareness: 0,
				conflictResolution: 0,
				communication: 0,
				overall: 0
			};
		}

		const totalScores = validStages.reduce((acc, stage) => ({
			emotionalAwareness: acc.emotionalAwareness + stage.evaluation.scores.emotionalAwareness,
			conflictResolution: acc.conflictResolution + stage.evaluation.scores.conflictResolution,
			communication: acc.communication + stage.evaluation.scores.communication
		}), {
			emotionalAwareness: 0,
			conflictResolution: 0,
			communication: 0
		});

		const averageScores = {
			emotionalAwareness: totalScores.emotionalAwareness / validStages.length,
			conflictResolution: totalScores.conflictResolution / validStages.length,
			communication: totalScores.communication / validStages.length
		};

		return {
			...averageScores,
			overall: (averageScores.emotionalAwareness + averageScores.conflictResolution + averageScores.communication) / 3
		};
	};

	const addMessageToConversation = (
		setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
		message: ConversationMessage
	) => {
		setConversation(prev => [...prev, message]);
	};

	const addHistoryStage = (stage: HistoryStage) => {
		setHistory(prev => [...prev, stage]);
	};

	const handleEndInterviewWithTime = (minutesLeft: number) => {
		setRemainingTime(minutesLeft);
		const totalTime = Math.ceil(duration - minutesLeft);
		try {
			fetch('/api/assessment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'eq', // Thêm type cho EQ
					duration,
					selectedCategory,
					level,
					history,
					realTimeScores,
					totalTime,
					position,
				})
			});
		} catch (error) {
			console.error('Error saving EQ result:', error);
		}
		setShowResult(true);
		setInterviewing(false);
	};

	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					{showResult ? (
						<ResultScreenEQ
							results={{
								duration,
								selectedCategory,
								level,
								scores: calculateFinalScores(),
								messages: conversation.map(msg => ({
									id: msg.id.toString(),
									type: msg.sender,
									text: msg.text,
									timestamp: new Date(msg.timestamp || new Date().toISOString()),
									isError: msg.isError
								})),
								timestamp: new Date().toISOString(),
								totalTime: Math.ceil(duration - remainingTime),
							}}
							realTimeScores={realTimeScores}
							onReset={handleReset}
						/>
					) : !interviewing ? (
						<StartScreenEQ
							selectedCategory={selectedCategory}
							level={level}
							duration={duration}
							setSelectedCategory={setSelectedCategory}
							setLevel={setLevel}
							setDuration={setDuration}
							startEQInterview={startEQInterview}
							EQ_SCENARIOS={EQ_SCENARIOS}
							levelOptions={levelOptions}
							position={position}
							setPosition={setPosition}
							positionOptions={positionOptions}
						/>
					) : (
						<InterviewScreenEQ
							selectedCategory={selectedCategory}
							conversation={conversation.map(msg => ({
								role: msg.sender,
								content: msg.text
							}))}
							message={message}
							isAiThinking={isAiThinking}
							onSendMessage={handleSendMessage}
							onMessageChange={(e) => setMessage(e.target.value)}
							onEndInterview={handleEndInterviewWithTime}
							messageListRef={messageListRef}
							duration={duration}
							realTimeScores={{
								emotionalAwareness: realTimeScores.emotionalAwareness,
								conflictResolution: realTimeScores.conflictResolution,
								communication: realTimeScores.communication
							} as Record<string, number>}
							lastFeedback={lastFeedback}
						/>
					)}
				</div>
				<div className="space-y-6">
					<Card className="shadow-sm">
						<CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white">
							<CardTitle className="flex items-center gap-2">
								<svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								EQ Evaluation Criteria
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							<div className="flex items-center space-x-3 p-3.5 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
								<div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
									<Heart className="h-5 w-5 text-purple-600" />
								</div>
								<div>
									<h4 className="font-medium text-gray-900">Emotional Awareness</h4>
									<p className="text-sm text-gray-600 mt-0.5">Evaluate recognition and management of emotions.</p>
								</div>
							</div>
							<div className="flex items-center space-x-3 p-3.5 bg-orange-50 rounded-lg border border-orange-100 hover:border-orange-300 transition-colors">
								<div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
									<Users className="h-5 w-5 text-orange-600" />
								</div>
								<div>
									<h4 className="font-medium text-gray-900">Conflict Resolution</h4>
									<p className="text-sm text-gray-600 mt-0.5">Evaluate ability to resolve conflicts effectively.</p>
								</div>
							</div>
							<div className="flex items-center space-x-3 p-3.5 bg-teal-50 rounded-lg border border-teal-100 hover:border-teal-300 transition-colors">
								<div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
									<MessageCircle className="h-5 w-5 text-teal-600" />
								</div>
								<div>
									<h4 className="font-medium text-gray-900">Communication</h4>
									<p className="text-sm text-gray-600 mt-0.5">Evaluate clarity and effectiveness in communication.</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-sm">
						<CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-white">
							<CardTitle className="flex items-center gap-2">
								<svg className="h-5 w-5 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Why EQ matters in the workplace?
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							<div className="flex items-start space-x-3.5">
								<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold flex-shrink-0 shadow-sm">1</div>
								<div>
									<h4 className="font-medium text-gray-900">Better relationships</h4>
									<p className="text-sm text-gray-600 mt-1">High EQ helps build stronger professional relationships and teamwork.</p>
								</div>
							</div>
							<div className="flex items-start space-x-3.5">
								<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold flex-shrink-0 shadow-sm">2</div>
								<div>
									<h4 className="font-medium text-gray-900">Effective leadership</h4>
									<p className="text-sm text-gray-600 mt-1">EQ is crucial for leading teams and managing workplace dynamics.</p>
								</div>
							</div>
							<div className="flex items-start space-x-3.5">
								<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold flex-shrink-0 shadow-sm">3</div>
								<div>
									<h4 className="font-medium text-gray-900">Stress management</h4>
									<p className="text-sm text-gray-600 mt-1">Better emotional intelligence helps manage workplace stress effectively.</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-sm">
						<CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-white">
							<CardTitle className="flex items-center gap-2">
								<svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
								Selected EQ Focus
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium text-gray-600">Category:</span>
									<Badge variant="outline" className="bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200">{selectedCategory}</Badge>
								</div>
								<Separator className="my-0.5" />
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium text-gray-600">Level:</span>
									<Badge variant="outline" className="bg-orange-50 text-orange-800 hover:bg-orange-100 border-orange-200">{level}</Badge>
								</div>
								<Separator className="my-0.5" />
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium text-gray-600">Duration:</span>
									<Badge variant="outline" className="bg-teal-50 text-teal-800 hover:bg-teal-100 border-teal-200">{duration} minutes</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
