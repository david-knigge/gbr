"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { initUser } from "@/lib/identity";
import { apiFetch } from "@/lib/api-client";
import type { UserState } from "@/lib/types";

interface UserContextValue {
  user: UserState | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const state = await apiFetch<UserState>("/api/me");
      setUser(state);
      setError(null);
    } catch (e) {
      console.error("Failed to refresh user:", e);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await initUser();
        await refreshUser();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to initialize");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
