"use client";

import type { GuestInitResponse } from "@/lib/types";

const STORAGE_KEY = "race_user";

interface StoredUser {
  userId: string;
  appCode: string;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.userId && parsed.appCode) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function storeUser(userId: string, appCode: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, appCode }));
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Persistent promise cache — never cleared so concurrent/re-mount calls reuse the same result
let initPromise: Promise<StoredUser> | null = null;

export async function initUser(): Promise<StoredUser> {
  // If already stored, return immediately — no API call
  const existing = getStoredUser();
  if (existing) return existing;

  // Deduplicate concurrent init calls — promise is never cleared
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Double-check localStorage in case another call stored it while we were queued
    const check = getStoredUser();
    if (check) return check;

    const res = await fetch("/api/guest/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      // Reset so a future call can retry
      initPromise = null;
      throw new Error("Failed to initialize user");
    }

    const data: GuestInitResponse = await res.json();
    storeUser(data.user_id, data.app_code);
    return { userId: data.user_id, appCode: data.app_code };
  })();

  return initPromise;
}
