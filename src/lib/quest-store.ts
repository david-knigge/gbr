"use client";

// Local-only quest progress — no database, no user creation
// Tracks which checkpoints have been scanned and questions answered

const STORAGE_KEY = "quest_progress";

export interface QuestCheckpoint {
  checkpoint_id: string;
  checkpoint_name: string;
  scanned_at: string;
  question_answered: boolean;
  answer_correct: boolean | null;
}

export interface QuestProgress {
  checkpoints: Record<string, QuestCheckpoint>;
}

function load(): QuestProgress {
  if (typeof window === "undefined") return { checkpoints: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { checkpoints: {} };
    return JSON.parse(raw);
  } catch {
    return { checkpoints: {} };
  }
}

function save(progress: QuestProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getQuestProgress(): QuestProgress {
  return load();
}

export function isCheckpointScanned(checkpointId: string): boolean {
  return !!load().checkpoints[checkpointId];
}

export function markCheckpointScanned(checkpointId: string, name: string) {
  const progress = load();
  if (!progress.checkpoints[checkpointId]) {
    progress.checkpoints[checkpointId] = {
      checkpoint_id: checkpointId,
      checkpoint_name: name,
      scanned_at: new Date().toISOString(),
      question_answered: false,
      answer_correct: null,
    };
    save(progress);
  }
}

export function markQuestionAnswered(checkpointId: string, correct: boolean) {
  const progress = load();
  const cp = progress.checkpoints[checkpointId];
  if (cp) {
    cp.question_answered = true;
    cp.answer_correct = correct;
    save(progress);
  }
}

export function getCompletedCount(): number {
  const progress = load();
  return Object.values(progress.checkpoints).filter((c) => c.question_answered).length;
}

export function getScannedCount(): number {
  return Object.keys(load().checkpoints).length;
}
