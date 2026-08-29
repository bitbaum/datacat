import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    const { file, prompt, isPDF } = await req.json();
    if (!file?.base64 || !file?.mimeType || !prompt) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt as string },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.mimeType};base64,${file.base64}`,
                detail: 'low',
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'text' },
    });

    const content = completion.choices?.[0]?.message?.content || '';
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('OpenAI Vision API Error:', error);

    // Handle specific OpenAI errors
    if (error.status === 429) {
      return NextResponse.json(
        {
          error:
            'OpenAI quota exceeded. Please check your billing at platform.openai.com/account/billing and add payment method or wait for quota reset.',
        },
        { status: 429 },
      );
    }

    if (error.status === 401) {
      return NextResponse.json(
        {
          error: 'Invalid OpenAI API key. Please check your configuration.',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'OpenAI Vision API error',
      },
      { status: 500 },
    );
  }
}
