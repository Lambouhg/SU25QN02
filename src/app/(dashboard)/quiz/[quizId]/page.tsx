import DashboardLayout from '@/components/dashboard/DashboardLayout';
import QuizPanel from "../QuizPanel";

interface QuizPageProps {
  params: Promise<{ quizId: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;

  return (
    <DashboardLayout>
      <QuizPanel quizId={quizId} />
    </DashboardLayout>
  );
}