"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Dispute } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCents, formatDate, statusColor } from "@/lib/format";
import { Badge, Button, Card, Select, Spinner, Textarea } from "@/components/ui";

const CATEGORIES = [
  ["quality", "Session quality"],
  ["no_show", "No-show"],
  ["billing", "Billing issue"],
  ["conduct", "Conduct"],
];

export default function DisputesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("quality");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function reload() {
    return api.myDisputes().then(setDisputes);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    reload()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.createDispute({ category, description });
      setDescription("");
      await reload();
      setMsg({ kind: "ok", text: "Dispute filed. Our team will review it." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <h1 className="font-serif text-3xl font-bold">Disputes</h1>
        {disputes.length === 0 ? (
          <Card>
            <p className="text-sm text-navy/50">You have no disputes.</p>
          </Card>
        ) : (
          disputes.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize">{d.category.replace("_", " ")}</p>
                  <p className="text-sm text-navy/70">{d.description}</p>
                  <p className="mt-1 text-xs text-navy/50">{formatDate(d.created_at)}</p>
                </div>
                <Badge className={statusColor(d.status)}>{d.status}</Badge>
              </div>
              {d.resolution && (
                <div className="mt-3 rounded-lg bg-cream p-3 text-sm">
                  <p className="font-medium">Resolution</p>
                  <p className="text-navy/70">{d.resolution}</p>
                  {!!d.refund_amount_cents && (
                    <p className="mt-1 text-green-700">
                      Refund: {formatCents(d.refund_amount_cents)}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <aside>
        <h2 className="mb-3 font-serif text-xl font-semibold">File a dispute</h2>
        <Card>
          <form onSubmit={submit} className="space-y-3">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
            <Textarea
              label="What happened?"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            {msg && (
              <p className={`text-sm ${msg.kind === "ok" ? "text-green-700" : "text-red-600"}`}>
                {msg.text}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Submitting…" : "Submit dispute"}
            </Button>
          </form>
        </Card>
      </aside>
    </div>
  );
}
