import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, sourceLang, targetLang } = body;

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: "text, sourceLang, targetLang are required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    // Translate using GPT
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following text from ${sourceLang} to ${targetLang}. Only output the translation, nothing else.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    const targetText =
      translationResponse.choices[0]?.message?.content?.trim() || "";

    if (!targetText) {
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 500 }
      );
    }

    // Generate TTS for the translated text
    const ttsResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: targetText,
    });

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const audioBase64 = `data:audio/mp3;base64,${audioBuffer.toString("base64")}`;

    return NextResponse.json({
      sourceText: text,
      targetText,
      audioBase64,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "翻訳に失敗しました" },
      { status: 500 }
    );
  }
}
