"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const AdminMapPicker = dynamic(
  () => import("@/components/admin-map-picker").then((m) => m.AdminMapPicker),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded animate-pulse" /> }
);

interface QuestionOption {
  id: string;
  prompt: string;
}

export default function NewCheckpointPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    entries_awarded: 1,
    question_id: "",
    sort_order: "",
    position_lat: "",
    position_lng: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/questions")
      .then((r) => r.json())
      .then((data) => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleMapChange = useCallback((lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, position_lat: String(lat), position_lng: String(lng) }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.position_lat || !form.position_lng) {
      setError("Please set a position on the map");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          entries_awarded: Number(form.entries_awarded),
          sort_order: form.sort_order ? Number(form.sort_order) : null,
          question_id: form.question_id || null,
          position_lat: form.position_lat ? parseFloat(form.position_lat) : null,
          position_lng: form.position_lng ? parseFloat(form.position_lng) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      router.push("/admin/checkpoints");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Checkpoint</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
        </div>

        {/* Map picker for position */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Position on map <span className="text-red-500">*</span>
          </label>
          <AdminMapPicker
            lat={form.position_lat ? parseFloat(form.position_lat) : null}
            lng={form.position_lng ? parseFloat(form.position_lng) : null}
            onChange={handleMapChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Entries Awarded</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.entries_awarded}
            onChange={(e) => update("entries_awarded", e.target.value)}
            min={0}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.question_id}
            onChange={(e) => update("question_id", e.target.value)}
          >
            <option value="">None</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.prompt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sort Order</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.sort_order}
            onChange={(e) => update("sort_order", e.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-white rounded text-sm font-semibold"
          style={{ backgroundColor: "#4DBFB3" }}
        >
          {saving ? "Saving..." : "Create Checkpoint"}
        </button>
      </form>
    </div>
  );
}
