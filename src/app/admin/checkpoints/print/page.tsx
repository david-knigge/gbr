"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface CheckpointRow {
  id: string;
  name: string;
  slug: string;
  qr_token: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
}

export default function PrintCheckpointsPage() {
  const [rows, setRows] = useState<CheckpointRow[]>([]);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/admin/checkpoints")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: CheckpointRow[]) => {
        const active = data.filter((c) => c.is_active);
        active.sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
        setRows(active);
      })
      .catch(() => setError("Failed to load checkpoints"));
  }, []);

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!rows.length) return <p className="p-8 text-gray-500">Loading checkpoints…</p>;

  return (
    <div className="print-root">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html,
        body {
          background: #f3f4f6;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .print-root {
          --cream: #fdf8ef;
          --ink: #1f2a3a;
          --accent: #e8643b;
          --accent-soft: #f6b48a;
          --teal: #4dbfb3;
        }
        .toolbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #111827;
          color: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .toolbar button {
          background: var(--accent, #e8643b);
          color: white;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }
        .toolbar button:hover {
          filter: brightness(1.05);
        }
        .sheet {
          width: 210mm;
          height: 297mm;
          margin: 16px auto;
          background: var(--cream);
          color: var(--ink);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18mm 16mm;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
            "Helvetica Neue", sans-serif;
        }
        .sheet::before {
          content: "";
          position: absolute;
          inset: 8mm;
          border: 2px dashed var(--accent);
          border-radius: 14px;
          pointer-events: none;
        }
        .sheet::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 18mm;
          background: linear-gradient(180deg, transparent, rgba(232, 100, 59, 0.08));
          pointer-events: none;
        }
        .brandrow {
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 1;
        }
        .brandrow .logo {
          width: 70px;
          height: 70px;
          position: relative;
        }
        .brandrow .brandtext {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }
        .brandtext .top {
          font-size: 14px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--teal);
          font-weight: 700;
        }
        .brandtext .main {
          font-size: 26px;
          font-weight: 800;
          color: var(--ink);
        }
        .eyebrow {
          margin-top: 18mm;
          font-size: 15px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          font-weight: 700;
          z-index: 1;
        }
        .eyebrow .steam {
          background: var(--teal);
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.15em;
          margin-right: 8px;
        }
        .title {
          margin-top: 6mm;
          font-size: 44px;
          font-weight: 800;
          text-align: center;
          color: var(--ink);
          line-height: 1.05;
          max-width: 170mm;
          z-index: 1;
        }
        .subtitle {
          margin-top: 5mm;
          font-size: 16px;
          text-align: center;
          color: #56606e;
          max-width: 150mm;
          z-index: 1;
        }
        .qrwrap {
          margin-top: 10mm;
          background: white;
          padding: 10mm;
          border-radius: 18px;
          box-shadow: 0 6px 24px rgba(31, 42, 58, 0.12);
          border: 1px solid rgba(31, 42, 58, 0.08);
          z-index: 1;
        }
        .qrwrap img {
          display: block;
          width: 95mm;
          height: 95mm;
          image-rendering: pixelated;
        }
        .cta {
          margin-top: 9mm;
          font-size: 22px;
          font-weight: 800;
          text-align: center;
          color: var(--ink);
          z-index: 1;
        }
        .cta .arrow {
          color: var(--accent);
        }
        .url {
          margin-top: 3mm;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
          z-index: 1;
          word-break: break-all;
          max-width: 150mm;
        }
        .footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-size: 12px;
          color: #6b7280;
          z-index: 1;
        }
        .footer .pill {
          background: var(--teal);
          color: white;
          padding: 6px 14px;
          border-radius: 999px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .stopnum {
          font-weight: 800;
          color: var(--accent);
        }
        @media print {
          .toolbar {
            display: none !important;
          }
          html,
          body {
            background: white;
          }
          .sheet {
            margin: 0;
            box-shadow: none;
            page-break-after: always;
            break-after: page;
          }
          .sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="toolbar">
        <div>
          <strong>Checkpoint QR sheets</strong>{" "}
          <span style={{ opacity: 0.7 }}>· {rows.length} active</span>
        </div>
        <button onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      {rows.map((c, idx) => {
        const scanUrl = `${origin}/c/${c.qr_token}`;
        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=0&ecc=H&data=${encodeURIComponent(
          scanUrl
        )}`;
        return (
          <div className="sheet" key={c.id}>
            <div className="brandrow">
              <div className="logo">
                <Image src="/logo-square.png" alt="Great Benicia Run" fill sizes="70px" priority />
              </div>
              <div className="brandtext">
                <span className="top">A charity race</span>
                <span className="main">The Great Benicia Run</span>
              </div>
            </div>

            <div className="eyebrow">
              <span className="steam">S·T·E·A·M</span> Quest
            </div>
            <div className="title">
              Checkpoint <span className="stopnum">{idx + 1}</span>
            </div>
            <div className="subtitle">
              Science · Technology · Engineering · Art · Math
              <br />
              Scan the code, answer the question, and collect all 10 for a reward at packet pickup!
            </div>

            <div className="qrwrap">
              {/* External QR image — loaded at print time */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt={`QR code for ${c.name}`} />
            </div>

            <div className="cta">
              Scan to play the STEAM Quest <span className="arrow">→</span>
            </div>
            <div className="url">{scanUrl}</div>

            <div className="footer">
              <span className="pill">Great Benicia Run</span>
              <span>Checkpoint {idx + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
