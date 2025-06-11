"use client";

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getAIResponse } from '../../services/azureAiservicesforJD';

import UploadSection from '@/components/JobDescription/UploadSection';
import QuestionsDisplay from '@/components/JobDescription/QuestionsDisplay';
import FeatureHighlights from '@/components/JobDescription/FeatureHighlights';

const UploadJDPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>(''); 
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [questions, setQuestions] = useState<string[]>([]);  const [questionType, setQuestionType] = useState<'technical' | 'behavioral' | ''>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setMessage('');
        setMessageType('');
        setQuestions([]);
      }
    }
  };

  const validateFile = (selectedFile: File): boolean => {
    const allowedTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage('Only PDF files are supported.');
      setMessageType('error');
      return false;
    }

    if (selectedFile.size > maxSize) {
      setMessage('File size must be less than 10MB');
      setMessageType('error');
      return false;
    }

    if (selectedFile.size < 100) {
      setMessage('PDF file appears to be corrupted or empty');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setMessage('');
      setMessageType('');
      setQuestions([]);
    }
  };  // Function to check if a line is a real question
  const isValidQuestion = (line: string): boolean => {
    const trimmedLine = line.trim();
    
    // Remove numbering and leading dashes
    const cleanLine = trimmedLine.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
    
    // Skip empty lines or very short lines
    if (cleanLine.length < 15) return false;
    
    // Common headers/categories to exclude (case insensitive)
    const excludePatterns = [
      /^(kiến thức|knowledge|experience|skills|competencies|abilities)/i,
      /^(technical|kỹ thuật|behavioral|hành vi|soft skills|hard skills)/i,
      /^(về|about|regarding|concerning)/i,
      /^(programming|lập trình|development|phát triển)/i,
      /^(framework|database|cơ sở dữ liệu|tools|công cụ)/i,
      /^(leadership|quản lý|management|teamwork|làm việc nhóm)/i
    ];
    
    // Check if it matches any exclude pattern
    const isExcluded = excludePatterns.some(pattern => pattern.test(cleanLine));
    if (isExcluded) return false;
    
    // Must contain question indicators
    const questionIndicators = [
      '?', 'như thế nào', 'tại sao', 'khi nào', 'ở đâu', 'ai là', 'gì là', 'sao lại', 
      'làm sao', 'bằng cách nào', 'có thể', 'hãy', 'mô tả', 'giải thích',
      'trình bày', 'what', 'how', 'why', 'when', 'where', 'who', 'which',
      'describe', 'explain', 'tell me', 'can you', 'do you', 'have you',
      'share', 'discuss', 'provide', 'give', 'show', 'demonstrate'
    ];
    
    const hasQuestionIndicator = questionIndicators.some(indicator => 
      cleanLine.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Additional patterns that indicate questions
    const questionPatterns = [
      /\?$/,  // Ends with question mark
      /^(how|what|why|when|where|who|which|can|do|have|are|is)/i,  // Starts with question words
      /^(hãy|mô tả|giải thích|trình bày|cho biết)/i,  // Vietnamese question starters
      /(experience|kinh nghiệm).*\?/i,  // Experience questions
      /(handle|xử lý).*\?/i,  // Handling questions
    ];
    
    const matchesQuestionPattern = questionPatterns.some(pattern => pattern.test(cleanLine));
    
    return hasQuestionIndicator || matchesQuestionPattern;
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file to upload.');
      setMessageType('error');
      return;
    }

    if (file.type !== 'application/pdf') {
      setMessage('Only PDF files are supported.');
      setMessageType('error');
      return;
    }

    if (!questionType) {
      setMessage('Please select a question type.');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('Processing file...');
    setMessageType('');

    try {
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process file.');
      }

      const { questions: extractedTextArr } = await response.json();
      const text = extractedTextArr?.[0] || '';

      if (!text.trim()) {
        throw new Error('No text content found in the file');
      }

      setMessage('Generating interview questions...');

      const aiResponse = await getAIResponse(text, [questionType]);

      // Filter and process only valid questions
      const allLines = aiResponse
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());

      // Filter out headers and keep only real questions
      const validQuestions = allLines
        .filter(line => isValidQuestion(line))
        .map((line, index) => {
          // Clean up the line and add numbering
          const cleanLine = line.replace(/^(\d+\.\s*)?/, '').replace(/^-\s*/, '').trim();
          return `${index + 1}. ${cleanLine}`;
        });

      if (validQuestions.length === 0) {
        throw new Error('No valid interview questions found. Please try with a different job description.');
      }

      setQuestions(validQuestions);
      setMessage(`Successfully generated ${validQuestions.length} interview questions!`);
      setMessageType('success');
    } catch (error) {
      console.error('Error processing file:', error);
      setMessage(error instanceof Error ? error.message : 'Error processing file. Please try again.');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = () => {
    setFile(null);
    setMessage('');
    setMessageType('');
    setQuestions([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyQuestions = () => {
    const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(questionsText);
    setMessage('Questions copied to clipboard!');
    setMessageType('success');
    setTimeout(() => {
      setMessage('');
    }, 2000);
  };

  const downloadQuestions = () => {
    const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const blob = new Blob([questionsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview-questions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Job Description</h1>
          <p className="text-gray-600 text-lg">Upload your job description file and we&apos;ll generate tailored interview questions for you.</p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <UploadSection 
            file={file}
            setFile={setFile}
            uploading={uploading}
            message={message}
            messageType={messageType}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
            handleButtonClick={handleButtonClick}
            removeFile={removeFile}
            formatFileSize={formatFileSize}
            questionType={questionType}
            setQuestionType={(type) => setQuestionType(type as 'technical' | 'behavioral' | '')}
            handleUpload={handleUpload}
          />
        </div>

        {/* Questions Display Section - Made larger and more prominent */}
        {questions.length > 0 && (
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Generated Interview Questions</h2>
                <p className="text-gray-600">Click on any question below to start practicing your answers</p>
              </div>
              
              <QuestionsDisplay 
                questions={questions}
                copyQuestions={copyQuestions}
                downloadQuestions={downloadQuestions}
              />
            </div>
          </div>
        )}

        <FeatureHighlights />
      </div>
    </DashboardLayout>
  );
};

export default UploadJDPage;
