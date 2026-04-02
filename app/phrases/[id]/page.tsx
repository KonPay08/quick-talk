import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhraseById } from "@/lib/db";
import { PhraseDetail } from "./PhraseDetail";
import { ChevronLeftIcon } from "@/app/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function PhraseContent({ id }: { id: string }) {
  const phrase = await getPhraseById(id);
  if (!phrase) notFound();
  return <PhraseDetail phrase={phrase} />;
}

export default async function PhrasePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--color-accent)" }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          ホーム
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="card p-6 animate-pulse">
            <div className="h-6 rounded" style={{ background: "var(--color-border-light)", width: "70%" }} />
            <div className="h-4 rounded mt-3" style={{ background: "var(--color-border-light)", width: "50%" }} />
          </div>
        }
      >
        <PhraseContent id={id} />
      </Suspense>
    </div>
  );
}
