"use client";

import { useRef, useState } from "react";
import { ApiError, uploadPdf } from "@/lib/api";
import { useToast } from "@/lib/toast";

/** A PDF-only file picker. Validates client-side, uploads, returns the stored URL. */
export function PdfUpload({
  label = "Upload PDF",
  onUploaded,
}: {
  label?: string;
  onUploaded: (url: string, filename: string) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    // Client-side validation: PDF only.
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast("Only PDF files are allowed", "error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const res = await uploadPdf(file);
      setFilename(res.filename);
      onUploaded(res.url, res.filename);
      toast("PDF uploaded ✓");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Upload failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-dashed border-navy/30 px-3 py-2 text-sm text-navy/70 hover:border-gold hover:bg-navy/5 disabled:opacity-50"
      >
        {busy ? "Uploading…" : filename ? `✓ ${filename}` : `📄 ${label} (PDF only)`}
      </button>
    </div>
  );
}
