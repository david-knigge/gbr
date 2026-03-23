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

// Cache the init promise so concurrent calls don't create multiple users
let initPromise: Promise<StoredUser> | null = null;

export async function initUser(): Promise<StoredUser> {
  // If already stored, return immediately — no API call
  const existing = getStoredUser();
  if (existing) return existing;

  // Deduplicate concurrent init calls
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch("/api/guest/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error("Failed to initialize user");
      }

      const data: GuestInitResponse = await res.json();
      storeUser(data.user_id, data.app_code);
      return { userId: data.user_id, appCode: data.app_code };
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
