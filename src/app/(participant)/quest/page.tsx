"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { DonateOverlay } from "@/components/donate-overlay";

const RaceMap = dynamic(
  () => import("@/components/race-map").then((m) => m.RaceMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-cream animate-pulse" />
    ),
  }
);

export default function QuestPage() {
  const { user, loading } = useUser();
  const [showIntro, setShowIntro] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("quest_intro_seen");
    if (!seen) setShowIntro(true);
  }, []);

  function dismissIntro() {
    localStorage.setItem("quest_intro_seen", "1");
    setShowIntro(false);
  }

  const checkpoints = user?.checkpoints ?? [];
  const completed = checkpoints.filter((c) => c.is_completed).length;
  const total = checkpoints.length;

  return (
    <>
      {/* Fullscreen map with checkpoints */}
      <div className="absolute inset-0">
        <RaceMap
          showCourses={false}
          showPOIs={false}
          showCheckpoints
          checkpoints={checkpoints}
        />
      </div>

      {/* Intro overlay for first-time visitors */}
      {showIntro && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-lg mx-4 p-6 max-w-sm shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                STEAM Wheel Quest
              </h1>
              <p className="text-sm text-muted mt-1">
                A race-day scavenger hunt for a good cause
              </p>
            </div>

            <div className="space-y-4 text-sm text-foreground mb-6">
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <p>
                  <strong>Scan checkpoints</strong> around the race course using QR codes
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <p>
                  <strong>Answer a STEAM question</strong> to earn raffle entries
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <p>
                  <strong>Collect entries</strong> for a chance to win prizes
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">+</span>
                <p>
                  <strong>Donate</strong> to unlock bonus entries and boost your rewards
                </p>
              </div>
            </div>

            <div className="bg-cream rounded-lg p-3 mb-5">
              <p className="text-xs text-foreground text-center leading-relaxed">
                All donations support the <strong>STEAM Wheel</strong> program
                — hands-on STEAM learning for elementary students.
              </p>
            </div>

            <Button variant="primary" size="xl" fullWidth onClick={dismissIntro}>
              Let&apos;s Go
            </Button>
          </div>
        </div>
      )}

      {/* Quest HUD overlay - top */}
      {!showIntro && !loading && (
        <div className="absolute top-4 left-4 right-16 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-5 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-muted tracking-wide">Entries</div>
                <div className="text-3xl font-bold text-teal leading-none mt-1">
                  {user?.raffle_entries_total ?? 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-muted tracking-wide">Checkpoints</div>
                <div className="text-2xl font-bold text-foreground leading-none mt-1">
                  {completed}<span className="text-muted font-normal">/{total}</span>
                </div>
              </div>
            </div>
            {(user?.active_multiplier || user?.donor_badge) && (
              <div className="flex gap-2 mt-3">
                {user?.active_multiplier && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal/10 text-teal rounded text-xs font-bold tracking-wide">
                    2x Boost — {user.active_multiplier.remaining_uses} left
                  </span>
                )}
                {user?.donor_badge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded text-xs font-bold tracking-wide">
                    Donor
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan button - bottom center */}
      {!showIntro && !loading && (
        <div className="absolute bottom-24 left-4 right-4 z-[1000] flex justify-center">
          <Link href="/quest/scan" className="w-full max-w-sm">
            <Button variant="primary" size="xl" fullWidth>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Scan Checkpoint
            </Button>
          </Link>
        </div>
      )}

      {/* Donate FAB */}
      {!showIntro && (
        <button
          onClick={() => setDonateOpen(true)}
          className="absolute bottom-32 right-4 z-[1000] bg-primary text-white px-4 py-2.5 rounded-lg shadow-lg font-bold text-xs tracking-wide flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          Donate
        </button>
      )}

      {/* Donate overlay */}
      <DonateOverlay open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  );
}
