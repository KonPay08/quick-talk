"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SavedPhrase } from "@/lib/types";
import { fetchPhrase, removePhrase } from "@/app/actions";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PhrasePage({ params }: PageProps) {
  const router = useRouter();
  const [phrase, setPhrase] = useState<SavedPhrase | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadData() {
      const { id } = await params;
      const foundPhrase = await fetchPhrase(id);
      setPhrase(foundPhrase);
      setIsLoading(false);
    }
    loadData();
  }, [params]);

  const playAudio = () => {
    if (!phrase) return;

    const audioSrc = phrase.audioBase64;
    if (!audioSrc) return;

    setAudioError(null);

    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setAudioError("再生できません");
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const copyToClipboard = useCallback(async () => {
    if (!phrase) return;
    try {
      await navigator.clipboard.writeText(phrase.targetText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: do nothing
    }
  }, [phrase]);

  const handleDelete = async () => {
    if (!phrase) return;
    if (confirm("このフレーズを削除しますか？")) {
      await removePhrase(phrase.id);
      router.push("/");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p style={{ color: "var(--color-text-muted)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!phrase) {
    return (
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm"
          style={{ color: "var(--color-primary)" }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          ホーム
        </Link>
        <p className="mt-8" style={{ color: "var(--color-text-muted)" }}>
          フレーズが見つかりません
        </p>
      </div>
    );
  }

  const hasAudio = !!phrase.audioBase64;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--color-primary)" }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          ホーム
        </Link>
      </div>

      <div className="card p-6">
        {/* Target Language Text */}
        <div className="mb-4">
          <p
            className="text-xl font-medium leading-relaxed"
            style={{ color: "var(--color-text)" }}
          >
            {phrase.targetText}
          </p>
          <p
            className="text-sm mt-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {phrase.nativeText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-4">
          {hasAudio ? (
            <button
              onClick={playAudio}
              className="icon-btn shrink-0 w-11 h-11"
              style={{
                background: isPlaying ? "var(--color-primary)" : "var(--color-border-light)",
                color: isPlaying ? "white" : "var(--color-primary)",
              }}
              aria-label="音声を再生"
            >
              <SpeakerIcon className="w-5 h-5" />
            </button>
          ) : (
            <div
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-border-light)", color: "var(--color-text-muted)" }}
            >
              <SpeakerIcon className="w-5 h-5" />
            </div>
          )}
          <button
            onClick={copyToClipboard}
            className="icon-btn shrink-0 w-11 h-11"
            style={{
              background: copied ? "var(--color-primary)" : "var(--color-border-light)",
              color: copied ? "white" : "var(--color-primary)",
              transition: "background 0.2s, color 0.2s",
            }}
            aria-label="テキストをコピー"
          >
            {copied ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              <CopyIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Error Message */}
        {audioError && (
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-error)" }}
          >
            {audioError}
          </p>
        )}

        {/* Date & Delete */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {formatDate(phrase.createdAt)}
          </p>
          <button
            onClick={handleDelete}
            className="text-sm transition-colors"
            style={{ color: "var(--color-error)" }}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
