import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, Award, RotateCcw } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface ResultsSummaryProps {
  results: {
    duration: number;
    position: string;
    level: string;
    scores: {
      fundamentalKnowledge: number;
      logicalReasoning: number;
      languageFluency: number;
      overall: number;
    };
    messages: unknown[];
    timestamp: string;
    totalTime?: number; // Thêm trường totalTime ở đây
  };
  realTimeScores?: {
    fundamental: number;
    logic: number;
    language: number;
    suggestions: {
      fundamental: string;
      logic: string;
      language: string;
    };
  };
  onReset: () => void;
}

export function ResultsSummary({ results, realTimeScores, onReset }: Omit<ResultsSummaryProps, 'settings'>) {
  const categoryList = [
    { key: 'fundamental', label: 'Fundamental Knowledge', icon: <BookOpen className="h-8 w-8 mb-2 text-blue-500" /> },
    { key: 'logic', label: 'Logical Reasoning', icon: <Brain className="h-8 w-8 mb-2 text-purple-500" /> },
    { key: 'language', label: 'Language Proficiency', icon: <Award className="h-8 w-8 mb-2 text-green-500" /> }
  ];


  // Nếu có realTimeScores thì dùng luôn, không tính lại từ messages
  // Tất cả đều là phần trăm (0-100)
  const scores: Record<string, number> = realTimeScores
    ? {
        fundamental: realTimeScores.fundamental,
        logic: realTimeScores.logic,
        language: realTimeScores.language,
      }
    : {
        fundamental: results.scores.fundamentalKnowledge,
        logic: results.scores.logicalReasoning,
        language: results.scores.languageFluency,
      };

  const suggestions: Record<string, string> = realTimeScores
    ? realTimeScores.suggestions
    : { fundamental: '', logic: '', language: '' };

  // overall là trung bình cộng 3 tiêu chí, làm tròn
  const overall = Math.round((scores.fundamental + scores.logic + scores.language) / 3);

  // Chuẩn hóa dữ liệu cho biểu đồ
  // Dữ liệu cho biểu đồ (0-100)
  const chartScores = scores;

  const radarChartData = [
    { subject: 'Fundamental Knowledge', A: chartScores.fundamental, fullMark: 100 },
    { subject: 'Logical Reasoning', A: chartScores.logic, fullMark: 100 },
    { subject: 'Language Proficiency', A: chartScores.language, fullMark: 100 },
  ];

  const barChartData = [
    { name: 'Fundamental Knowledge', score: chartScores.fundamental },
    { name: 'Logical Reasoning', score: chartScores.logic },
    { name: 'Language Proficiency', score: chartScores.language },
  ];

  // Hàm tạo nhận xét tổng quan
  function getOverallSummary(scores: Record<string, number>) {
    const f = scores.fundamental;
    const l = scores.logic;
    const lang = scores.language;
    if (f >= 80 && l >= 80 && lang >= 80) return 'Excellent performance in all areas. You are well-prepared for interviews!';
    if (f < 50 && l < 50 && lang < 50) return 'You need to improve in all areas. Focus on fundamental knowledge, logical reasoning, and language proficiency.';
    if (f < 60 && l >= 70 && lang >= 70) return 'Your logic and language are strong, but you should review fundamental knowledge.';
    if (l < 60 && f >= 70 && lang >= 70) return 'Your fundamental knowledge and language are good, but logical reasoning needs improvement.';
    if (lang < 60 && f >= 70 && l >= 70) return 'Your fundamental knowledge and logic are good, but language proficiency needs improvement.';
    if (f < 60) return 'You should focus on improving your fundamental knowledge.';
    if (l < 60) return 'You should focus on improving your logical reasoning.';
    if (lang < 60) return 'You should focus on improving your language proficiency.';
    return 'Good effort! Keep practicing to improve further.';
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Interview Result</CardTitle>
            <CardDescription>
              {new Date(results.timestamp).toLocaleString()} • {results.position} ({results.level})
              {typeof results.totalTime === 'number' && results.totalTime > 0 && (
                <span className="ml-2 text-green-700 font-semibold">• Total time spent: {results.totalTime} minute{results.totalTime > 1 ? 's' : ''}</span>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {overall}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {categoryList.map(cat => (
            <Card key={cat.key}>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                {cat.icon}
                <h3 className="font-medium">{cat.label}</h3>
                <div className="text-3xl font-bold mt-2">
                  {Math.round(scores[cat.key])}%
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feedback & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 font-semibold text-blue-700">{getOverallSummary(scores)}</div>
            <ul className="space-y-2">
              {categoryList.map(cat => (
                <li key={cat.key} className="flex flex-col gap-1">
                  <span className="font-semibold">{cat.label}:</span>
                  <span>{suggestions[cat.key] || 'No suggestion.'}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detailed Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Practice again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}