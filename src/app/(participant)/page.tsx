"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
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

type Mode = "race" | "quest";

export default function MainPage() {
  const { user, loading } = useUser();
  const [mode, setMode] = useState<Mode>("race");
  const [donateOpen, setDonateOpen] = useState(false);
  const [showQuestIntro, setShowQuestIntro] = useState(false);
  const [showRaceInfo, setShowRaceInfo] = useState(false);

  // Restore last mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("app_mode") as Mode | null;
    if (saved === "quest") setMode("quest");
  }, []);

  // Persist mode
  useEffect(() => {
    localStorage.setItem("app_mode", mode);
  }, [mode]);

  // Show quest intro on first visit
  useEffect(() => {
    if (mode === "quest") {
      const seen = localStorage.getItem("quest_intro_seen");
      if (!seen) setShowQuestIntro(true);
    }
  }, [mode]);

  function dismissQuestIntro() {
    localStorage.setItem("quest_intro_seen", "1");
    setShowQuestIntro(false);
  }

  function handleToggle(newMode: Mode) {
    if (newMode === mode) {
      // Re-tap opens explainer
      if (mode === "quest") setShowQuestIntro(true);
      if (mode === "race") setShowRaceInfo(true);
    } else {
      setMode(newMode);
    }
  }

  const checkpoints = user?.checkpoints ?? [];
  const completed = checkpoints.filter((c) => c.is_completed).length;
  const total = checkpoints.length;

  return (
    <>
      {/* map — always mounted, never unmounts on toggle */}
      <div className="absolute inset-0">
        <RaceMap
          showCourses={mode === "race"}
          showPOIs={mode === "race"}
          showCheckpoints={mode === "quest"}
          checkpoints={checkpoints}
        />
      </div>

      {/* race info: logo */}
      {mode === "race" && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-1.5">
            <Image
              src="/logo-square.png"
              alt="the great benicia run"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>
        </div>
      )}

      {/* quest: HUD */}
      {mode === "quest" && !showQuestIntro && !loading && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center gap-5">
              <div>
                <div className="text-[11px] font-medium text-muted">entries</div>
                <div className="text-2xl font-bold text-teal leading-none mt-0.5">
                  {user?.raffle_entries_total ?? 0}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted">checkpoints</div>
                <div className="text-xl font-bold text-foreground leading-none mt-0.5">
                  {completed}<span className="text-muted font-normal">/{total}</span>
                </div>
              </div>
              <button
                onClick={() => setDonateOpen(true)}
                className="ml-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            {(user?.active_multiplier || user?.donor_badge) && (
              <div className="flex gap-2 mt-2">
                {user?.active_multiplier && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal/10 text-teal rounded text-[11px] font-bold">
                    2x boost — {user.active_multiplier.remaining_uses} left
                  </span>
                )}
                {user?.donor_badge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[11px] font-bold">
                    donor
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* quest: scan button — well above toggle */}
      {mode === "quest" && !showQuestIntro && !loading && (
        <div className="absolute bottom-28 left-4 right-4 z-[1000] flex justify-center">
          <Link href="/quest/scan" className="w-full max-w-xs">
            <Button variant="primary" size="lg" fullWidth>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              scan checkpoint
            </Button>
          </Link>
        </div>
      )}

      {/* race info: donate button — above toggle */}
      {mode === "race" && (
        <button
          onClick={() => setDonateOpen(true)}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-white px-5 py-3 rounded-lg shadow-lg hover:bg-primary-light active:bg-primary-dark transition-all font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          donate to STEAM
        </button>
      )}

      {/* floating toggle */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1 flex relative" style={{ minWidth: 240 }}>
          {/* sliding indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-200 ease-out"
            style={{
              width: "calc(50% - 4px)",
              left: mode === "race" ? "4px" : "calc(50%)",
            }}
          />
          <button
            onClick={() => handleToggle("race")}
            className={`relative z-10 flex-1 py-2.5 text-sm rounded-full transition-colors ${
              mode === "race" ? "text-white font-medium" : "text-muted font-normal"
            }`}
          >
            race info
          </button>
          <button
            onClick={() => handleToggle("quest")}
            className={`relative z-10 flex-1 py-2.5 text-sm rounded-full transition-colors ${
              mode === "quest" ? "text-white font-medium" : "text-muted font-normal"
            }`}
          >
            raffle quest
          </button>
        </div>
      </div>

      {/* quest intro modal */}
      {showQuestIntro && mode === "quest" && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={dismissQuestIntro} />
          <div className="relative bg-white rounded-lg mx-4 p-6 max-w-sm shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-foreground">
                STEAM wheel quest
              </h1>
              <p className="text-sm text-muted mt-1">
                a race-day scavenger hunt for a good cause
              </p>
            </div>

            <div className="space-y-4 text-sm text-foreground mb-6">
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <p><strong>scan checkpoints</strong> around the race course using QR codes</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <p><strong>answer a STEAM question</strong> to earn raffle entries</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <p><strong>collect entries</strong> for a chance to win prizes</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">+</span>
                <p><strong>donate</strong> to unlock bonus entries and boost your rewards</p>
              </div>
            </div>

            <div className="bg-cream rounded-lg p-3 mb-5">
              <p className="text-xs text-foreground text-center leading-relaxed">
                all donations support the <strong>STEAM Wheel</strong> program
                — hands-on STEAM learning for elementary students.
              </p>
            </div>

            <Button variant="primary" size="xl" fullWidth onClick={dismissQuestIntro}>
              let&apos;s go
            </Button>
          </div>
        </div>
      )}

      {/* race info overlay */}
      {showRaceInfo && mode === "race" && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRaceInfo(false)} />
          <div className="relative bg-white rounded-lg mx-4 p-6 max-w-sm shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-foreground">
                the great benicia run
              </h1>
              <p className="text-sm text-muted mt-1">
                strait to the finish — may 18, 2026
              </p>
            </div>

            <div className="space-y-3 text-sm text-foreground mb-6">
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <p><strong>start times</strong> are shown on the map — tap a course to see details</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <p><strong>parking, registration & aid</strong> — toggle info points in the legend (top right)</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                </span>
                <p><strong>courses</strong> — 5k, 10k, kids dash & more, all visible on the map</p>
              </div>
            </div>

            <div className="bg-cream rounded-lg p-3 mb-5">
              <p className="text-xs text-foreground text-center leading-relaxed">
                visiting or spectating? switch to <strong>raffle quest</strong> for
                a scavenger hunt around the course — scan checkpoints, answer
                STEAM questions, and win prizes!
              </p>
            </div>

            <Button variant="primary" size="xl" fullWidth onClick={() => setShowRaceInfo(false)}>
              got it
            </Button>
          </div>
        </div>
      )}

      <DonateOverlay open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  );
}
