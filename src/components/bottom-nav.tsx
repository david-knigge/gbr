"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Race Info" },
  { href: "/quest", label: "Raffle Quest" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
      <nav className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center p-1 gap-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === "/quest" && pathname.startsWith("/quest"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
