import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';
import { pathToFileURL } from 'url';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });    }    // Configure pdfjs-dist for Node.js environment
    // Use absolute path to worker file and convert to file URL for Windows
    const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
    const workerUrl = pathToFileURL(workerPath).href;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjsLib.GlobalWorkerOptions as any).workerSrc = workerUrl;

    let text = '';
    try {
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
    }

    if (!text) {
      return NextResponse.json({ error: 'No readable text found in PDF' }, { status: 400 });
    }

    const questions = text
      .split('\n')
      .filter(line => line.trim() !== '')
      .slice(0, 5);

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('PDF processing error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
