"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { markQuestionAnswered, getCompletedCount, clearCheckpointScan } from "@/lib/quest-store";

function QuestionContent() {
  const router = useRouter();
  const params = useSearchParams();

  const checkpointId = params.get("checkpoint_id") || "";
  const checkpointName = params.get("checkpoint_name") || "checkpoint";
  const prompt = params.get("prompt") || "";
  const correctAnswer = params.get("correct_answer") || "";
  const explanation = params.get("explanation") || "";

  const answers = [
    { key: "a", text: params.get("answer_a") || "" },
    { key: "b", text: params.get("answer_b") || "" },
    { key: "c", text: params.get("answer_c") || "" },
    ...(params.get("answer_d") ? [{ key: "d", text: params.get("answer_d") || "" }] : []),
  ];

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean } | null>(null);

  function handleSubmit() {
    if (!selectedAnswer) return;
    const correct = selectedAnswer === correctAnswer;
    markQuestionAnswered(checkpointId, correct);
    setResult({ correct });
  }

  if (result) {
    const completed = getCompletedCount();
    return (
      <div className="absolute inset-0 z-[500] bg-background overflow-y-auto px-5 pt-8 space-y-5 pb-24">
        <div className="text-center">
          {result.correct ? (
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

        {explanation && (
          <Card>
            <p className="text-sm text-foreground leading-relaxed">
              {explanation}
            </p>
          </Card>
        )}

        <Card className="text-center">
          <div className="text-4xl font-bold text-teal">{completed}/10</div>
          <div className="text-xs font-medium text-muted mt-1">
            checkpoints completed
          </div>
          {completed === 10 && (
            <p className="text-sm text-success font-bold mt-3">
              you completed the STEAM quest! show this at registration for your reward
            </p>
          )}
        </Card>

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push("/")}
          >
            back to map
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
        disabled={!selectedAnswer}
      >
        submit answer
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
