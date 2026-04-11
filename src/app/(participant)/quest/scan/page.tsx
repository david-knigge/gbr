"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/qr-scanner";
import { isCheckpointScanned, markCheckpointScanned } from "@/lib/quest-store";

interface ScanResult {
  checkpoint: { id: string; name: string; slug: string; description: string };
  question: {
    id: string;
    prompt: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string | null;
    correct_answer: string;
    explanation: string;
  } | null;
}

export default function ScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(token: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "scan failed");
      }

      const result: ScanResult = await res.json();

      // Check if already scanned locally
      if (isCheckpointScanned(result.checkpoint.id)) {
        setError("you've already scanned this checkpoint!");
        setLoading(false);
        return;
      }

      // Mark scanned in localStorage
      markCheckpointScanned(result.checkpoint.id, result.checkpoint.name);

      if (result.question) {
        const params = new URLSearchParams({
          checkpoint_id: result.checkpoint.id,
          checkpoint_name: result.checkpoint.name,
          question_id: result.question.id,
          prompt: result.question.prompt,
          answer_a: result.question.answer_a,
          answer_b: result.question.answer_b,
          answer_c: result.question.answer_c,
          correct_answer: result.question.correct_answer,
          explanation: result.question.explanation,
          ...(result.question.answer_d ? { answer_d: result.question.answer_d } : {}),
        });
        router.push(`/quest/question?${params.toString()}`);
      } else {
        // No question — just go back to map
        router.push("/");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "scan failed");
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[500] bg-background overflow-y-auto px-5 pt-8 space-y-5 pb-24">
      <button
        onClick={() => router.push("/")}
        aria-label="close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center text-muted hover:text-foreground z-10"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">scan checkpoint</h1>
        <p className="text-sm text-muted mt-1 font-medium">
          point your camera at a checkpoint QR code
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted font-bold text-lg">processing scan...</div>
        </div>
      ) : (
        <QRScanner
          onScan={handleScan}
          onError={(msg) => setError(msg)}
        />
      )}

      {error && (
        <div className="bg-error/10 text-error rounded-lg p-4 text-center text-sm font-bold">
          {error}
          <button
            onClick={() => {
              setError(null);
              setLoading(false);
            }}
            className="block mx-auto mt-2 text-teal font-bold text-sm"
          >
            try again
          </button>
        </div>
      )}
    </div>
  );
}
