"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useUser } from "@/contexts/user-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonateOverlay } from "@/components/donate-overlay";

const RaceMap = dynamic(
  () => import("@/components/race-map").then((m) => m.RaceMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-teal/10 animate-pulse" />
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
          <div className="relative bg-white rounded-2xl mx-4 p-6 max-w-sm shadow-2xl animate-slide-up">
            <div className="text-center space-y-2 mb-4">
              <div className="text-4xl">&#11088;</div>
              <h1 className="text-xl font-bold text-foreground">
                STEAM Wheel Quest
              </h1>
              <p className="text-sm text-muted">
                A race-day scavenger hunt for a good cause!
              </p>
            </div>

            <div className="space-y-3 text-sm text-foreground mb-5">
              <div className="flex gap-3">
                <span className="text-teal font-bold text-lg">1</span>
                <p>
                  <strong>Scan checkpoints</strong> around the race course using
                  QR codes
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-teal font-bold text-lg">2</span>
                <p>
                  <strong>Answer a quick STEAM question</strong> to earn raffle
                  entries
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-teal font-bold text-lg">3</span>
                <p>
                  <strong>Collect entries</strong> for a chance to win prizes
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-coral font-bold text-lg">+</span>
                <p>
                  <strong>Donate</strong> to unlock bonus entries and boost your
                  rewards!
                </p>
              </div>
            </div>

            <div className="bg-teal/5 rounded-lg p-3 mb-4">
              <p className="text-xs text-foreground text-center">
                All donations support the <strong>STEAM Wheel</strong> program
                — hands-on STEAM learning for elementary students.
              </p>
            </div>

            <Button variant="primary" size="xl" fullWidth onClick={dismissIntro}>
              Let&apos;s Go!
            </Button>
          </div>
        </div>
      )}

      {/* Quest HUD overlay - top */}
      {!showIntro && !loading && (
        <div className="absolute top-3 left-3 right-14 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">Raffle Entries</div>
                <div className="text-2xl font-bold text-teal">
                  {user?.raffle_entries_total ?? 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted">Checkpoints</div>
                <div className="text-lg font-bold text-foreground">
                  {completed}/{total}
                </div>
              </div>
            </div>
            {(user?.active_multiplier || user?.donor_badge) && (
              <div className="flex gap-2 mt-2">
                {user?.active_multiplier && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-coral/10 text-coral rounded-full text-xs font-semibold">
                    2x Boost ({user.active_multiplier.remaining_uses} left)
                  </span>
                )}
                {user?.donor_badge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
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
        <div className="absolute bottom-20 left-0 right-0 z-[1000] flex justify-center px-4">
          <Link href="/quest/scan" className="w-full max-w-xs">
            <Button variant="primary" size="xl" fullWidth>
              <svg
                className="w-6 h-6 mr-2"
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
          className="absolute bottom-32 right-3 z-[1000] bg-coral text-white px-4 py-2.5 rounded-full shadow-lg font-bold text-sm flex items-center gap-1.5"
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
