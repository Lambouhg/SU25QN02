import QuizPanel from "../QuizPanel";

interface QuizPageProps {
  params: { quizId: string };
}

export default function QuizPage({ params }: QuizPageProps) {
  const { quizId } = params;

  return <QuizPanel quizId={quizId} />;
} 