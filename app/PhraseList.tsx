"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { SavedPhrase } from "@/lib/types";

const ITEMS_PER_PAGE = 5;

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
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

function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function PhraseList({ initialPhrases }: { initialPhrases: SavedPhrase[] }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const phrases = initialPhrases;
  const totalPages = Math.ceil(phrases.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const currentPhrases = phrases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const hasAudio = (phrase: SavedPhrase) => !!phrase.audioBase64;

  const playAudio = (phrase: SavedPhrase) => {
    const audioSrc = phrase.audioBase64;
    if (!audioSrc) return;

    if (playingId === phrase.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(audioSrc);
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.onerror = () => setPlayingId(null);
    audioRef.current.play();
    setPlayingId(phrase.id);
  };

  return (
    <div className="flex flex-col h-full">
      {phrases.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "var(--color-text-muted)" }}>
            右下の＋ボタンからフレーズを追加
          </p>
        </div>
      ) : (
        <>
          {/* Phrase List */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ul className="space-y-3">
              {currentPhrases.map((phrase) => (
                <li key={phrase.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    {hasAudio(phrase) ? (
                      <button
                        onClick={() => playAudio(phrase)}
                        className="icon-btn shrink-0 w-10 h-10"
                        style={{
                          background: playingId === phrase.id ? "var(--color-primary)" : "var(--color-border-light)",
                          color: playingId === phrase.id ? "white" : "var(--color-accent)",
                        }}
                        aria-label="音声を再生"
                      >
                        <SpeakerIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <div
                        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "var(--color-border-light)", color: "var(--color-text-muted)" }}
                      >
                        <SpeakerIcon className="w-4 h-4" />
                      </div>
                    )}
                    <Link href={`/phrases/${phrase.id}`} className="flex-1 min-w-0">
                      <p
                        className="text-base font-medium truncate"
                        style={{ color: "var(--color-text)" }}
                      >
                        {phrase.targetText}
                      </p>
                      <p
                        className="text-sm truncate mt-0.5"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {phrase.nativeText}
                      </p>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-center gap-4 py-4">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: currentPage === 0 ? "var(--color-border-light)" : "var(--color-primary)",
                  color: currentPage === 0 ? "var(--color-text-muted)" : "white",
                  opacity: currentPage === 0 ? 0.5 : 1,
                }}
                aria-label="前のページ"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: currentPage >= totalPages - 1 ? "var(--color-border-light)" : "var(--color-primary)",
                  color: currentPage >= totalPages - 1 ? "var(--color-text-muted)" : "white",
                  opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                }}
                aria-label="次のページ"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* FAB - Floating Action Button */}
      <Link
        href="/translate"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 hover:opacity-90"
        style={{
          background: "var(--color-primary)",
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        }}
        aria-label="翻訳して追加"
      >
        <PlusIcon className="w-6 h-6" />
      </Link>
    </div>
  );
}
