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
      <div className="w-full h-full bg-cream animate-pulse" />
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
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
        <Image
          src="/logo-square.png"
          alt="Great Benicia Run"
          width={44}
          height={44}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight tracking-tight">
            The Great Benicia Run
          </h1>
          <p className="text-xs text-muted font-medium">
            Strait to the Finish — May 18, 2026
          </p>
        </div>
      </div>

      {/* Donate FAB */}
      <button
        onClick={() => setDonateOpen(true)}
        className="absolute bottom-18 right-4 z-[1000] bg-primary text-white px-5 py-3 rounded-lg shadow-lg hover:bg-primary-light active:bg-primary-dark transition-all font-bold text-sm uppercase tracking-wide flex items-center gap-2"
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
