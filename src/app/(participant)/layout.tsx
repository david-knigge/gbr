"use client";

import { UserProvider } from "@/contexts/user-context";

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="fixed inset-0">
        <div className="w-full h-full relative overflow-hidden">
          {children}
        </div>
      </div>
    </UserProvider>
  );
}
