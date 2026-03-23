"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CheckpointRow {
  id: string;
  name: string;
  slug: string;
  qr_token: string;
  is_active: boolean;
  sort_order: number | null;
  questions: { id: string; prompt: string } | null;
}

export default function CheckpointsListPage() {
  const [rows, setRows] = useState<CheckpointRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/checkpoints")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load checkpoints"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Checkpoints</h1>
        <Link
          href="/admin/checkpoints/new"
          className="px-4 py-2 text-sm text-white rounded"
          style={{ backgroundColor: "#4DBFB3" }}
        >
          + New Checkpoint
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">No checkpoints yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">QR Token</th>
              <th className="p-3">Active</th>
              <th className="p-3">Question</th>
              <th className="p-3">Order</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-600">{c.slug}</td>
                <td className="p-3 font-mono text-xs">{c.qr_token}</td>
                <td className="p-3">{c.is_active ? "Yes" : "No"}</td>
                <td className="p-3 text-gray-600 truncate max-w-48">
                  {c.questions ? c.questions.prompt : "—"}
                </td>
                <td className="p-3">{c.sort_order ?? "—"}</td>
                <td className="p-3">
                  <Link href={`/admin/checkpoints/${c.id}`} className="text-blue-600 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
