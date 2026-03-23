"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { useUser } from "@/contexts/user-context";
import type { AnswerResponse } from "@/lib/types";

function QuestionContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshUser } = useUser();

  const checkpointId = params.get("checkpoint_id") || "";
  const checkpointName = params.get("checkpoint_name") || "Checkpoint";
  const questionId = params.get("question_id") || "";
  const prompt = params.get("prompt") || "";
  const entriesFromScan = parseInt(params.get("entries_awarded") || "0");
  const milestone = params.get("milestone");

  const answers = [
    { key: "a", text: params.get("answer_a") || "" },
    { key: "b", text: params.get("answer_b") || "" },
    { key: "c", text: params.get("answer_c") || "" },
    ...(params.get("answer_d") ? [{ key: "d", text: params.get("answer_d") || "" }] : []),
  ];

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selectedAnswer) return;
    setSubmitting(true);

    try {
      const res = await apiFetch<AnswerResponse>("/api/question/answer", {
        method: "POST",
        body: JSON.stringify({
          checkpoint_id: checkpointId,
          question_id: questionId,
          selected_answer: selectedAnswer,
        }),
      });
      setResult(res);
      await refreshUser();
    } catch (e) {
      console.error("Answer submission failed:", e);
    } finally {
      setSubmitting(false);
    }
  }

  // Show result screen
  if (result) {
    const totalEarned = entriesFromScan + result.entries_awarded;
    return (
      <div className="absolute inset-0 z-[500] bg-background overflow-y-auto px-4 pt-6 space-y-4 pb-20">
        <div className="text-center space-y-2">
          {result.is_correct ? (
            <>
              <div className="text-5xl">&#10003;</div>
              <h1 className="text-2xl font-bold text-success">Correct!</h1>
            </>
          ) : (
            <>
              <div className="text-5xl">&#128170;</div>
              <h1 className="text-2xl font-bold text-foreground">Nice try!</h1>
            </>
          )}
        </div>

        <Card>
          <p className="text-sm text-foreground leading-relaxed">
            {result.explanation}
          </p>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-teal">+{totalEarned}</div>
          <div className="text-sm text-muted mt-1">
            Raffle Entries Earned
          </div>
          {entriesFromScan > 0 && (
            <p className="text-xs text-muted mt-2">
              {entriesFromScan} from scan{result.entries_awarded > 0 ? ` + ${result.entries_awarded} for correct answer` : ""}
            </p>
          )}
          {milestone && (
            <p className="text-xs text-accent font-semibold mt-1">
              + {milestone} bonus entries for milestone!
            </p>
          )}
          <div className="mt-3 text-sm text-muted">
            Total: <span className="font-bold text-foreground">{result.new_total}</span> entries
          </div>
        </Card>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => router.push("/quest")}
        >
          Continue
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => router.push("/quest/scan")}
        >
          Scan Next Checkpoint
        </Button>
      </div>
    );
  }

  // Show question
  return (
    <div className="absolute inset-0 z-[500] bg-background overflow-y-auto px-4 pt-6 space-y-4 pb-20">
      <div className="text-center">
        <p className="text-xs text-teal font-semibold uppercase tracking-wide">
          {checkpointName}
        </p>
        {entriesFromScan > 0 && (
          <p className="text-sm text-success font-medium mt-1">
            +{entriesFromScan} entries from scan!
          </p>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-foreground leading-snug">
          {prompt}
        </h2>
      </Card>

      <div className="space-y-2">
        {answers.map((answer) => (
          <button
            key={answer.key}
            onClick={() => setSelectedAnswer(answer.key)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium ${
              selectedAnswer === answer.key
                ? "border-primary bg-primary/5 text-foreground"
                : "border-card-border bg-card text-foreground hover:border-gray-300"
            }`}
          >
            <span className="inline-block w-6 h-6 rounded-full border-2 text-center text-xs leading-5 mr-3 font-bold uppercase ${
              selectedAnswer === answer.key
                ? 'border-primary text-teal'
                : 'border-gray-300 text-muted'
            }">
              {answer.key}
            </span>
            {answer.text}
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleSubmit}
        disabled={!selectedAnswer || submitting}
      >
        {submitting ? "Submitting..." : "Submit Answer"}
      </Button>
    </div>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted">Loading...</div></div>}>
      <QuestionContent />
    </Suspense>
  );
}
