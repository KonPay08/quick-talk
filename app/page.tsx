import { getAllPhrases } from "@/lib/db";
import { PhraseList } from "./PhraseList";

export default async function HomePage() {
  const phrases = await getAllPhrases();
  return <PhraseList initialPhrases={phrases} />;
}
