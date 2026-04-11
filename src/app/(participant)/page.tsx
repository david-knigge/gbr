"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { QuestOverlay } from "@/components/quest-overlay";
import { getCompletedCount, getScannedCount } from "@/lib/quest-store";

const RaceMap = dynamic(
  () => import("@/components/race-map").then((m) => m.RaceMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-cream animate-pulse" />
    ),
  }
);

type Mode = "race" | "visitor" | "quest";

export default function MainPage() {
  const [mode, setMode] = useState<Mode>("race");
  const [showIntro, setShowIntro] = useState(false);
  const [showQuestIntro, setShowQuestIntro] = useState(false);
  const [questIntroShown, setQuestIntroShown] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [questOverlayOpen, setQuestOverlayOpen] = useState(false);

  function refreshQuestCounts() {
    setScanned(getScannedCount());
    setCompleted(getCompletedCount());
  }

  // Show race info on mount
  useEffect(() => {
    setShowIntro(true);
  }, []);

  // Refresh quest progress when switching to quest
  useEffect(() => {
    if (mode === "quest") {
      setScanned(getScannedCount());
      setCompleted(getCompletedCount());
    }
  }, [mode]);

  // Show quest intro on first switch (per session)
  useEffect(() => {
    if (mode === "quest" && !questIntroShown) {
      setShowQuestIntro(true);
      setQuestIntroShown(true);
    }
  }, [mode, questIntroShown]);

  function handleToggle(newMode: Mode) {
    if (newMode === mode) {
      if (mode === "quest") setShowQuestIntro(true);
      if (mode === "race") setShowIntro(true);
    } else {
      setMode(newMode);
    }
  }

  return (
    <>
      {/* map — always mounted, never unmounts on toggle */}
      <div className="absolute inset-0">
        <RaceMap
          showCourses={mode === "race"}
          ghostCourses={mode !== "race"}
          showPOIs={mode === "race" || mode === "visitor"}
          poiCategory={mode === "visitor" ? "visitor" : "race"}
          showCheckpoints={mode === "quest"}
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

      {/* visitor info: header */}
      {mode === "visitor" && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
            <div className="text-sm font-bold text-foreground">first street & downtown</div>
            <div className="text-[11px] text-muted">shops, parking & things to see</div>
          </div>
        </div>
      )}

      {/* quest: HUD */}
      {mode === "quest" && !showQuestIntro && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center gap-5">
              <div>
                <div className="text-[11px] font-medium text-muted">checkpoints</div>
                <div className="text-xl font-bold text-foreground leading-none mt-0.5">
                  {completed}<span className="text-muted font-normal">/10</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted">scanned</div>
                <div className="text-xl font-bold text-teal leading-none mt-0.5">
                  {scanned}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* action buttons above toggle */}
      {!showQuestIntro && !showIntro && (
        <div className="absolute bottom-20 left-4 right-4 z-[1000] flex items-center justify-center gap-2">
          {mode === "quest" && (
            <Button variant="primary" size="md" onClick={() => setQuestOverlayOpen(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              scan checkpoint
            </Button>
          )}
          <Button
            variant="accent"
            size="md"
            onClick={() => {
              window.open(
                "https://runsignup.com/Race/Donate/CA/Benicia/GreatBeniciaRun",
                "_blank"
              );
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            donate to STEAM
          </Button>
        </div>
      )}

      {/* floating 3-way toggle */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1 flex relative" style={{ minWidth: 300 }}>
          {/* sliding indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-200 ease-out"
            style={{
              width: "calc(33.333% - 4px)",
              left:
                mode === "race"
                  ? "4px"
                  : mode === "visitor"
                  ? "calc(33.333% + 0px)"
                  : "calc(66.666% - 2px)",
            }}
          />
          {(["race", "visitor", "quest"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleToggle(m)}
              className={`relative z-10 flex-1 py-2.5 text-xs rounded-full transition-colors ${
                mode === m ? "text-white font-medium" : "text-muted font-normal"
              }`}
            >
              {m === "race" ? "race info" : m === "visitor" ? "visitor info" : "STEAM quest"}
            </button>
          ))}
        </div>
      </div>

      {/* quest intro modal */}
      {showQuestIntro && mode === "quest" && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuestIntro(false)} />
          <div className="relative bg-white rounded-lg mx-4 p-6 max-w-sm shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-foreground">
                STEAM quest
              </h1>
              <p className="text-sm text-muted mt-1">
                a scavenger hunt around first street
              </p>
            </div>

            <div className="space-y-4 text-sm text-foreground mb-6">
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <p><strong>find QR codes</strong> at 10 businesses along first street</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <p><strong>scan & answer</strong> a STEAM question at each stop</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <p><strong>complete all 10</strong> and show at registration for a reward</p>
              </div>
            </div>

            <div className="bg-cream rounded-lg p-3 mb-5">
              <p className="text-xs text-foreground text-center leading-relaxed">
                all proceeds support the <strong>STEAM Wheel</strong> program
                — hands-on STEAM learning for elementary students.
              </p>
            </div>

            <Button variant="primary" size="xl" fullWidth onClick={() => setShowQuestIntro(false)}>
              let&apos;s go
            </Button>
          </div>
        </div>
      )}

      {/* race info overlay */}
      {showIntro && mode === "race" && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowIntro(false)} />
          <div className="relative bg-white rounded-lg mx-4 max-w-sm shadow-2xl animate-slide-up overflow-hidden">
            <div className="p-4 pb-0">
              <Image
                src="/logo-header.png"
                alt="the great benicia run"
                width={400}
                height={200}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>

            <div className="p-5 space-y-3 text-sm text-foreground">
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

              <div className="bg-cream rounded-lg p-3">
                <p className="text-xs text-foreground text-center leading-relaxed">
                  visiting or spectating? switch to <strong>STEAM quest</strong> for
                  a scavenger hunt around first street — scan QR codes, answer
                  STEAM questions, and win prizes!
                </p>
              </div>

              <Button variant="primary" size="xl" fullWidth onClick={() => setShowIntro(false)}>
                got it
              </Button>
            </div>
          </div>
        </div>
      )}

      <QuestOverlay
        open={questOverlayOpen}
        onClose={() => {
          setQuestOverlayOpen(false);
          refreshQuestCounts();
        }}
      />
    </>
  );
}
