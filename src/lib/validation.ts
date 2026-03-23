import { z } from "zod/v4";

export const guestInitSchema = z.object({
  user_id: z.string().uuid().optional(),
});

export const profileUpdateSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  email: z.email().optional(),
});

export const scanSchema = z.object({
  qr_token: z.string().min(1),
});

export const answerSchema = z.object({
  checkpoint_id: z.string().uuid(),
  question_id: z.string().uuid(),
  selected_answer: z.enum(["a", "b", "c", "d"]),
});
