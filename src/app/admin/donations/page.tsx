"use client";

import { useEffect, useState } from "react";

interface DonationRow {
  id: string;
  donor_email: string | null;
  amount_cents: number;
  race_app_code: string | null;
  user_id: string | null;
  status: string;
  created_at: string;
}

export default function DonationsPage() {
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [error, setError] = useState("");
  const [linkCodes, setLinkCodes] = useState<Record<string, string>>({});
  const [linking, setLinking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/donations")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load donations"));
  }, []);

  async function handleLink(donationId: string) {
    const code = linkCodes[donationId];
    if (!code) return;
    setLinking((prev) => ({ ...prev, [donationId]: true }));
    try {
      const res = await fetch(`/api/admin/donations/${donationId}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_code: code }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to link");
        return;
      }
      // Refresh
      const refreshed = await fetch("/api/admin/donations").then((r) => r.json());
      setRows(refreshed);
      setLinkCodes((prev) => {
        const next = { ...prev };
        delete next[donationId];
        return next;
      });
    } catch {
      alert("Network error");
    } finally {
      setLinking((prev) => ({ ...prev, [donationId]: false }));
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Donations</h1>
      {rows.length === 0 ? (
        <p className="text-gray-500">No donations yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Amount</th>
              <th className="p-3">App Code</th>
              <th className="p-3">Status</th>
              <th className="p-3">Matched</th>
              <th className="p-3">Date</th>
              <th className="p-3">Reconcile</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const isMatched = !!d.user_id;
              return (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.donor_email || "—"}</td>
                  <td className="p-3 font-mono">${(d.amount_cents / 100).toFixed(2)}</td>
                  <td className="p-3 font-mono text-xs">{d.race_app_code || "—"}</td>
                  <td className="p-3">{d.status}</td>
                  <td className="p-3">
                    <span className={isMatched ? "text-green-600 font-semibold" : "text-red-500"}>
                      {isMatched ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    {!isMatched && (
                      <div className="flex gap-1">
                        <input
                          className="border rounded px-2 py-1 text-xs w-28"
                          placeholder="app_code"
                          value={linkCodes[d.id] || ""}
                          onChange={(e) =>
                            setLinkCodes((prev) => ({ ...prev, [d.id]: e.target.value }))
                          }
                        />
                        <button
                          onClick={() => handleLink(d.id)}
                          disabled={linking[d.id]}
                          className="px-2 py-1 text-xs text-white rounded"
                          style={{ backgroundColor: "#E8643B" }}
                        >
                          {linking[d.id] ? "..." : "Link"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
