import { NextRequest, NextResponse } from 'next/server';
import { JDValidationService } from '@/services/jdValidationService';

// Ensure Node.js runtime for PDF processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Test endpoint to verify route is working
export async function GET() {
  return NextResponse.json({ 
    message: 'PDF processing endpoint is accessible',
    runtime: 'nodejs',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/process-pdf called');
  
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType?.includes('application/pdf')) {
      console.log('Invalid content type:', contentType);
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Get the file data
    const arrayBuffer = await request.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });    }    // Use dynamic import for pdfjs-dist to avoid potential issues
    let text = '';
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      
      // Configure worker for server environment
      if (typeof window === 'undefined') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (pdfjsLib.GlobalWorkerOptions as any).workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.31/legacy/build/pdf.worker.mjs';
        } catch (err) {
          console.warn('Failed to set worker src:', err);
        }
      }

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0
      }).promise;

      // Extract text from all pages
      const textItems: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();        const pageText = textContent.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => 'str' in item)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str)
          .join(' ');
        textItems.push(pageText);
      }
      text = textItems.join('\n').trim();
    } catch (parseErr) {
      console.error('PDF parsing error:', parseErr);
      return NextResponse.json(
        { error: 'Failed to parse PDF. The file may be corrupted or not a valid PDF.' },
        { status: 400 }
      );
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
    });  } catch (err) {
    console.error('PDF processing error:', err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    
    // Return more detailed error information for debugging
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorDetails = process.env.NODE_ENV === 'development' ? 
      { error: 'Internal server error', details: errorMessage, stack: err instanceof Error ? err.stack : undefined } :
      { error: 'Internal server error', details: 'PDF processing failed' };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}