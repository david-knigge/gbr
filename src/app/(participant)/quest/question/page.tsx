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
  const checkpointName = params.get("checkpoint_name") || "checkpoint";
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

  if (result) {
    const totalEarned = entriesFromScan + result.entries_awarded;
    return (
      <div className="absolute inset-0 z-[500] bg-background overflow-y-auto px-5 pt-8 space-y-5 pb-24">
        <div className="text-center">
          {result.is_correct ? (
            <>
              <div className="w-16 h-16 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-success">correct!</h1>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">nice try!</h1>
            </>
          )}
        </div>

        <Card>
          <p className="text-sm text-foreground leading-relaxed">
            {result.explanation}
          </p>
        </Card>

        <Card className="text-center">
          <div className="text-4xl font-bold text-teal">+{totalEarned}</div>
          <div className="text-xs font-medium text-muted mt-1">
            raffle entries earned
          </div>
          {entriesFromScan > 0 && (
            <p className="text-sm text-muted mt-3">
              {entriesFromScan} from scan{result.entries_awarded > 0 ? ` + ${result.entries_awarded} for correct answer` : ""}
            </p>
          )}
          {milestone && (
            <p className="text-sm text-primary font-bold mt-1">
              +{milestone} bonus entries for milestone!
            </p>
          )}
          <div className="mt-4 pt-3 border-t border-card-border text-sm text-muted">
            total: <span className="font-bold text-foreground text-lg">{result.new_total}</span> entries
          </div>
        </Card>

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push("/")}
          >
            continue
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => router.push("/quest/scan")}
          >
            scan next checkpoint
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[500] bg-background overflow-y-auto px-5 pt-8 space-y-5 pb-24">
      <div className="text-center">
        <p className="text-xs font-bold text-teal">
          {checkpointName.toLowerCase()}
        </p>
        {entriesFromScan > 0 && (
          <p className="text-sm text-success font-bold mt-2">
            +{entriesFromScan} entries from scan
          </p>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-bold text-foreground leading-snug">
          {prompt}
        </h2>
      </Card>

      <div className="space-y-3">
        {answers.map((answer) => (
          <button
            key={answer.key}
            onClick={() => setSelectedAnswer(answer.key)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all text-sm font-medium flex items-center gap-3 ${
              selectedAnswer === answer.key
                ? "border-teal bg-teal/5 text-foreground"
                : "border-card-border bg-card text-foreground hover:border-muted"
            }`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
              selectedAnswer === answer.key
                ? "bg-teal text-white"
                : "bg-cream text-muted"
            }`}>
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
        {submitting ? "submitting..." : "submit answer"}
      </Button>
    </div>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted font-medium">loading...</div></div>}>
      <QuestionContent />
    </Suspense>
  );
}
