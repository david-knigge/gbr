"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const AdminMapPicker = dynamic(
  () => import("@/components/admin-map-picker").then((m) => m.AdminMapPicker),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded animate-pulse" /> }
);

const POI_TYPES = [
  "parking",
  "registration",
  "start",
  "finish",
  "aid",
  "restroom",
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "retail",
  "gallery",
  "service",
  "historic",
  "park",
  "viewpoint",
  "marina",
  "stand",
  "info",
  "other",
];

const POI_CATEGORIES = ["race", "visitor", "both"] as const;

interface POI {
  id: string;
  name: string;
  type: string;
  category: string;
  position_lat: number;
  position_lng: number;
  location: string;
  hours: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  name: "",
  type: "other",
  category: "race",
  position_lat: "",
  position_lng: "",
  location: "",
  hours: "",
  description: "",
  sort_order: "0",
};

export default function POIsAdminPage() {
  const [rows, setRows] = useState<POI[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function loadPOIs() {
    fetch("/api/admin/pois")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load POIs"));
  }

  useEffect(() => {
    loadPOIs();
  }, []);

  function startNew() {
    setEditing("new");
    setForm(emptyForm);
  }

  function startEdit(poi: POI) {
    setEditing(poi.id);
    setForm({
      name: poi.name,
      type: poi.type,
      category: poi.category || "race",
      position_lat: String(poi.position_lat),
      position_lng: String(poi.position_lng),
      location: poi.location || "",
      hours: poi.hours || "",
      description: poi.description || "",
      sort_order: String(poi.sort_order),
    });
  }

  const handleMapChange = useCallback((lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      position_lat: String(lat),
      position_lng: String(lng),
    }));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      type: form.type,
      category: form.category,
      position_lat: parseFloat(form.position_lat),
      position_lng: parseFloat(form.position_lng),
      location: form.location,
      hours: form.hours || null,
      description: form.description || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: true,
    };

    try {
      if (editing === "new") {
        const r = await fetch("/api/admin/pois", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error("Create failed");
      } else {
        const r = await fetch(`/api/admin/pois/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error("Update failed");
      }
      setEditing(null);
      loadPOIs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this POI?")) return;
    const r = await fetch(`/api/admin/pois/${id}`, { method: "DELETE" });
    if (r.ok) loadPOIs();
    else setError("Delete failed");
  }

  async function handleToggle(poi: POI) {
    await fetch(`/api/admin/pois/${poi.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...poi, is_active: !poi.is_active }),
    });
    loadPOIs();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Map Points of Interest</h1>
        <button
          onClick={startNew}
          className="px-4 py-2 text-sm text-white rounded"
          style={{ backgroundColor: "#4DBFB3" }}
        >
          + New POI
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Edit/Create form */}
      {editing && (
        <div className="bg-white rounded shadow p-4 mb-6 space-y-4">
          <h2 className="font-semibold text-lg">
            {editing === "new" ? "New POI" : "Edit POI"}
          </h2>

          {/* Map picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position — click map or drag marker
            </label>
            <AdminMapPicker
              lat={form.position_lat ? parseFloat(form.position_lat) : null}
              lng={form.position_lng ? parseFloat(form.position_lng) : null}
              onChange={handleMapChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Joe's Coffee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {POI_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (tab)
              </label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {POI_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
              />
            </div>
          </div>

          <hr className="border-gray-200" />
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Popup details</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📍 Location <span className="text-gray-400 font-normal">(shown in popup, links to Maps)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. 123 First Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🕐 Hours / time <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="e.g. opens 7:00 AM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📝 Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. great coffee & pastries"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.position_lat || !form.position_lng || !form.location}
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

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-gray-500">No POIs yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Tab</th>
              <th className="p-3">Location</th>
              <th className="p-3">Hours</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 font-medium">
                    {p.type}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-50 font-medium text-blue-700">
                    {p.category || "race"}
                  </span>
                </td>
                <td className="p-3 text-gray-600 truncate max-w-48">
                  {p.location || <span className="text-gray-300">—</span>}
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {p.hours || <span className="text-gray-300">—</span>}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggle(p)}
                    className={`text-xs font-medium ${p.is_active ? "text-green-600" : "text-gray-400"}`}
                  >
                    {p.is_active ? "Yes" : "No"}
                  </button>
                </td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
