"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewQuestionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    prompt: "",
    answer_a: "",
    answer_b: "",
    answer_c: "",
    answer_d: "",
    correct_answer: "a",
    explanation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      router.push("/admin/questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">New Question</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Prompt</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.prompt}
            onChange={(e) => update("prompt", e.target.value)}
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Answer A</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.answer_a}
            onChange={(e) => update("answer_a", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Answer B</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.answer_b}
            onChange={(e) => update("answer_b", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Answer C</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.answer_c}
            onChange={(e) => update("answer_c", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Answer D (optional)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.answer_d}
            onChange={(e) => update("answer_d", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correct Answer</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.correct_answer}
            onChange={(e) => update("correct_answer", e.target.value)}
          >
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
            <option value="d">D</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Explanation</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.explanation}
            onChange={(e) => update("explanation", e.target.value)}
            rows={3}
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-white rounded text-sm font-semibold"
          style={{ backgroundColor: "#7B5EA7" }}
        >
          {saving ? "Saving..." : "Create Question"}
        </button>
      </form>
    </div>
  );
}
