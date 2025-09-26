"use client";
import React, { useState } from "react";
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from 'xlsx';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface CsvQuestionData {
  stem: string;
  type: string;
  level?: string;
  difficulty?: string;
  category?: string;
  fields?: string;
  topics?: string;
  skills?: string;
  tags?: string;
  explanation?: string;
  option1?: string;
  option1_correct?: boolean;
  option2?: string;
  option2_correct?: boolean;
  option3?: string;
  option3_correct?: boolean;
  option4?: string;
  option4_correct?: boolean;
}

export default function AdminQuestionImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Download Excel template
  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/api/admin/qb2/questions/csv-template';
    link.download = 'questions-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setValidationErrors([]);
    }
  };

  const validateCsvData = (data: CsvQuestionData[]): string[] => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 1;
      
      // Required fields validation
      if (!row.stem?.trim()) {
        errors.push(`Row ${rowNum}: stem is required`);
      }
      if (!row.type?.trim()) {
        errors.push(`Row ${rowNum}: type is required`);
      }
      if (!['single_choice', 'multiple_choice', 'free_text', 'scale', 'coding'].includes(row.type)) {
        errors.push(`Row ${rowNum}: invalid type "${row.type}"`);
      }
      if (row.level && !['junior', 'middle', 'senior'].includes(row.level)) {
        errors.push(`Row ${rowNum}: invalid level "${row.level}"`);
      }
      if (row.difficulty && !['easy', 'medium', 'hard'].includes(row.difficulty)) {
        errors.push(`Row ${rowNum}: invalid difficulty "${row.difficulty}"`);
      }
      
      // Options validation for choice questions
      if (['single_choice', 'multiple_choice'].includes(row.type)) {
        const hasOptions = [row.option1, row.option2, row.option3, row.option4].some(opt => opt?.trim());
        if (!hasOptions) {
          errors.push(`Row ${rowNum}: choice questions must have at least one option`);
        }
        
        const hasCorrectAnswer = [row.option1_correct, row.option2_correct, row.option3_correct, row.option4_correct]
          .some(correct => correct === true);
        if (!hasCorrectAnswer) {
          errors.push(`Row ${rowNum}: choice questions must have at least one correct answer`);
        }
      }
    });
    
    return errors;
  };

  const parseExcelFile = (file: File): Promise<CsvQuestionData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get the first worksheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false 
          }) as string[][];
          
          if (jsonData.length < 3) {
            reject(new Error('Excel file must have header row, instruction row, and at least one data row'));
            return;
          }
          
          // Get headers from first row and create mapping
          const excelHeaders = jsonData[0].map(h => String(h).trim());
          const headerMapping: Record<string, string> = {
            'Question Text*': 'stem',
            'Type*': 'type',
            'Level': 'level', 
            'Difficulty': 'difficulty',
            'Category': 'category',
            'Fields': 'fields',
            'Topics': 'topics',
            'Skills': 'skills',
            'Tags': 'tags',
            'Explanation': 'explanation',
            'Option 1': 'option1',
            'Option 1 Correct': 'option1_correct',
            'Option 2': 'option2',
            'Option 2 Correct': 'option2_correct', 
            'Option 3': 'option3',
            'Option 3 Correct': 'option3_correct',
            'Option 4': 'option4',
            'Option 4 Correct': 'option4_correct'
          };
          
          // Process data rows (skip header and instruction row)
          const dataRows = jsonData.slice(2).filter(row => 
            row.some(cell => cell && String(cell).trim() !== '' && 
                    !String(cell).startsWith('Enter your') && 
                    !String(cell).startsWith('Row '))
          );
          
          const result = dataRows.map((row) => {
            const obj: Record<string, unknown> = {};
            
            excelHeaders.forEach((excelHeader, colIndex) => {
              const apiField = headerMapping[excelHeader] || excelHeader.toLowerCase().replace(/[^a-z0-9_]/g, '_');
              let value: string | boolean | null = row[colIndex];
              
              if (value !== undefined && value !== null) {
                value = String(value).trim();
                
                // Convert boolean strings
                if (value === 'true' || value === '1' || value === 'TRUE') value = true;
                else if (value === 'false' || value === '0' || value === 'FALSE') value = false;
                else if (value === '' || value === 'undefined') value = null;
              } else {
                value = null;
              }
              
              obj[apiField] = value;
            });
            
            return obj as unknown as CsvQuestionData;
          });
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const processImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setResult(null);
    setValidationErrors([]);
    
    try {
      // Parse Excel
      const data = await parseExcelFile(file);
      console.log('Parsed Excel data:', data); // Debug log
      
      // Validate data
      const errors = validateCsvData(data);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setImporting(false);
        return;
      }
      
      // Process import
      const response = await fetch('/api/admin/qb2/questions/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: data }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      setResult(result);
      
    } catch (error) {
      console.error('Import error:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Unknown error']);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Questions</h1>
          <p className="text-gray-600 mt-1">Import multiple questions from Excel file (.xlsx)</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Download Excel Template
        </button>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <FileText className="w-4 h-4" />
          {showPreview ? 'Hide Preview' : 'Preview Excel Format'}
        </button>
      </div>

      {/* CSV Format Preview */}
      {showPreview && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Excel Template Preview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Example</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  { field: 'stem', desc: 'The question text', example: 'What is React?', required: 'Yes' },
                  { field: 'type', desc: 'Question type', example: 'single_choice', required: 'Yes' },
                  { field: 'level', desc: 'Difficulty level', example: 'junior', required: 'No' },
                  { field: 'difficulty', desc: 'Question difficulty', example: 'easy', required: 'No' },
                  { field: 'category', desc: 'Question category', example: 'Frontend', required: 'No' },
                  { field: 'fields', desc: 'Related fields (comma-separated)', example: 'Frontend Development', required: 'No' },
                  { field: 'topics', desc: 'Question topics (comma-separated)', example: 'React Basics', required: 'No' },
                  { field: 'skills', desc: 'Required skills (comma-separated)', example: 'React', required: 'No' },
                  { field: 'tags', desc: 'Tags (comma-separated)', example: 'JavaScript,Library', required: 'No' },
                  { field: 'explanation', desc: 'Answer explanation', example: 'React is a JavaScript library...', required: 'No' },
                  { field: 'option1', desc: 'First option text', example: 'A JavaScript library', required: 'For choice questions' },
                  { field: 'option1_correct', desc: 'Is first option correct?', example: 'true', required: 'For choice questions' },
                  { field: 'option2-4', desc: 'Additional options', example: 'Similar to option1', required: 'For choice questions' }
                ].map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-blue-600">{row.field}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700">{row.desc}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600 italic">{row.example}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.required === 'Yes' ? 'bg-red-100 text-red-700' : 
                        row.required === 'For choice questions' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {row.required}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Sample Data Preview:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Row 1:</strong> React single choice question (junior level)</p>
              <p><strong>Row 2:</strong> JavaScript free text question (middle level)</p>
              <p><strong>Row 3:</strong> System design question (senior level)</p>
              <p><strong>Row 4:</strong> SQL multiple choice question (middle level)</p>
              <p><strong>Row 5:</strong> Algorithm question (middle level)</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
          <p className="text-gray-600 mb-4">
            Select an Excel file (.xlsx) with question data. Download the template above for the correct format.
          </p>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Choose File
          </label>
          
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800">Validation Errors</h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-800">Import Completed</h3>
          </div>
          <div className="text-sm text-green-700">
            <p>✅ Successfully imported: {result.success} questions</p>
            {result.failed > 0 && <p>❌ Failed: {result.failed} questions</p>}
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside ml-4">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={processImport}
          disabled={!file || importing}
          className={`px-6 py-2 rounded-lg font-medium ${
            !file || importing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {importing ? 'Importing...' : 'Import Questions'}
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Back to Questions
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">CSV Format Instructions:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>Required fields:</strong> stem, type</li>
          <li><strong>Question types:</strong> single_choice, multiple_choice, free_text, scale, coding</li>
          <li><strong>Levels:</strong> junior, middle, senior</li>
          <li><strong>Difficulty:</strong> easy, medium, hard</li>
          <li><strong>Multiple values:</strong> Separate with commas (fields, topics, skills, tags)</li>
          <li><strong>Options:</strong> For choice questions, use option1-4 and option1_correct-4_correct columns</li>
          <li><strong>Boolean values:</strong> Use true/false or 1/0</li>
        </ul>
      </div>
    </div>
  );
}
