import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Brain, Award, RotateCcw } from 'lucide-react';

interface ResultsSummaryProps {
  results: {
    duration: number;
    position: string;
    level: string;
    scores: {
      communicationClarity: number;
      logicalReasoning: number;
      languageFluency: number;
      overall: number;
    };
    messages: any[];
    timestamp: string;
  };
  settings: any;
  onReset: () => void;
}

export function ResultsSummary({ results, settings, onReset }: ResultsSummaryProps) {
  // Generate feedback based on scores
  const getFeedback = () => {
    const { communicationClarity, logicalReasoning, languageFluency } = results.scores;
    const feedback = [];
    if (communicationClarity < 50) {
      feedback.push('Work on expressing your ideas more clearly and concisely.');
    } else if (communicationClarity < 80) {
      feedback.push('Your communication is good, but could benefit from more structured responses.');
    } else {
      feedback.push('Excellent communication skills! You express ideas clearly and effectively.');
    }
    if (logicalReasoning < 50) {
      feedback.push('Focus on improving your problem-solving approach and logical structure.');
    } else if (logicalReasoning < 80) {
      feedback.push('Your logical reasoning is solid, but try to provide more comprehensive analysis.');
    } else {
      feedback.push('Strong logical reasoning skills demonstrated throughout the interview.');
    }
    if (languageFluency < 50) {
      feedback.push('Consider expanding your technical vocabulary and working on sentence structure.');
    } else if (languageFluency < 80) {
      feedback.push('Good language fluency, with room for improvement in technical terminology.');
    } else {
      feedback.push('Excellent language fluency with appropriate technical terminology.');
    }
    return feedback;
  };
  const feedback = getFeedback();
  return (
    <Card className="w-full max-w-4xl mx-auto mt-10">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Interview Results</CardTitle>
            <CardDescription>
              {new Date(results.timestamp).toLocaleString()} • {results.position} ({results.level})
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {results.scores.overall}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <MessageSquare className="h-8 w-8 mb-2 text-sky-500" />
              <h3 className="font-medium">Communication</h3>
              <div className="text-3xl font-bold mt-2 text-sky-500">
                {Math.round(results.scores.communicationClarity)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Brain className="h-8 w-8 mb-2 text-violet-500" />
              <h3 className="font-medium">Reasoning</h3>
              <div className="text-3xl font-bold mt-2 text-violet-500">
                {Math.round(results.scores.logicalReasoning)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Award className="h-8 w-8 mb-2 text-emerald-500" />
              <h3 className="font-medium">Language</h3>
              <div className="text-3xl font-bold mt-2 text-emerald-500">
                {Math.round(results.scores.languageFluency)}%
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feedback & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Luyện tập lại
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 