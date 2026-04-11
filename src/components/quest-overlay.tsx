"use client";

import { useState, useCallback } from "react";
import { QRScanner } from "@/components/qr-scanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  isCheckpointScanned,
  markCheckpointScanned,
  markQuestionAnswered,
  clearCheckpointScan,
  getCompletedCount,
} from "@/lib/quest-store";

interface Question {
  id: string;
  prompt: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string | null;
  correct_answer: string;
  explanation: string;
}

interface Checkpoint {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order?: number | null;
}

interface ScanResult {
  checkpoint: Checkpoint;
  question: Question | null;
}

type Phase =
  | { name: "scan" }
  | { name: "loading" }
  | { name: "question"; checkpoint: Checkpoint; question: Question }
  | { name: "result"; checkpoint: Checkpoint; question: Question; correct: boolean };

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuestOverlay({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "scan" });
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    // If user bails during a question without answering, roll back the scan mark
    if (phase.name === "question") {
      clearCheckpointScan(phase.checkpoint.id);
    }
    setPhase({ name: "scan" });
    setError(null);
    onClose();
  }, [phase, onClose]);

  async function handleScan(token: string) {
    setPhase({ name: "loading" });
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

      if (isCheckpointScanned(result.checkpoint.id)) {
        setError("you've already scanned this checkpoint!");
        setPhase({ name: "scan" });
        return;
      }

      markCheckpointScanned(result.checkpoint.id, result.checkpoint.name);

      if (result.question) {
        setPhase({ name: "question", checkpoint: result.checkpoint, question: result.question });
      } else {
        handleClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "scan failed");
      setPhase({ name: "scan" });
    }
  }

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  function submitAnswer() {
    if (phase.name !== "question" || !selectedAnswer) return;
    const correct = selectedAnswer === phase.question.correct_answer;
    markQuestionAnswered(phase.checkpoint.id, correct);
    setPhase({ name: "result", checkpoint: phase.checkpoint, question: phase.question, correct });
    setSelectedAnswer(null);
  }

  if (!open) return null;

  const answers =
    phase.name === "question" || phase.name === "result"
      ? [
          { key: "a", text: phase.question.answer_a },
          { key: "b", text: phase.question.answer_b },
          { key: "c", text: phase.question.answer_c },
          ...(phase.question.answer_d ? [{ key: "d", text: phase.question.answer_d }] : []),
        ]
      : [];

  return (
    <div className="absolute inset-0 z-[1200] bg-background overflow-y-auto px-5 pt-8 pb-24">
      <button
        onClick={handleClose}
        aria-label="close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center text-muted hover:text-foreground z-10"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {(phase.name === "scan" || phase.name === "loading") && (
        <div className="space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">scan checkpoint</h1>
            <p className="text-sm text-muted mt-1 font-medium">
              point your camera at a checkpoint QR code
            </p>
          </div>

          {phase.name === "loading" ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-muted font-bold text-lg">processing scan...</div>
            </div>
          ) : (
            <QRScanner onScan={handleScan} onError={(msg) => setError(msg)} />
          )}

          {error && (
            <div className="bg-error/10 text-error rounded-lg p-4 text-center text-sm font-bold">
              {error}
              <button
                onClick={() => setError(null)}
                className="block mx-auto mt-2 text-teal font-bold text-sm"
              >
                try again
              </button>
            </div>
          )}
        </div>
      )}

      {phase.name === "question" && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-xs font-bold text-teal">
              checkpoint {(phase.checkpoint.sort_order ?? 0) + 1}
            </p>
          </div>

          <Card>
            <h2 className="text-lg font-bold text-foreground leading-snug">
              {phase.question.prompt}
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
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                    selectedAnswer === answer.key ? "bg-teal text-white" : "bg-cream text-muted"
                  }`}
                >
                  {answer.key}
                </span>
                {answer.text}
              </button>
            ))}
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={submitAnswer} disabled={!selectedAnswer}>
            submit answer
          </Button>
        </div>
      )}

      {phase.name === "result" && (
        <div className="space-y-5">
          <div className="text-center">
            {phase.correct ? (
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

          {phase.question.explanation && (
            <Card>
              <p className="text-sm text-foreground leading-relaxed">{phase.question.explanation}</p>
            </Card>
          )}

          <Card className="text-center">
            <div className="text-4xl font-bold text-teal">{getCompletedCount()}/10</div>
            <div className="text-xs font-medium text-muted mt-1">checkpoints completed</div>
            {getCompletedCount() === 10 && (
              <p className="text-sm text-success font-bold mt-3">
                you completed the STEAM quest! show this at registration for your reward
              </p>
            )}
          </Card>

          <div className="space-y-3">
            <Button variant="primary" size="lg" fullWidth onClick={handleClose}>
              back to map
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => {
                setPhase({ name: "scan" });
                setError(null);
              }}
            >
              scan next checkpoint
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
