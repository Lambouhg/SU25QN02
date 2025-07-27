import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestModeInputProps {
  jobDescription: string;
  candidateName: string;
  positionLevel: string;
  loading: boolean;
  error: string | null;
  onJobDescriptionChange: (value: string) => void;
  onCandidateNameChange: (value: string) => void;
  onPositionLevelChange: (value: string) => void;
  onSubmit: () => void;
}

export default function TestModeInput({
  jobDescription,
  candidateName,
  positionLevel,
  loading,
  error,
  onJobDescriptionChange,
  onCandidateNameChange,
  onPositionLevelChange,
  onSubmit
}: TestModeInputProps) {
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitAttempted(true);
    
    if (jobDescription.trim().length >= 50) {
      onSubmit();
    }
  };
  
  const isJobDescriptionInvalid = isSubmitAttempted && jobDescription.trim().length < 50;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">AI Technical Interview Simulator</CardTitle>
        <CardDescription>
          Enter a job description to generate a personalized technical interview simulation
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="font-medium">
              Job Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              className={`min-h-[200px] ${isJobDescriptionInvalid ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {isJobDescriptionInvalid && (
              <p className="text-sm text-red-500">
                Please enter a job description (minimum 50 characters)
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="candidateName" className="font-medium">
                Your Name (Optional)
              </Label>
              <Input
                id="candidateName"
                placeholder="Enter your name"
                value={candidateName}
                onChange={(e) => onCandidateNameChange(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="positionLevel" className="font-medium">
                Position Level
              </Label>
              <Select
                value={positionLevel}
                onValueChange={onPositionLevelChange}
                disabled={loading}
              >
                <SelectTrigger id="positionLevel">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid-level">Mid-level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Job Description...
              </>
            ) : (
              'Start Interview Preparation'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
