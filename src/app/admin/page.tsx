"use client";

import { useEffect, useState } from "react";

interface Stats {
  total_users: number;
  total_scans: number;
  total_donations: number;
  total_raffle_entries: number;
  unmatched_donations: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setStats)
      .catch(() => setError("Failed to load stats"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-gray-500">Loading...</p>;

  const cards = [
    { label: "Total Users", value: stats.total_users, color: "#4DBFB3" },
    { label: "Total Scans", value: stats.total_scans, color: "#7B5EA7" },
    { label: "Total Donations", value: stats.total_donations, color: "#E8643B" },
    { label: "Raffle Entries", value: stats.total_raffle_entries, color: "#4DBFB3" },
    { label: "Unmatched Donations", value: stats.unmatched_donations, color: "#E8643B" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded shadow p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: c.color }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
