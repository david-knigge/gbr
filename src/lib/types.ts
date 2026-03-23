// === Database Entities ===

export interface User {
  id: string;
  app_code: string;
  nickname: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  prompt: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string | null;
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string;
  is_active: boolean;
  created_at: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  slug: string;
  qr_token: string;
  description: string | null;
  entries_awarded: number;
  question_id: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  checkpoint_id: string;
  created_at: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  checkpoint_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  created_at: string;
}

export interface Donation {
  id: string;
  external_id: string;
  user_id: string | null;
  race_app_code: string | null;
  donor_email: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_id: string | null;
  delta: number;
  note: string | null;
  created_at: string;
}

export interface RewardState {
  id: string;
  user_id: string;
  reward_type: string;
  remaining_uses: number | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// === Enums ===

export type SourceType =
  | "checkpoint_scan"
  | "question_correct"
  | "checkpoint_milestone"
  | "donation_bonus"
  | "donation_multiplier_bonus"
  | "admin_adjustment";

// === API Shapes ===

export interface GuestInitResponse {
  user_id: string;
  app_code: string;
}

export interface UserState {
  user_id: string;
  app_code: string;
  nickname: string | null;
  email: string | null;
  raffle_entries_total: number;
  checkpoints_completed: number;
  checkpoints_completed_ids: string[];
  active_multiplier: {
    type: string;
    remaining_uses: number;
  } | null;
  donor_badge: boolean;
  milestones_earned: number[];
  checkpoints: CheckpointProgress[];
}

export interface ScanResponse {
  already_scanned: boolean;
  checkpoint: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  entries_awarded: number;
  question: {
    id: string;
    prompt: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string | null;
  } | null;
  new_total: number;
  milestone_earned: number | null;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  entries_awarded: number;
  new_total: number;
}

export interface CheckpointProgress {
  id: string;
  name: string;
  slug: string;
  sort_order: number | null;
  is_completed: boolean;
}
