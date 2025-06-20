import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { JDValidationService } from '@/services/jdValidationService';

export const runtime = 'nodejs';

// Helper function to extract text using pdfjs-dist
async function extractTextWithPdfjs(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  // Configure worker with error handling
  try {
    const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjsLib.GlobalWorkerOptions as any).workerSrc = workerPath;
  } catch (workerError) {
    console.warn('Worker configuration failed, using fallback:', workerError);
    // Fallback to CDN worker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjsLib.GlobalWorkerOptions as any).workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    verbosity: 0,
    disableAutoFetch: true,
    disableStream: true
  });

  interface PDFPage {
    getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
  }

  interface PDFDocument {
    numPages: number;
    getPage: (pageNum: number) => Promise<PDFPage>;
  }

  const pdf = await Promise.race([
    loadingTask.promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
    )
  ]) as PDFDocument;

  const textItems: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item) => 'str' in item)
      .map((item) => item.str)
      .join(' ');
    textItems.push(pageText);
  }
  
  return textItems.join('\n').trim();
}

// Helper function to extract text using pdf-parse as fallback
async function extractTextWithPdfParse(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfParse = await import('pdf-parse');
  const buffer = Buffer.from(arrayBuffer);
  const data = await pdfParse.default(buffer);
  return data.text.trim();
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }

    let text = '';
    try {
      // Try extracting text with pdfjs-dist
      text = await extractTextWithPdfjs(arrayBuffer);
    } catch (pdfjsError) {
      console.warn('pdfjs-dist extraction failed, trying pdf-parse:', pdfjsError);
      try {
        // Fallback to pdf-parse
        text = await extractTextWithPdfParse(arrayBuffer);
      } catch (pdfParseError) {
        console.error('PDF parsing error with both libraries:', pdfParseError);
        return NextResponse.json(
          { error: 'Failed to parse PDF. The file may be corrupted or not a valid PDF.' },
          { status: 400 }
        );
      }
    }    if (!text) {
      return NextResponse.json({ error: 'No readable text found in PDF' }, { status: 400 });
    }

    // Validate if the document is a Job Description
    const validationResult = JDValidationService.validateJD(text);
    
    if (!validationResult.isValidJD) {
      return NextResponse.json({
        error: 'Invalid Job Description',
        validation: {
          isValidJD: false,
          confidence: validationResult.confidence,
          message: JDValidationService.getValidationMessage(validationResult),
          suggestions: JDValidationService.getSuggestions(validationResult),
          detectedSections: validationResult.detectedSections,
          missingCriticalSections: validationResult.missingCriticalSections
        }
      }, { status: 422 }); // 422 Unprocessable Entity
    }

    // If validation passed, return the text for question generation
    const questions = [text]; // Return full text for AI processing

    return NextResponse.json({
      success: true,
      questions,
      validation: {
        isValidJD: true,
        confidence: validationResult.confidence,
        detectedSections: validationResult.detectedSections,
        message: JDValidationService.getValidationMessage(validationResult)
      }
    });
  } catch (err) {
    console.error('PDF processing error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}