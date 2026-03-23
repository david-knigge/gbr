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

// Store promise on window to survive HMR module reloads in dev
function getInitPromise(): Promise<StoredUser> | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as Record<string, unknown>).__race_init_promise as Promise<StoredUser> | null ?? null;
}

function setInitPromise(p: Promise<StoredUser> | null) {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>).__race_init_promise = p;
}

export async function initUser(): Promise<StoredUser> {
  // If already stored, return immediately — no API call
  const existing = getStoredUser();
  if (existing) return existing;

  // Deduplicate concurrent init calls — stored on window to survive HMR
  const pending = getInitPromise();
  if (pending) return pending;

  const promise = (async () => {
    // Double-check localStorage in case another call stored it while we were queued
    const check = getStoredUser();
    if (check) return check;

    const res = await fetch("/api/guest/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      setInitPromise(null);
      throw new Error("Failed to initialize user");
    }

    const data: GuestInitResponse = await res.json();
    storeUser(data.user_id, data.app_code);
    return { userId: data.user_id, appCode: data.app_code };
  })();

  setInitPromise(promise);
  return promise;
}
