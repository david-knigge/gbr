"use client";

import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

interface DonateOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function DonateOverlay({ open, onClose }: DonateOverlayProps) {
  const { user, refreshUser } = useUser();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showRaffle, setShowRaffle] = useState(false);

  if (user && !initialized) {
    setEmail(user.email || "");
    setNickname(user.nickname || "");
    setInitialized(true);
  }

  async function handleSaveProfile() {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          nickname: nickname || undefined,
          email: email || undefined,
        }),
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[1100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white rounded-t-xl pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-card-border" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              support STEAM wheel
            </h2>
            <p className="text-sm text-muted mt-1">
              help us keep the wheel turning
            </p>
          </div>

          <div className="bg-cream rounded-lg p-4">
            <p className="text-sm text-foreground leading-relaxed">
              STEAM Wheel is a hands-on, 15-week educational program for
              3rd–5th graders. students rotate through robotics, programming,
              dance, arts, chess and more.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-muted mb-3">
              donor rewards
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <span className="text-sm font-bold text-primary w-10 shrink-0">$5+</span>
                <span className="text-sm text-foreground">+5 raffle entries</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-sm font-bold text-primary w-10 shrink-0">$20+</span>
                <div className="text-sm text-foreground">
                  +15 entries
                  <span className="block text-xs text-teal font-semibold mt-0.5">
                    + 2x rewards on next 3 checkpoints
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-sm font-bold text-primary w-10 shrink-0">$50+</span>
                <div className="text-sm text-foreground">
                  +50 entries
                  <span className="block text-xs text-teal font-semibold mt-0.5">
                    + donor badge
                  </span>
                </div>
              </div>
            </div>
          </div>

          {user && (
            <div className="bg-cream border border-card-border rounded-lg p-4 text-center">
              <p className="text-xs font-medium text-muted mb-2">
                your donation code
              </p>
              <div className="text-2xl font-mono font-bold text-foreground tracking-widest">
                {user.app_code}
              </div>
              <CopyButton text={user.app_code} className="mt-2" />
              <p className="text-xs text-muted mt-3 leading-relaxed">
                enter this code at checkout to link your donation.
              </p>
            </div>
          )}

          <Button
            variant="accent"
            size="xl"
            fullWidth
            onClick={() => {
              window.open("https://givebutter.com", "_blank");
            }}
          >
            donate now
          </Button>

          <button
            onClick={() => setShowRaffle(!showRaffle)}
            className="w-full flex items-center justify-between text-sm font-medium text-muted py-2"
          >
            <span>
              {user?.email
                ? "raffle info (eligible)"
                : "enter raffle (add your email)"}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showRaffle ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showRaffle && (
            <div className="space-y-3">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="display name"
                className="w-full px-4 py-3 border border-card-border rounded-lg text-sm bg-white focus:outline-none focus:border-teal"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-card-border rounded-lg text-sm bg-white focus:outline-none focus:border-teal"
              />
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? "saving..." : saved ? "saved!" : "save"}
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted font-medium">
            play for free. donate to boost your impact.
          </p>
        </div>
      </div>
    </div>
  );
}
