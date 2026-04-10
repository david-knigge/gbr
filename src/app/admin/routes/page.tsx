"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const AdminRouteEditor = dynamic(
  () => import("@/components/admin-route-editor").then((m) => m.AdminRouteEditor),
  { ssr: false, loading: () => <div className="h-[450px] bg-gray-100 rounded animate-pulse" /> }
);

const ROUTE_TYPES = ["course", "parking", "other"] as const;

interface Route {
  id: string;
  name: string;
  type: string;
  color: string;
  weight: number;
  opacity: number;
  dash_array: string | null;
  label: string | null;
  points: [number, number][];
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  name: "",
  type: "course" as string,
  color: "#E8643B",
  weight: "6",
  opacity: "0.9",
  dash_array: "",
  label: "",
  points: [] as [number, number][],
  sort_order: "0",
};

export default function RoutesAdminPage() {
  const [rows, setRows] = useState<Route[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function loadRoutes() {
    fetch("/api/admin/routes")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load routes"));
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  function startNew() {
    setEditing("new");
    setForm(emptyForm);
  }

  function startEdit(route: Route) {
    setEditing(route.id);
    setForm({
      name: route.name,
      type: route.type,
      color: route.color,
      weight: String(route.weight),
      opacity: String(route.opacity),
      dash_array: route.dash_array || "",
      label: route.label || "",
      points: route.points || [],
      sort_order: String(route.sort_order),
    });
  }

  const handlePointsChange = useCallback((pts: [number, number][]) => {
    setForm((prev) => ({ ...prev, points: pts }));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      type: form.type,
      color: form.color,
      weight: parseInt(form.weight) || 6,
      opacity: parseFloat(form.opacity) || 0.9,
      dash_array: form.dash_array || null,
      label: form.label || null,
      points: form.points,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: true,
    };

    try {
      if (editing === "new") {
        const r = await fetch("/api/admin/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error("Create failed");
      } else {
        const r = await fetch(`/api/admin/routes/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error("Update failed");
      }
      setEditing(null);
      loadRoutes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this route?")) return;
    const r = await fetch(`/api/admin/routes/${id}`, { method: "DELETE" });
    if (r.ok) loadRoutes();
    else setError("Delete failed");
  }

  function clearPoints() {
    setForm((prev) => ({ ...prev, points: [] }));
  }

  function undoLastPoint() {
    setForm((prev) => ({ ...prev, points: prev.points.slice(0, -1) }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Routes</h1>
        <button
          onClick={startNew}
          className="px-4 py-2 text-sm text-white rounded"
          style={{ backgroundColor: "#4DBFB3" }}
        >
          + New Route
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {editing && (
        <div className="bg-white rounded shadow p-4 mb-6 space-y-4">
          <h2 className="font-semibold text-lg">
            {editing === "new" ? "New Route" : "Edit Route"}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 5K Course"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {ROUTE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. 8:00 AM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  className="w-10 h-9 border rounded cursor-pointer"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <input
                  className="flex-1 border rounded px-3 py-2 text-sm font-mono"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line Weight</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                type="number"
                min="1"
                max="20"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                type="number"
                min="0.1"
                max="1"
                step="0.1"
                value={form.opacity}
                onChange={(e) => setForm({ ...form, opacity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dash <span className="text-gray-400 font-normal">(optional, e.g. 6 8)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.dash_array}
                onChange={(e) => setForm({ ...form, dash_array: e.target.value })}
                placeholder="solid if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Waypoints ({form.points.length})
            </p>
            <button
              onClick={undoLastPoint}
              disabled={form.points.length === 0}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30"
            >
              undo last
            </button>
            <button
              onClick={clearPoints}
              disabled={form.points.length === 0}
              className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded disabled:opacity-30"
            >
              clear all
            </button>
          </div>

          <AdminRouteEditor
            points={form.points}
            color={form.color}
            onChange={handlePointsChange}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || form.points.length < 2}
              className="px-4 py-2 text-sm text-white rounded disabled:opacity-50"
              style={{ backgroundColor: "#4DBFB3" }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-gray-500">No routes yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Color</th>
              <th className="p-3">Points</th>
              <th className="p-3">Label</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 font-medium">{r.type}</span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded" style={{ background: r.color }} />
                    <span className="text-xs font-mono text-gray-500">{r.color}</span>
                  </span>
                </td>
                <td className="p-3 text-gray-500">{r.points?.length || 0}</td>
                <td className="p-3 text-gray-500 text-xs">{r.label || "—"}</td>
                <td className="p-3">
                  <span className={`text-xs font-medium ${r.is_active ? "text-green-600" : "text-gray-400"}`}>
                    {r.is_active ? "Yes" : "No"}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => startEdit(r)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
