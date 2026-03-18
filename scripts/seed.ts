import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

interface SeedPhrase {
  id: string;
  sceneId: string;
  targetText: string;
  targetLang: string;
  nativeText: string;
  nativeLang: string;
  note?: string;
  audioPath?: string;
}

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error("POSTGRES_URL is not set in .env.local");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const sql = neon(url);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Create table
  await sql`
    CREATE TABLE IF NOT EXISTS phrases (
      id TEXT PRIMARY KEY,
      native_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      native_lang VARCHAR(10) NOT NULL DEFAULT 'ja',
      target_lang VARCHAR(10) NOT NULL DEFAULT 'en',
      audio_base64 TEXT,
      audio_path TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_phrases_created_at ON phrases (created_at DESC)
  `;

  console.log("Table created.");

  // Load seed data
  const phrasesPath = path.join(process.cwd(), "data/phrases.json");
  const phrases: SeedPhrase[] = JSON.parse(
    fs.readFileSync(phrasesPath, "utf-8")
  );

  console.log(`Seeding ${phrases.length} phrases...`);

  for (const p of phrases) {
    // Generate TTS audio
    let audioBase64: string | null = null;
    try {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: p.targetText,
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      audioBase64 = `data:audio/mp3;base64,${buffer.toString("base64")}`;
      console.log(`  [TTS] ${p.targetText}`);
    } catch (err) {
      console.error(`  [TTS ERROR] ${p.targetText}: ${err}`);
    }

    await sql`
      INSERT INTO phrases (id, native_text, target_text, native_lang, target_lang, audio_base64, created_at)
      VALUES (
        ${p.id},
        ${p.nativeText},
        ${p.targetText},
        ${p.nativeLang},
        ${p.targetLang},
        ${audioBase64},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET audio_base64 = ${audioBase64}
    `;
  }

  console.log("Done!");
}

main().catch(console.error);
