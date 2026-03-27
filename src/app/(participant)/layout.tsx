"use client";

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0">
      <div className="w-full h-full relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
