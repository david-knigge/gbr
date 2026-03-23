"use client";

import { useEffect, useState, use, useCallback } from "react";
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

export default function EditCheckpointPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    entries_awarded: 1,
    question_id: "",
    sort_order: "",
    is_active: true,
    qr_token: "",
    position_lat: "",
    position_lng: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/checkpoints/${id}`).then((r) => r.json()),
      fetch("/api/admin/questions").then((r) => r.json()),
    ])
      .then(([checkpoint, qs]) => {
        setForm({
          name: checkpoint.name || "",
          slug: checkpoint.slug || "",
          description: checkpoint.description || "",
          entries_awarded: checkpoint.entries_awarded ?? 1,
          question_id: checkpoint.question_id || "",
          sort_order: checkpoint.sort_order?.toString() ?? "",
          is_active: checkpoint.is_active ?? true,
          qr_token: checkpoint.qr_token || "",
          position_lat: checkpoint.position_lat?.toString() ?? "",
          position_lng: checkpoint.position_lng?.toString() ?? "",
        });
        setQuestions(Array.isArray(qs) ? qs : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load checkpoint");
        setLoading(false);
      });
  }, [id]);

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleMapChange = useCallback((lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, position_lat: String(lat), position_lng: String(lng) }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/checkpoints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          entries_awarded: Number(form.entries_awarded),
          question_id: form.question_id || null,
          sort_order: form.sort_order ? Number(form.sort_order) : null,
          is_active: form.is_active,
          position_lat: form.position_lat ? parseFloat(form.position_lat) : null,
          position_lng: form.position_lng ? parseFloat(form.position_lng) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.push("/admin/checkpoints");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this checkpoint?")) return;
    await fetch(`/api/admin/checkpoints/${id}`, { method: "DELETE" });
    router.push("/admin/checkpoints");
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Checkpoint</h1>

      {form.qr_token && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <span className="font-medium">QR URL:</span>{" "}
          <code className="text-blue-700">/c/{form.qr_token}</code>
        </div>
      )}

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
            Position on map (optional)
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
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
            id="is_active"
          />
          <label htmlFor="is_active" className="text-sm">
            Active
          </label>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-white rounded text-sm font-semibold"
            style={{ backgroundColor: "#4DBFB3" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
