import { neon } from "@neondatabase/serverless";
import { cacheTag } from "next/cache";
import { SavedPhrase } from "./types";

function getSQL() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL is not set");
  return neon(url);
}

interface PhraseRow {
  id: string;
  native_text: string;
  target_text: string;
  native_lang: string;
  target_lang: string;
  audio_base64: string | null;
  created_at: string;
}

function rowToPhrase(row: PhraseRow): SavedPhrase {
  return {
    id: row.id,
    nativeText: row.native_text,
    targetText: row.target_text,
    nativeLang: row.native_lang,
    targetLang: row.target_lang,
    audioBase64: row.audio_base64 ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getAllPhrases(): Promise<SavedPhrase[]> {
  "use cache";
  cacheTag("phrases");
  const sql = getSQL();
  const rows = (await sql`
    SELECT * FROM phrases ORDER BY created_at DESC
  `) as PhraseRow[];
  return rows.map(rowToPhrase);
}

export async function getPhraseById(id: string): Promise<SavedPhrase | null> {
  "use cache";
  cacheTag("phrases");
  const sql = getSQL();
  const rows = (await sql`
    SELECT * FROM phrases WHERE id = ${id}
  `) as PhraseRow[];
  if (rows.length === 0) return null;
  return rowToPhrase(rows[0]);
}

export async function insertPhrase(phrase: SavedPhrase): Promise<void> {
  const sql = getSQL();
  await sql`
    INSERT INTO phrases (id, native_text, target_text, native_lang, target_lang, audio_base64, created_at)
    VALUES (
      ${phrase.id},
      ${phrase.nativeText},
      ${phrase.targetText},
      ${phrase.nativeLang},
      ${phrase.targetLang},
      ${phrase.audioBase64 ?? null},
      ${phrase.createdAt}
    )
  `;
}

export async function deletePhraseById(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM phrases WHERE id = ${id}`;
}
