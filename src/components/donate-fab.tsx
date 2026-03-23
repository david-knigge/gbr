"use client";

import { usePathname } from "next/navigation";

export function DonateFAB() {
  const pathname = usePathname();

  // Hide on donate page itself and on admin pages
  if (pathname === "/donate" || pathname.startsWith("/admin")) return null;

  return (
    <button
      onClick={() => window.open("https://givebutter.com", "_blank")}
      className="fixed bottom-20 right-4 z-50 bg-coral text-white px-5 py-3 rounded-full shadow-lg hover:bg-coral-light active:bg-coral transition-colors font-bold text-sm flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      Donate
    </button>
  );
}
