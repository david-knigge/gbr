"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
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

export default function RaceInfoPage() {
  const [donateOpen, setDonateOpen] = useState(false);

  return (
    <>
      {/* Fullscreen map */}
      <div className="absolute inset-0">
        <RaceMap showCourses showPOIs />
      </div>

      {/* Event header overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg flex items-center gap-2.5">
        <Image
          src="/logo-square.png"
          alt="Great Benicia Run"
          width={36}
          height={36}
          className="rounded-full"
        />
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight">
            The Great Benicia Run
          </h1>
          <p className="text-[10px] text-muted">Strait to the Finish</p>
        </div>
      </div>

      {/* Donate FAB */}
      <button
        onClick={() => setDonateOpen(true)}
        className="absolute bottom-16 right-3 z-[1000] bg-coral text-white px-5 py-3 rounded-full shadow-lg hover:bg-coral-light active:bg-coral transition-colors font-bold text-sm flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
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

      {/* Donate overlay */}
      <DonateOverlay open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  );
}
