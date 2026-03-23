"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface QuestionRow {
  id: string;
  prompt: string;
  correct_answer: string;
  is_active: boolean;
  created_at: string;
}

export default function QuestionsListPage() {
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/questions")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load questions"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Questions</h1>
        <Link
          href="/admin/questions/new"
          className="px-4 py-2 text-sm text-white rounded"
          style={{ backgroundColor: "#7B5EA7" }}
        >
          + New Question
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">No questions yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Prompt</th>
              <th className="p-3">Correct</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="p-3 max-w-md truncate">{q.prompt}</td>
                <td className="p-3 uppercase font-mono">{q.correct_answer}</td>
                <td className="p-3">{q.is_active ? "Yes" : "No"}</td>
                <td className="p-3">
                  <Link href={`/admin/questions/${q.id}`} className="text-blue-600 hover:underline">
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
