"use client";

import { useEffect, useRef, useState, useId } from "react";

interface QRScannerProps {
  onScan: (token: string) => void;
  onError?: (error: string) => void;
}

function extractToken(text: string): string {
  const urlMatch = text.match(/\/c\/([a-f0-9]+)$/i);
  if (urlMatch) return urlMatch[1];
  return text.trim();
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const reactId = useId();
  const containerId = `qr-reader-${reactId.replace(/:/g, "")}`;
  const [mounted, setMounted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const hasScannedRef = useRef(false);
  const isRunningRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;
    let cancelled = false;

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      scanner = new Html5Qrcode(containerId);

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            isRunningRef.current = false;
            const token = extractToken(decodedText);
            scanner?.stop().catch(() => {});
            onScan(token);
          },
          () => {}
        );
        isRunningRef.current = true;
      } catch (err) {
        const msg = String(err);
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setPermissionDenied(true);
        } else {
          onError?.(msg);
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      // Only stop if the scanner actually started successfully
      if (scanner && isRunningRef.current) {
        isRunningRef.current = false;
        scanner.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualToken.trim()) {
      onScan(extractToken(manualToken));
    }
  }

  if (permissionDenied) {
    return (
      <div className="text-center space-y-4 p-6">
        <p className="text-error font-medium">Camera access denied</p>
        <p className="text-sm text-muted">
          Please enable camera permissions in your browser settings, or enter the checkpoint code manually below.
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Enter checkpoint code"
            className="flex-1 px-3 py-2 border border-card-border rounded-lg text-sm bg-white"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
            Go
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div id={containerId} className="w-full rounded-xl overflow-hidden bg-black" />
      <details className="text-center">
        <summary className="text-sm text-muted cursor-pointer">
          Can&apos;t scan? Enter code manually
        </summary>
        <form onSubmit={handleManualSubmit} className="flex gap-2 mt-2 px-4">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Enter checkpoint code"
            className="flex-1 px-3 py-2 border border-card-border rounded-lg text-sm bg-white"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
            Go
          </button>
        </form>
      </details>
    </div>
  );
}
