import React from "react";
import { ResultsSummary } from '@/components/ui/test-mode/ResultsSummary';

interface ResultScreenProps {
  results: any;
  realTimeScores: any;
  onReset: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ results, realTimeScores, onReset }) => {
  return (
    <ResultsSummary results={results} realTimeScores={realTimeScores} onReset={onReset} />
  );
};

export default ResultScreen; 