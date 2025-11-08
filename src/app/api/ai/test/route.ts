import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // check if api key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'api key not configured' },
        { status: 500 }
      );
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash' });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('gemini api error:', error);
    console.error('error details:', error.message);
    return NextResponse.json(
      { error: `failed to generate response: ${error.message}` },
      { status: 500 }
    );
  }
}