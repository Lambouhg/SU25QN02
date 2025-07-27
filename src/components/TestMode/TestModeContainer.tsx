/**
 * TestModeContainer.tsx
 * Container component for the Test Mode feature
 */

import React from 'react';
import TestMode from './TestModeSimple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestModeContainer() {
  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Technical Interview Simulator</CardTitle>
          <CardDescription>
            Experience a realistic AI-driven technical interview to prepare for your next job opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestMode />
        </CardContent>
      </Card>
    </div>
  );
}
