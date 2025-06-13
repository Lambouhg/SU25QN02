"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getAIResponse } from '../../services/azureAiservicesforJD';
import { questionSetService } from '@/services/questionSetService';

import UploadSection from '@/components/JobDescription/UploadSection';
import QuestionsDisplay from '@/components/JobDescription/QuestionsDisplay';
import FeatureHighlights from '@/components/JobDescription/FeatureHighlights';
import SavedQuestionSets from '@/components/JobDescription/SavedQuestionSets';
import Toast from '@/components/ui/Toast';
import type { QuestionSetData } from '@/services/questionSetService';

const UploadJDPage = () => {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>(''); 
  const [dragActive, setDragActive] = useState<boolean>(false);  const [questions, setQuestions] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<'technical' | 'behavioral' | ''>('');
  const [level, setLevel] = useState<'junior' | 'mid' | 'senior'>('junior');
  const [currentQuestionSetId, setCurrentQuestionSetId] = useState<string | null>(null);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Key for localStorage
  const STORAGE_KEY = 'jd_page_state';

  // Toast helper function
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Load state from localStorage on component mount
  useEffect(() => {
    try {
      // Check if there's a questionSetId in URL params
      const questionSetId = searchParams.get('questionSetId');
      if (questionSetId) {
        // Load specific question set from database
        loadQuestionSetFromId(questionSetId);
        return;
      }

      // Otherwise, load from localStorage
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.questions && state.questions.length > 0) {
          setQuestions(state.questions);
          setQuestionType(state.questionType || '');
          setLevel(state.level || 'junior');
          setCurrentQuestionSetId(state.currentQuestionSetId || null);
          setMessage(`Restored ${state.questions.length} questions from previous session`);
          setMessageType('success');
          
          // Clear message after 3 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, [searchParams]);

  // Load question set from database by ID
  const loadQuestionSetFromId = async (questionSetId: string) => {
    try {
      const questionSet = await questionSetService.getQuestionSet(questionSetId);
      setQuestions(questionSet.questions);
      setQuestionType(questionSet.questionType);
      setLevel(questionSet.level);
      setCurrentQuestionSetId(questionSet._id || null);
      setMessage(`Loaded ${questionSet.questions.length} questions from "${questionSet.jobTitle}"`);
      setMessageType('success');
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      console.error('Error loading question set:', error);
      setMessage('Failed to load question set');
      setMessageType('error');
    }
  };

  // Save state to localStorage whenever questions change
  useEffect(() => {
    if (questions.length > 0) {
      const state = {
        questions,
        questionType,
        level,
        currentQuestionSetId,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [questions, questionType, level, currentQuestionSetId]);

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
        // Show success toast for drag & drop
        showToastMessage(`📎 File "${droppedFile.name}" uploaded successfully!`, 'success');
      }
    }
  };
  const validateFile = (selectedFile: File): boolean => {
    const allowedTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage('Only PDF files are supported.');
      setMessageType('error');
      showToastMessage('❌ Only PDF files are supported', 'error');
      return false;
    }

    if (selectedFile.size > maxSize) {
      setMessage('File size must be less than 10MB');
      setMessageType('error');
      showToastMessage('📏 File size must be less than 10MB', 'error');
      return false;
    }

    if (selectedFile.size < 100) {
      setMessage('PDF file appears to be corrupted or empty');
      setMessageType('error');
      showToastMessage('🚫 PDF file appears to be corrupted or empty', 'error');
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
      // Show success toast for file selection
      showToastMessage(`📎 File "${selectedFile.name}" selected successfully!`, 'success');
    }
  };// Function to check if a line is a real question
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
      showToastMessage(' Please select a file first', 'error');
      return;
    }

    if (file.type !== 'application/pdf') {
      setMessage('Only PDF files are supported.');
      setMessageType('error');
      showToastMessage('❌ Only PDF files are supported', 'error');
      return;
    }

    if (!questionType) {
      setMessage('Please select a question type.');
      setMessageType('error');
      showToastMessage('❓ Please select a question type', 'error');
      return;
    }setUploading(true);
    setMessage('Processing file...');
    setMessageType('');

    // Show processing toast
    showToastMessage('Processing your job description...', 'info');

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
      
      // Show AI generation toast
      showToastMessage('AI is generating your interview questions...', 'info');

      const aiResponse = await getAIResponse(text, [], {
        questionType: questionType,
        language: 'vi',
        level: level
      });

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
      }      setQuestions(validQuestions);
      setMessage(`Successfully generated ${validQuestions.length} interview questions!`);
      setMessageType('success');

      // Show success toast
      showToastMessage(`Successfully generated ${validQuestions.length} interview questions!`, 'success');

      // Tự động lưu question set vào database
      try {
        const jobTitle = questionSetService.extractJobTitle(file.name, text);
        await questionSetService.saveQuestionSet({
          jobTitle,
          questionType: questionType as 'technical' | 'behavioral',
          level,
          questions: validQuestions,
          originalJDText: text,
          fileName: file.name
        });
        console.log('Question set saved successfully');
        
        // Show save success toast after a delay
        setTimeout(() => {
          showToastMessage('Questions saved to your library!', 'info');
        }, 2000);
      } catch (saveError) {
        console.error('Error saving question set:', saveError);
        showToastMessage('⚠️ Questions generated but failed to save to library', 'warning');
      }    } catch (error) {
      console.error('Error processing file:', error);
      setMessage(error instanceof Error ? error.message : 'Error processing file. Please try again.');
      setMessageType('error');
      showToastMessage(`❌ ${error instanceof Error ? error.message : 'Error processing file. Please try again.'}`, 'error');
    } finally {
      setUploading(false);
    }
  };  const handleQuestionSetSelect = (questionSet: QuestionSetData) => {
    setQuestions(questionSet.questions);
    setQuestionType(questionSet.questionType);
    setLevel(questionSet.level);
    setCurrentQuestionSetId(questionSet._id || null);
    setMessage(`Loaded ${questionSet.questions.length} questions from "${questionSet.jobTitle}"`);
    setMessageType('success');
    
    // Show toast for loading saved question set
    showToastMessage(`Loaded ${questionSet.questions.length} questions from "${questionSet.jobTitle}"`, 'success');
    
    // Clear sau 3 giây
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);

    // Scroll to questions section
    setTimeout(() => {
      const questionsSection = document.getElementById('questions-section');
      if (questionsSection) {
        questionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
    setCurrentQuestionSetId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear localStorage when removing file
    localStorage.removeItem(STORAGE_KEY);
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
    
    // Show toast for copy action
    showToastMessage('Questions copied to clipboard!', 'success');
    
    setTimeout(() => {
      setMessage('');
    }, 2000);
  };  const downloadQuestions = () => {
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
    
    // Show toast for download action
    showToastMessage('Questions downloaded successfully!', 'success');
  };
  const clearCurrentSession = () => {
    setQuestions([]);
    setQuestionType('');
    setLevel('junior');
    setCurrentQuestionSetId(null);
    setMessage('');
    setMessageType('');
    localStorage.removeItem(STORAGE_KEY);
    
    // Show toast for clear action
    showToastMessage('Current session cleared!', 'info');
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
            removeFile={removeFile}            formatFileSize={formatFileSize}
            questionType={questionType}
            setQuestionType={(type) => setQuestionType(type as 'technical' | 'behavioral' | '')}
            level={level}
            setLevel={(selectedLevel) => setLevel(selectedLevel as 'junior' | 'mid' | 'senior')}
            handleUpload={handleUpload}          />
        </div>

        {/* Saved Question Sets Section */}
        <div className="mb-12">
          <SavedQuestionSets onQuestionSetSelect={handleQuestionSetSelect} />
        </div>        {/* Questions Display Section - Made larger and more prominent */}
        {questions.length > 0 && (
          <div id="questions-section" className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Generated Interview Questions</h2>
                <p className="text-gray-600">Click on any question below to start practicing your answers</p>
              </div><QuestionsDisplay 
                questions={questions}
                copyQuestions={copyQuestions}
                downloadQuestions={downloadQuestions}
                clearSession={clearCurrentSession}
                currentQuestionSetId={currentQuestionSetId}
              />
            </div>
          </div>
        )}        <FeatureHighlights />
      </div>

      {/* Toast Notifications */}
      <Toast 
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </DashboardLayout>
  );
};

export default UploadJDPage;
