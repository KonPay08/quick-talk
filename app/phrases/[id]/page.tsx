import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhraseById } from "@/lib/db";
import { PhraseDetail } from "./PhraseDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhrasePage({ params }: PageProps) {
  const { id } = await params;
  const phrase = await getPhraseById(id);

  if (!phrase) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--color-accent)" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          ホーム
        </Link>
      </div>
      <PhraseDetail phrase={phrase} />
    </div>
  );
}
