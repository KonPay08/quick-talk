"use server";

import { revalidatePath } from "next/cache";
import {
  getAllPhrases,
  getPhraseById,
  insertPhrase,
  deletePhraseById,
} from "@/lib/db";
import { SavedPhrase } from "@/lib/types";

export async function fetchPhrases(): Promise<SavedPhrase[]> {
  return getAllPhrases();
}

export async function fetchPhrase(id: string): Promise<SavedPhrase | null> {
  return getPhraseById(id);
}

export async function savePhrase(phrase: SavedPhrase): Promise<void> {
  await insertPhrase(phrase);
  revalidatePath("/");
}

export async function removePhrase(id: string): Promise<void> {
  await deletePhraseById(id);
  revalidatePath("/");
}
