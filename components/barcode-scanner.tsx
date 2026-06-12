"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseJanFromBarcode } from "@/lib/barcode/parse-jan";

export type BarcodeScannerLabels = {
  title: string;
  hint: string;
  close: string;
  starting: string;
  cameraError: string;
  invalidJan: string;
  scanButton: string;
};

type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onScan: (jan: string) => void;
  labels: BarcodeScannerLabels;
  accent?: "saffron" | "teal";
};

export function BarcodeScanner({
  open,
  onClose,
  onScan,
  labels,
  accent = "saffron",
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  onScanRef.current = onScan;
  onCloseRef.current = onClose;

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setError(null);
      setStarting(false);
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    async function start() {
      setStarting(true);
      setError(null);

      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) {
          return;
        }

        const deviceId = devices.at(-1)?.deviceId ?? devices[0]?.deviceId;
        const video = videoRef.current;

        if (!deviceId || !video) {
          setError(labels.cameraError);
          return;
        }

        const controls = await reader.decodeFromVideoDevice(deviceId, video, (result) => {
          if (!result || cancelled) {
            return;
          }

          const jan = parseJanFromBarcode(result.getText());
          if (!jan) {
            setError(labels.invalidJan);
            return;
          }

          cancelled = true;
          controls.stop();
          controlsRef.current = null;
          onScanRef.current(jan);
          onCloseRef.current();
        });

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
      } catch {
        if (!cancelled) {
          setError(labels.cameraError);
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, labels.cameraError, labels.invalidJan, stopScanner]);

  if (!open) {
    return null;
  }

  const frameBorder = accent === "teal" ? "border-teal-800/80" : "border-saffron/80";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-card p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 id="barcode-scanner-title" className="font-display text-lg font-bold text-ink">
            {labels.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-bold text-sage hover:bg-sand"
          >
            {labels.close}
          </button>
        </div>

        <p className="mt-2 text-sm text-sage">{labels.hint}</p>

        <div className="relative mt-4 overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
          <div
            className={`pointer-events-none absolute inset-8 rounded-lg border-2 ${frameBorder}`}
          />
        </div>

        {starting ? <p className="mt-3 text-sm text-sage">{labels.starting}</p> : null}
        {error ? (
          <p className="mt-3 text-sm font-medium text-[var(--verdict-avoid)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
