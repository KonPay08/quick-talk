"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/app/icons";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="icon-btn shrink-0 w-11 h-11"
      style={{
        background: copied ? "var(--color-success)" : "var(--color-border-light)",
        color: copied ? "white" : "var(--color-accent)",
        transition: "background 0.2s, color 0.2s",
      }}
      aria-label="コピー"
    >
      {copied ? (
        <CheckIcon className="w-5 h-5" />
      ) : (
        <CopyIcon className="w-5 h-5" />
      )}
    </button>
  );
}
