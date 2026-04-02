"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { SavedPhrase } from "@/lib/types";
import { removePhrase } from "@/app/actions";
import { SpeakerIcon } from "@/app/icons";
import { CopyButton } from "@/app/CopyButton";

export function PhraseDetail({ phrase }: { phrase: SavedPhrase }) {
  const router = useRouter();
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasAudio = !!phrase.audioBase64;

  const playAudio = () => {
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

  const handleDelete = async () => {
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

  return (
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
              color: isPlaying ? "white" : "var(--color-accent)",
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
        <CopyButton text={phrase.targetText} />
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
  );
}
