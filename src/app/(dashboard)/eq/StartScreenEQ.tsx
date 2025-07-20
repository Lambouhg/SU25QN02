import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Heart, Users, MessageCircle } from 'lucide-react';

interface StartScreenEQProps {
  selectedCategory: string;
  level: string;
  duration: number;
  setSelectedCategory: (category: string) => void;
  setLevel: (level: string) => void;
  setDuration: (duration: number) => void;
  startEQInterview: () => void;
  EQ_SCENARIOS: Array<{
    category: string;
    scenarios: Array<{
      id: number;
      title: string;
      description: string;
      difficulty: string;
    }>;
  }>;
  levelOptions: string[];
  position: string;
  setPosition: (position: string) => void;
  positionOptions: string[];
}

export default function StartScreenEQ({
  selectedCategory,
  level,
  duration,
  setSelectedCategory,
  setLevel,
  setDuration,
  startEQInterview,
  EQ_SCENARIOS,
  levelOptions,
  position,
  setPosition,
  positionOptions
}: StartScreenEQProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Heart className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">EQ Interview Practice</CardTitle>
        <p className="text-gray-600 mt-2">
          Enhance your emotional intelligence through realistic workplace scenarios
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Category Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Select EQ Focus Area</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {EQ_SCENARIOS.map((category) => (
                <SelectItem key={category.category} value={category.category}>
                  {category.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Position Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Experience Level</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Interview Duration</Label>
          <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="20">20 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* EQ Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Heart className="h-5 w-5 text-purple-600" />
            EQ Benefits
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>Better workplace relationships</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-purple-500" />
              <span>Improved communication skills</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-purple-500" />
              <span>Enhanced emotional awareness</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button 
          onClick={startEQInterview}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
        >
          Start EQ Interview
        </Button>
      </CardContent>
    </Card>
  );
}
