"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isCheckpointScanned, markCheckpointScanned } from "@/lib/quest-store";

export default function DirectScanPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processScan() {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr_token: token }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "checkpoint not found");
        }

        const result = await res.json();

        // Check if already scanned locally
        if (isCheckpointScanned(result.checkpoint.id)) {
          router.replace("/");
          return;
        }

        // Mark scanned
        markCheckpointScanned(result.checkpoint.id, result.checkpoint.name);

        if (result.question) {
          const searchParams = new URLSearchParams({
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
          router.replace(`/quest/question?${searchParams.toString()}`);
        } else {
          router.replace("/");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed to process checkpoint");
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
          go to home
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted text-lg">processing checkpoint...</div>
    </div>
  );
}
