export const MILESTONES = [
  { count: 3, bonus: 2 },
  { count: 5, bonus: 5 },
  // "all" milestone is handled dynamically based on total checkpoint count
] as const;

export const ALL_CHECKPOINTS_BONUS = 10;

export const DONATION_TIERS = [
  {
    min_cents: 5000,
    entries: 50,
    badge: true,
  },
  {
    min_cents: 2000,
    entries: 15,
    multiplier: { type: "double_next_3_scans" as const, uses: 3 },
  },
  {
    min_cents: 500,
    entries: 5,
  },
] as const;

export const APP_CODE_PREFIX = "WHEEL";
