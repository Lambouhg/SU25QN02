import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions Template', {
      properties: { tabColor: { argb: 'FF4472C4' } }
    });

    // Define headers with descriptions
    const headers = [
      { key: 'stem', header: 'Question Text*', width: 50 },
      { key: 'type', header: 'Type*', width: 15 },
      { key: 'level', header: 'Level', width: 12 },
      { key: 'difficulty', header: 'Difficulty', width: 12 },
      { key: 'category', header: 'Category', width: 20 },
      { key: 'fields', header: 'Fields', width: 25 },
      { key: 'topics', header: 'Topics', width: 25 },
      { key: 'skills', header: 'Skills', width: 25 },
      { key: 'tags', header: 'Tags', width: 20 },
      { key: 'explanation', header: 'Explanation', width: 40 },
      { key: 'option1', header: 'Option 1', width: 30 },
      { key: 'option1_correct', header: 'Option 1 Correct', width: 15 },
      { key: 'option2', header: 'Option 2', width: 30 },
      { key: 'option2_correct', header: 'Option 2 Correct', width: 15 },
      { key: 'option3', header: 'Option 3', width: 30 },
      { key: 'option3_correct', header: 'Option 3 Correct', width: 15 },
      { key: 'option4', header: 'Option 4', width: 30 },
      { key: 'option4_correct', header: 'Option 4 Correct', width: 15 }
    ];

    // Set columns
    worksheet.columns = headers;

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add instructions row
    const instructionRow = worksheet.addRow([
      'Enter your question text here',
      'single_choice, multiple_choice, or free_text',
      'junior, middle, senior',
      'easy, medium, hard',
      'Frontend, Backend, Database, etc.',
      'Comma-separated fields',
      'Comma-separated topics',
      'Comma-separated skills',
      'Comma-separated tags',
      'Detailed explanation of the answer',
      'First answer option',
      'true or false',
      'Second answer option (optional)',
      'true or false',
      'Third answer option (optional)',
      'true or false',
      'Fourth answer option (optional)',
      'true or false'
    ]);

    // Style instruction row
    instructionRow.height = 20;
    instructionRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      cell.font = {
        italic: true,
        size: 10,
        color: { argb: 'FF666666' }
      };
      cell.alignment = {
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add sample data rows
    const sampleData = [
      {
        stem: 'What is React?',
        type: 'single_choice',
        level: 'junior',
        difficulty: 'easy',
        category: 'Frontend',
        fields: 'Frontend Development',
        topics: 'React Basics',
        skills: 'React, JavaScript',
        tags: 'JavaScript, Library, Component',
        explanation: 'React is a JavaScript library for building user interfaces, particularly web applications.',
        option1: 'A JavaScript library for building user interfaces',
        option1_correct: 'true',
        option2: 'A database management system',
        option2_correct: 'false',
        option3: 'A server-side framework',
        option3_correct: 'false',
        option4: 'A CSS preprocessor',
        option4_correct: 'false'
      },
      {
        stem: 'Explain the concept of closures in JavaScript',
        type: 'free_text',
        level: 'middle',
        difficulty: 'medium',
        category: 'Frontend',
        fields: 'Frontend Development',
        topics: 'JavaScript Advanced',
        skills: 'JavaScript, Functional Programming',
        tags: 'Closure, Scope, Function',
        explanation: 'A closure is a function that retains access to variables from its outer scope even after the outer function has returned.',
        option1: '',
        option1_correct: '',
        option2: '',
        option2_correct: '',
        option3: '',
        option3_correct: '',
        option4: '',
        option4_correct: ''
      },
      {
        stem: 'Which of the following are principles of microservices architecture?',
        type: 'multiple_choice',
        level: 'senior',
        difficulty: 'hard',
        category: 'System Design',
        fields: 'System Architecture',
        topics: 'Microservices, Architecture',
        skills: 'System Design, Architecture',
        tags: 'Microservices, Distributed Systems',
        explanation: 'Microservices architecture involves single responsibility, decentralized governance, and failure isolation.',
        option1: 'Single responsibility principle',
        option1_correct: 'true',
        option2: 'Decentralized governance',
        option2_correct: 'true',
        option3: 'Shared database across services',
        option3_correct: 'false',
        option4: 'Failure isolation',
        option4_correct: 'true'
      },
      {
        stem: 'What is the primary key in a database?',
        type: 'single_choice',
        level: 'middle',
        difficulty: 'medium',
        category: 'Database',
        fields: 'Database Management',
        topics: 'Database Design, Keys',
        skills: 'SQL, Database Design',
        tags: 'Database, Primary Key, SQL',
        explanation: 'A primary key is a unique identifier for each record in a database table.',
        option1: 'A unique identifier for each record',
        option1_correct: 'true',
        option2: 'A field that can contain duplicate values',
        option2_correct: 'false',
        option3: 'A foreign key reference',
        option3_correct: 'false',
        option4: 'An optional field in a table',
        option4_correct: 'false'
      },
      {
        stem: 'Implement a function to find the factorial of a number',
        type: 'free_text',
        level: 'middle',
        difficulty: 'medium',
        category: 'Algorithm',
        fields: 'Programming',
        topics: 'Algorithms, Recursion',
        skills: 'Algorithm Design, Programming',
        tags: 'Factorial, Recursion, Math',
        explanation: 'Factorial can be implemented using recursion or iteration.',
        option1: '',
        option1_correct: '',
        option2: '',
        option2_correct: '',
        option3: '',
        option3_correct: '',
        option4: '',
        option4_correct: ''
      }
    ];

    // Add sample data rows
    sampleData.forEach((data, index) => {
      const row = worksheet.addRow(data);
      row.height = 20;
      
      // Style data rows
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: 'top',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Alternate row colors
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        }
        
        // Highlight required fields
        if (colNumber === 1 || colNumber === 2) { // stem and type columns
          cell.font = { bold: true };
        }
        
        // Color code correct answers
        if (cell.value === 'true') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
          cell.font = { color: { argb: 'FF155724' }, bold: true };
        } else if (cell.value === 'false') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' }
          };
          cell.font = { color: { argb: 'FF721C24' } };
        }
      });
    });

    // Add notes worksheet
    const notesWorksheet = workbook.addWorksheet('Instructions', {
      properties: { tabColor: { argb: 'FF28A745' } }
    });

    // Add instructions content
    const instructions = [
      ['Field', 'Description', 'Required', 'Examples'],
      ['stem', 'The main question text', 'Yes', 'What is React? | Explain closures in JavaScript'],
      ['type', 'Type of question', 'Yes', 'single_choice | multiple_choice | free_text'],
      ['level', 'Difficulty level for job roles', 'No', 'junior | middle | senior'],
      ['difficulty', 'Question difficulty', 'No', 'easy | medium | hard'],
      ['category', 'Question category', 'No', 'Frontend | Backend | Database | Algorithm'],
      ['fields', 'Related fields (comma-separated)', 'No', 'Frontend Development, React'],
      ['topics', 'Question topics (comma-separated)', 'No', 'React Basics, State Management'],
      ['skills', 'Required skills (comma-separated)', 'No', 'React, JavaScript, TypeScript'],
      ['tags', 'Tags for categorization (comma-separated)', 'No', 'JavaScript, Library, Component'],
      ['explanation', 'Detailed answer explanation', 'No', 'React is a JavaScript library...'],
      ['option1-4', 'Answer options (for choice questions)', 'For choice types', 'A JavaScript library'],
      ['option1-4_correct', 'Whether option is correct (true/false)', 'For choice types', 'true | false']
    ];

    // Set columns for instructions
    notesWorksheet.columns = [
      { key: 'field', header: 'Field', width: 20 },
      { key: 'description', header: 'Description', width: 40 },
      { key: 'required', header: 'Required', width: 15 },
      { key: 'examples', header: 'Examples', width: 40 }
    ];

    // Add instruction rows
    instructions.forEach((row, index) => {
      const worksheetRow = notesWorksheet.addRow(row);
      worksheetRow.height = 25;
      
      worksheetRow.eachCell((cell) => {
        if (index === 0) {
          // Header row
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF28A745' }
          };
          cell.font = {
            color: { argb: 'FFFFFFFF' },
            bold: true,
            size: 11
          };
        } else {
          // Data rows
          cell.font = { size: 10 };
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          }
        }
        
        cell.alignment = {
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="questions-template.xlsx"',
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating Excel template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template file' },
      { status: 500 }
    );
  }
}
