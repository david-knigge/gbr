"use client";

import { useEffect, useState } from "react";

interface RaffleRow {
  email: string;
  nickname: string;
  app_code: string;
  total_entries: number;
}

export default function RafflePage() {
  const [rows, setRows] = useState<RaffleRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/raffle/export")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.text();
      })
      .then((csv) => {
        const lines = csv.split("\n").slice(1); // skip header
        const parsed: RaffleRow[] = [];
        for (const line of lines) {
          if (!line.trim()) continue;
          // Simple CSV parse for our known format: "email","nickname","app_code",total
          const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)",(\d+)$/);
          if (match) {
            parsed.push({
              email: match[1],
              nickname: match[2],
              app_code: match[3],
              total_entries: parseInt(match[4], 10),
            });
          }
        }
        parsed.sort((a, b) => b.total_entries - a.total_entries);
        setRows(parsed);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load raffle data");
        setLoading(false);
      });
  }, []);

  function handleDownload() {
    window.open("/api/admin/raffle/export", "_blank");
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Raffle Entries</h1>
        <button
          onClick={handleDownload}
          className="px-4 py-2 text-sm text-white rounded"
          style={{ backgroundColor: "#E8643B" }}
        >
          Download CSV
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">No raffle entries yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Nickname</th>
              <th className="p-3">App Code</th>
              <th className="p-3 text-right">Total Entries</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.app_code} className="border-t">
                <td className="p-3">{r.email || "—"}</td>
                <td className="p-3">{r.nickname || "—"}</td>
                <td className="p-3 font-mono text-xs">{r.app_code}</td>
                <td className="p-3 text-right font-bold" style={{ color: "#4DBFB3" }}>
                  {r.total_entries}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
