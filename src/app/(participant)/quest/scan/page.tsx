"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/qr-scanner";
import { apiFetch } from "@/lib/api-client";
import type { ScanResponse } from "@/lib/types";

export default function ScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(token: string) {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<ScanResponse>("/api/scan", {
        method: "POST",
        body: JSON.stringify({ qr_token: token }),
      });

      if (result.already_scanned && !result.question) {
        setError("You've already completed this checkpoint!");
        setLoading(false);
        return;
      }

      // Navigate to question screen with scan data
      const params = new URLSearchParams({
        checkpoint_id: result.checkpoint.id,
        checkpoint_name: result.checkpoint.name,
        entries_awarded: String(result.entries_awarded),
        already_scanned: String(result.already_scanned),
        new_total: String(result.new_total),
        ...(result.milestone_earned ? { milestone: String(result.milestone_earned) } : {}),
      });

      if (result.question) {
        params.set("question_id", result.question.id);
        params.set("prompt", result.question.prompt);
        params.set("answer_a", result.question.answer_a);
        params.set("answer_b", result.question.answer_b);
        params.set("answer_c", result.question.answer_c);
        if (result.question.answer_d) {
          params.set("answer_d", result.question.answer_d);
        }
      }

      router.push(`/quest/question?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[500] bg-background overflow-y-auto px-4 pt-6 space-y-4 pb-20">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Scan Checkpoint</h1>
        <p className="text-sm text-muted mt-1">
          Point your camera at a checkpoint QR code
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted text-lg">Processing scan...</div>
        </div>
      ) : (
        <QRScanner
          onScan={handleScan}
          onError={(msg) => setError(msg)}
        />
      )}

      {error && (
        <div className="bg-error/10 text-error rounded-xl p-4 text-center text-sm font-medium">
          {error}
          <button
            onClick={() => {
              setError(null);
              setLoading(false);
            }}
            className="block mx-auto mt-2 text-teal underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
