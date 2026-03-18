"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { savePhrase } from "@/app/actions";
import { SavedPhrase } from "@/lib/types";

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

function MicrophoneIcon({ className }: { className?: string }) {
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
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
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

interface TranslationResult {
  sourceText: string;
  targetText: string;
  audioBase64: string;
}

export default function TranslatePage() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAndTranslate(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch {
      setError("マイクの使用を許可してください");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAndTranslate = async (audioBlob: Blob) => {
    setIsTranslating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        throw new Error("音声を認識できませんでした");
      }

      const { text } = await transcribeRes.json();
      await translateText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setIsTranslating(false);
    }
  };

  const translateText = async (text: string) => {
    setIsTranslating(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLang: "ja",
          targetLang: "en",
        }),
      });

      if (!res.ok) {
        throw new Error("翻訳に失敗しました");
      }

      const data = await res.json();
      setResult(data);
      setInputText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await translateText(inputText.trim());
  };

  const playAudio = () => {
    if (!result?.audioBase64) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(result.audioBase64);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    } else {
      audioRef.current.src = result.audioBase64;
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

  const saveResult = async () => {
    if (!result) return;

    const phrase: SavedPhrase = {
      id: crypto.randomUUID(),
      nativeText: result.sourceText,
      targetText: result.targetText,
      nativeLang: "ja",
      targetLang: "en",
      audioBase64: result.audioBase64,
      createdAt: new Date().toISOString(),
    };

    await savePhrase(phrase);
    setSaved(true);
  };

  const handleSaveAndBack = async () => {
    await saveResult();
    router.push("/");
  };

  const resetResult = () => {
    setResult(null);
    setSaved(false);
    audioRef.current = null;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--color-primary)" }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          戻る
        </Link>
      </div>

      {/* Translation Result */}
      {result && (
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
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
            <div className="flex-1 min-w-0">
              <p
                className="text-xl font-medium leading-relaxed"
                style={{ color: "var(--color-text)" }}
              >
                {result.targetText}
              </p>
              <p
                className="text-sm mt-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {result.sourceText}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
            {saved ? (
              <Link
                href="/"
                className="btn flex-1 py-2.5 text-sm text-center"
                style={{
                  background: "var(--color-success)",
                  color: "white",
                }}
              >
                保存しました - ホームへ
              </Link>
            ) : (
              <>
                <button
                  onClick={handleSaveAndBack}
                  className="btn flex-1 py-2.5 text-sm"
                  style={{
                    background: "var(--color-primary)",
                    color: "white",
                  }}
                >
                  保存してホームへ
                </button>
                <button
                  onClick={resetResult}
                  className="btn px-4 py-2.5 text-sm"
                  style={{
                    background: "var(--color-border-light)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  続けて翻訳
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-xl mb-6 text-sm"
          style={{
            background: "rgb(239 68 68 / 0.1)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Input Section */}
      {!result && (
        <div>
          {/* Text Input */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="日本語を入力..."
              className="input w-full p-4 resize-none text-base"
              rows={4}
              disabled={isTranslating}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTranslating}
              className="btn btn-primary w-full py-3.5 text-base"
            >
              {isTranslating ? "翻訳中..." : "翻訳する"}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              または
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          </div>

          {/* Voice Input Button */}
          <div className="flex justify-center">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isTranslating}
              className="w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-lg"
              style={{
                background: isRecording
                  ? "var(--color-error)"
                  : isTranslating
                    ? "var(--color-text-muted)"
                    : "var(--color-primary)",
                color: "white",
                transform: isRecording ? "scale(1.08)" : "scale(1)",
              }}
            >
              <MicrophoneIcon className="w-8 h-8 mb-1" />
              <span className="text-xs font-medium opacity-90">
                {isRecording ? "録音中..." : "長押し"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
