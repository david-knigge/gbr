"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { initUser } from "@/lib/identity";
import { apiFetch } from "@/lib/api-client";
import type { ScanResponse } from "@/lib/types";

export default function DirectScanPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processScan() {
      try {
        // Ensure user exists
        await initUser();

        // Process the scan
        const result = await apiFetch<ScanResponse>("/api/scan", {
          method: "POST",
          body: JSON.stringify({ qr_token: token }),
        });

        if (result.already_scanned && !result.question) {
          router.replace("/quest");
          return;
        }

        // Build query params for question page
        const searchParams = new URLSearchParams({
          checkpoint_id: result.checkpoint.id,
          checkpoint_name: result.checkpoint.name,
          entries_awarded: String(result.entries_awarded),
          already_scanned: String(result.already_scanned),
          new_total: String(result.new_total),
          ...(result.milestone_earned ? { milestone: String(result.milestone_earned) } : {}),
        });

        if (result.question) {
          searchParams.set("question_id", result.question.id);
          searchParams.set("prompt", result.question.prompt);
          searchParams.set("answer_a", result.question.answer_a);
          searchParams.set("answer_b", result.question.answer_b);
          searchParams.set("answer_c", result.question.answer_c);
          if (result.question.answer_d) {
            searchParams.set("answer_d", result.question.answer_d);
          }
        }

        router.replace(`/quest/question?${searchParams.toString()}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to process checkpoint");
      }
    }

    processScan();
  }, [token, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 space-y-4">
        <p className="text-error font-medium text-center">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="text-primary underline text-sm"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted text-lg">Processing checkpoint...</div>
    </div>
  );
}
