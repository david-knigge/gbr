"use client";

import { UserProvider } from "@/contexts/user-context";
import { BottomNav } from "@/components/bottom-nav";

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="fixed inset-0 flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>
        <BottomNav />
      </div>
    </UserProvider>
  );
}
