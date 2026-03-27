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
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setStats)
      .catch(() => setError("Failed to load stats"));
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      const r = await fetch("/api/admin/export");
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "snapshot.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  }

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 text-sm text-white rounded disabled:opacity-50"
          style={{ backgroundColor: "#7B5EA7" }}
        >
          {exporting ? "Exporting..." : "📦 Export snapshot"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Export downloads all POIs, checkpoints & questions as JSON. Drop the file into <code className="bg-gray-100 px-1 rounded">public/data/snapshot.json</code> and commit — the site will use it as a fallback if the database is unreachable.
      </p>
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
