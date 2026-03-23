import { SupabaseClient } from "@supabase/supabase-js";
import { MILESTONES, ALL_CHECKPOINTS_BONUS, DONATION_TIERS } from "@/lib/constants";
import type { SourceType } from "@/lib/types";

async function addLedgerEntry(
  supabase: SupabaseClient,
  userId: string,
  sourceType: SourceType,
  sourceId: string | null,
  delta: number,
  note?: string
) {
  const { error } = await supabase.from("raffle_entries_ledger").insert({
    user_id: userId,
    source_type: sourceType,
    source_id: sourceId,
    delta,
    note: note || null,
  });
  if (error) throw new Error(`Ledger insert failed: ${error.message}`);
}

async function getActiveMultiplier(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("reward_states")
    .select("*")
    .eq("user_id", userId)
    .eq("reward_type", "double_next_3_scans")
    .eq("is_active", true)
    .gt("remaining_uses", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  return data;
}

export async function awardScanEntries(
  supabase: SupabaseClient,
  userId: string,
  checkpointId: string,
  scanId: string,
  entriesAwarded: number
): Promise<{ entries: number; multiplierApplied: boolean }> {
  // Base scan reward
  await addLedgerEntry(supabase, userId, "checkpoint_scan", scanId, entriesAwarded, `Checkpoint scan`);

  // Check for active multiplier
  const multiplier = await getActiveMultiplier(supabase, userId);
  let multiplierApplied = false;

  if (multiplier) {
    // Award bonus entries from multiplier (2x means +1 extra for each base entry)
    await addLedgerEntry(
      supabase,
      userId,
      "donation_multiplier_bonus",
      scanId,
      entriesAwarded,
      "2x multiplier applied"
    );

    // Decrement remaining uses
    const newUses = multiplier.remaining_uses - 1;
    await supabase
      .from("reward_states")
      .update({
        remaining_uses: newUses,
        is_active: newUses > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", multiplier.id);

    multiplierApplied = true;
  }

  return {
    entries: entriesAwarded * (multiplierApplied ? 2 : 1),
    multiplierApplied,
  };
}

export async function awardQuestionBonus(
  supabase: SupabaseClient,
  userId: string,
  attemptId: string
): Promise<number> {
  const bonus = 1;
  await addLedgerEntry(supabase, userId, "question_correct", attemptId, bonus, "Correct answer bonus");
  return bonus;
}

export async function checkAndAwardMilestones(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  // Count user's completed scans
  const { count: scanCount } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!scanCount) return null;

  // Count total active checkpoints (for "all" milestone)
  const { count: totalCheckpoints } = await supabase
    .from("checkpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Check which milestones are already awarded
  const { data: existingMilestones } = await supabase
    .from("raffle_entries_ledger")
    .select("note")
    .eq("user_id", userId)
    .eq("source_type", "checkpoint_milestone");

  const awardedNotes = new Set((existingMilestones || []).map((m) => m.note));

  // Check numbered milestones
  for (const milestone of MILESTONES) {
    const note = `Milestone: ${milestone.count} checkpoints`;
    if (scanCount >= milestone.count && !awardedNotes.has(note)) {
      await addLedgerEntry(supabase, userId, "checkpoint_milestone", null, milestone.bonus, note);
      return milestone.bonus;
    }
  }

  // Check "all checkpoints" milestone
  if (totalCheckpoints && scanCount >= totalCheckpoints) {
    const note = `Milestone: all checkpoints`;
    if (!awardedNotes.has(note)) {
      await addLedgerEntry(supabase, userId, "checkpoint_milestone", null, ALL_CHECKPOINTS_BONUS, note);
      return ALL_CHECKPOINTS_BONUS;
    }
  }

  return null;
}

export async function awardDonationRewards(
  supabase: SupabaseClient,
  userId: string,
  donationId: string,
  amountCents: number
): Promise<{ entries: number; multiplierCreated: boolean; badgeCreated: boolean }> {
  // Find the highest matching tier (tiers are sorted descending by min_cents)
  const tier = DONATION_TIERS.find((t) => amountCents >= t.min_cents);
  if (!tier) return { entries: 0, multiplierCreated: false, badgeCreated: false };

  // Award base donation entries
  await addLedgerEntry(
    supabase,
    userId,
    "donation_bonus",
    donationId,
    tier.entries,
    `Donation $${(amountCents / 100).toFixed(2)} — tier bonus`
  );

  let multiplierCreated = false;
  let badgeCreated = false;

  // Create multiplier if tier includes one
  if ("multiplier" in tier && tier.multiplier) {
    await supabase.from("reward_states").insert({
      user_id: userId,
      reward_type: tier.multiplier.type,
      remaining_uses: tier.multiplier.uses,
      is_active: true,
    });
    multiplierCreated = true;
  }

  // Create badge if tier includes one
  if ("badge" in tier && tier.badge) {
    // Check if badge already exists
    const { data: existingBadge } = await supabase
      .from("reward_states")
      .select("id")
      .eq("user_id", userId)
      .eq("reward_type", "donor_badge")
      .limit(1)
      .single();

    if (!existingBadge) {
      await supabase.from("reward_states").insert({
        user_id: userId,
        reward_type: "donor_badge",
        remaining_uses: null,
        is_active: true,
      });
      badgeCreated = true;
    }
  }

  return { entries: tier.entries, multiplierCreated, badgeCreated };
}

export async function getUserTotal(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from("user_raffle_totals")
    .select("total_entries")
    .eq("user_id", userId)
    .single();

  return data?.total_entries ?? 0;
}
