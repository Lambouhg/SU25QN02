import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Briefcase } from 'lucide-react';

interface StartScreenProps {
  category: string;
  position: string;
  level: string;
  duration: number;
  setCategory: (v: string) => void;
  setPosition: (v: string) => void;
  setLevel: (v: string) => void;
  setDuration: (v: number) => void;
  startInterview: () => void;
  CATEGORY_ROLE_OPTIONS: { category: string; roles: string[] }[];
  levelOptions: string[];
  isLoading?: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({
  category, position, level, duration,
  setCategory, setPosition, setLevel, setDuration,
  startInterview,
  isLoading = false,
  CATEGORY_ROLE_OPTIONS, levelOptions
}) => {
  const positionOptions = CATEGORY_ROLE_OPTIONS.find(c => c.category === category)?.roles || [];
  
  return (
    <Card className="bg-white/60 backdrop-blur-sm rounded-xl shadow border border-slate-200">
      <CardHeader>
        <CardTitle>Select interview field</CardTitle>
        <CardDescription>
          Select the field you want to practice and the level that matches your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category">Industry/Field</Label>
            <Select 
              value={category} 
              onValueChange={(value) => {
                setCategory(value);
                const newRoles = CATEGORY_ROLE_OPTIONS.find(c => c.category === value)?.roles || [];
                setPosition(newRoles[0] || '');
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select field"} />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                ) : CATEGORY_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.category} value={option.category}>{option.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position applied for</Label>
            <Select value={position} onValueChange={setPosition} disabled={isLoading}>
              <SelectTrigger id="position" className="w-full">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select position"} />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading positions...</SelectItem>
                ) : positionOptions.map((role: string) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cấp độ phỏng vấn */}
        <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Select interview level:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {levelOptions.filter(lv => lv === 'Junior' || lv === 'Mid-level' || lv === 'Senior').map((lv) => (
              <div
                key={lv}
                className={`border rounded-xl p-3 cursor-pointer transition-colors ${level === lv ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200 shadow-sm' : 'bg-white/70 border-slate-200 hover:bg-slate-50'}`}
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

        {/* Thời gian phỏng vấn */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="duration">Interview duration: {duration} minutes</Label>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[5, 10, 15, 20, 30].map((t) => (
              <Button
                key={t}
                variant={t === duration ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full px-4 ${t === duration ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                onClick={() => setDuration(t)}
              >
                {t} minutes
              </Button>
            ))}
          </div>
        </div>

        {/* Thông tin phỏng vấn */}
        <div className="bg-gray-50/70 p-4 rounded-lg border border-gray-200">
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
        <Button
          onClick={startInterview}
          className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-0 transition-colors"
          disabled={isLoading}
        >
          Start interview
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartScreen;