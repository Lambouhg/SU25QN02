import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Briefcase } from 'lucide-react';

interface StartScreenProps {
  category: string;
  position: string;
  level: string;
  language: string;
  duration: number;
  setCategory: (v: string) => void;
  setPosition: (v: string) => void;
  setLevel: (v: string) => void;
  setLanguage: (v: string) => void;
  setDuration: (v: number) => void;
  setIsSpeechEnabled: (v: boolean) => void;
  isSpeechEnabled: boolean;
  startInterview: () => void;
  CATEGORY_ROLE_OPTIONS: { category: string; roles: string[] }[];
  LANGUAGES: { value: string; label: string }[];
  levelOptions: string[];
}

const StartScreen: React.FC<StartScreenProps> = ({
  category, position, level, language, duration,
  setCategory, setPosition, setLevel, setLanguage, setDuration,
  setIsSpeechEnabled, isSpeechEnabled, startInterview,
  CATEGORY_ROLE_OPTIONS, LANGUAGES, levelOptions
}) => {
  const positionOptions = CATEGORY_ROLE_OPTIONS.find(c => c.category === category)?.roles || [];
  return (
    <Card className="bg-white rounded-lg shadow p-6">
      <CardHeader>
        <CardTitle>Select interview field</CardTitle>
        <CardDescription>
          Select the field you want to practice and the level that matches your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Industry/Field</Label>
            <Select value={category} onValueChange={(value) => {
              setCategory(value);
              const newRoles = CATEGORY_ROLE_OPTIONS.find(c => c.category === value)?.roles || [];
              setPosition(newRoles[0] || '');
            }}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.category} value={option.category}>{option.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position applied for</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position" className="w-full">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {positionOptions.map((role: string) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Cấp độ phỏng vấn */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Select interview level:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {levelOptions.map((lv) => (
              <div
                key={lv}
                className={`border rounded-lg p-3 cursor-pointer ${level === lv ? 'bg-amber-50 border-amber-300 shadow-sm' : 'hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setLevel(lv)}
              >
                <div className="font-medium mb-1">{lv}</div>
                <div className="text-xs text-gray-600">
                  {lv === 'Junior' ? '0-2 years experience' : lv === 'Mid-level' ? '2-5 years experience' : lv === 'Senior' ? '5+ years experience' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Ngôn ngữ phỏng vấn */}
        <div className="space-y-2">
          <Label htmlFor="language">Interview language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Thời gian phỏng vấn */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="duration">Interview duration: {duration} minutes</Label>
          </div>
          <div className="flex items-center gap-2">
            {[5, 10, 15, 20, 30].map((t) => (
              <Button
                key={t}
                variant={t === duration ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDuration(t)}
              >
                {t} minutes
              </Button>
            ))}
          </div>
        </div>
        {/* Tương tác giọng nói */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="voice">Voice interaction</Label>
            <p className="text-sm text-muted-foreground">Turn on voice recognition and read text</p>
          </div>
          <Switch id="voice" checked={isSpeechEnabled} onCheckedChange={setIsSpeechEnabled} />
        </div>
        {/* Thông tin phỏng vấn */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Interview information:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Real interview question</strong> for position {position}</span></li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Time limit</strong> for each question</span></li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Detailed analysis</strong> from AI about your answer</span></li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Specific suggestions</strong> for improving each answer</span></li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={startInterview} className="w-full text-lg font-semibold">Start interview</Button>
      </CardFooter>
    </Card>
  );
};

export default StartScreen; 