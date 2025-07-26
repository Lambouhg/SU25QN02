import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TopicData } from '@/hooks/useTestModeInterview';

interface TopicSelectionProps {
  topics: TopicData[];
  loading: boolean;
  error: string | null;
  onToggleTopic: (topicName: string) => void;
  onStartInterview: () => void;
  onBack: () => void;
}

export default function TopicSelection({
  topics,
  loading,
  error,
  onToggleTopic,
  onStartInterview,
  onBack
}: TopicSelectionProps) {
  const selectedTopicsCount = topics.filter(t => t.selected).length;
  
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Select Interview Topics</CardTitle>
        <CardDescription>
          These topics were extracted from the job description. Select the ones you want to be tested on.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <div 
              key={topic.name}
              className={`p-3 rounded-lg border flex items-center space-x-3 cursor-pointer transition-all
                ${topic.selected ? 'border-primary bg-primary/5' : 'border-border'}
              `}
              onClick={() => onToggleTopic(topic.name)}
            >
              <Checkbox 
                id={`topic-${topic.name}`}
                checked={topic.selected}
                onCheckedChange={() => onToggleTopic(topic.name)}
              />
              <Label 
                htmlFor={`topic-${topic.name}`}
                className="flex-1 cursor-pointer font-medium"
              >
                {topic.name}
              </Label>
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {selectedTopicsCount} topics selected
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {topics.length} total topics
          </Badge>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {selectedTopicsCount === 0 && !loading && !error && (
          <Alert>
            <AlertDescription>
              Please select at least one topic to proceed with the interview
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Button 
          onClick={onStartInterview}
          disabled={selectedTopicsCount === 0 || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing Interview...
            </>
          ) : (
            'Start Interview'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
