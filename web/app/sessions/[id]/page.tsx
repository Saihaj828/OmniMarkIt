"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, apiBase, ApiError, type Material, type Payment, type SessionRow } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCents, formatDateTime, statusColor } from "@/lib/format";
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from "@/components/ui";
import { PdfUpload } from "@/components/PdfUpload";
import { SessionRoom } from "@/components/SessionRoom";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [session, setSession] = useState<SessionRow | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  // payment + material inputs
  const [promo, setPromo] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialFileUrl, setMaterialFileUrl] = useState("");
  // reschedule (E2), consent gate (SL1), report modal (SL2)
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [consented, setConsented] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate behavior");
  const [reportDetail, setReportDetail] = useState("");

  function load() {
    return api.session(id).then(setSession);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    Promise.all([
      load(),
      api.materials(id).then(setMaterials),
      user.role === "student" ? api.myPayments().then(setPayments) : Promise.resolve(),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, authLoading, user]);

  if (loading || !session) return <Spinner />;

  const paid = payments.some(
    (p) => p.session_id === session.id && p.status === "succeeded"
  );
  const isStudent = user?.role === "student";

  async function pay() {
    if (!session) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.pay(session.id, promo || undefined);
      const ps = await api.myPayments();
      setPayments(ps);
      setMsg({ kind: "ok", text: "Payment successful." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Payment failed" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelSession() {
    if (!session) return;
    if (typeof window !== "undefined" && !window.confirm("Cancel this session?")) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.cancelSession(session.id);
      await load();
      setMsg({ kind: "ok", text: "Session cancelled." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Cancel failed" });
    } finally {
      setBusy(false);
    }
  }

  async function reschedule() {
    if (!session || !rescheduleTime) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.rescheduleSession(session.id, new Date(rescheduleTime).toISOString());
      await load();
      setShowReschedule(false);
      setMsg({ kind: "ok", text: "Session rescheduled." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Reschedule failed" });
    } finally {
      setBusy(false);
    }
  }

  async function payFail() {
    if (!session) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.pay(session.id, promo || undefined, true); // force decline (E3)
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof ApiError ? e.message : "Payment failed",
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (!session) return;
    try {
      await api.flagSession(session.id, { reason: reportReason, detail: reportDetail });
      setReportOpen(false);
      setReportDetail("");
      setMsg({ kind: "ok", text: "Report submitted to trust & safety." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Report failed" });
    }
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !materialTitle.trim()) return;
    try {
      await api.addMaterial(session.id, {
        title: materialTitle.trim(),
        file_url: materialFileUrl || undefined,
      });
      setMaterialTitle("");
      setMaterialFileUrl("");
      setMaterials(await api.materials(session.id));
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Upload failed" });
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.review({ session_id: session.id, rating, comment: comment || undefined });
      setReviewed(true);
      setMsg({ kind: "ok", text: "Thanks for your review!" });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Review failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {session.subject_name} session
            </h1>
            <p className="text-navy/60">
              {isStudent ? `with ${session.tutor_name}` : `student: ${session.student_name}`}
            </p>
          </div>
          <Badge className={statusColor(session.status)}>{session.status}</Badge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-navy/50">When</dt>
            <dd className="font-medium">{formatDateTime(session.start_time)}</dd>
          </div>
          <div>
            <dt className="text-navy/50">Duration</dt>
            <dd className="font-medium">{session.duration_minutes} minutes</dd>
          </div>
          <div>
            <dt className="text-navy/50">Price</dt>
            <dd className="font-mono font-medium">{formatCents(session.price_cents)}</dd>
          </div>
          <div>
            <dt className="text-navy/50">Payment</dt>
            <dd className="font-medium">
              {paid ? (
                <span className="text-green-700">Paid</span>
              ) : isStudent ? (
                <span className="text-amber-700">Due</span>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Session room with consent gate (SL1) */}
      {session.status !== "cancelled" && (
        <Card className="bg-navy text-cream">
          <h2 className="font-serif text-lg font-semibold">Session room</h2>
          {!consented ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-cream/70">
                Before joining, please confirm you agree to our session conduct &amp;
                recording policy. Sessions may be recorded for quality and safety.
              </p>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  onChange={(e) => setConsented(e.target.checked)}
                />
                <span>
                  I agree to the conduct &amp; recording policy and understand I can
                  report or end the session at any time.
                </span>
              </label>
            </div>
          ) : (
            <div className="mt-2">
              <div className="mb-2 flex gap-2">
                <button
                  onClick={() => setReportOpen(true)}
                  className="rounded-lg border border-cream/30 px-3 py-1.5 text-xs text-cream hover:bg-white/10"
                >
                  Report a problem
                </button>
                <button
                  onClick={() => setConsented(false)}
                  className="rounded-lg border border-cream/30 px-3 py-1.5 text-xs text-cream hover:bg-white/10"
                >
                  Leave room
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Live video + whiteboard + recordings */}
      {session.status !== "cancelled" && consented && user && (
        <SessionRoom session={session} user={user} />
      )}

      {/* Payment (student, unpaid) */}
      {isStudent && !paid && session.status !== "cancelled" && (
        <Card>
          <h2 className="mb-2 font-serif text-lg font-semibold">Payment</h2>
          <p className="mb-3 text-sm text-navy/60">
            Pay {formatCents(session.price_cents)} to confirm this session.{" "}
            <span className="text-navy/40">
              (Processed via Stripe — simulated unless a live key is set.)
            </span>
          </p>
          <div className="flex items-end gap-2">
            <Input
              label="Promo code (try WELCOME10)"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={pay} disabled={busy}>
              {busy ? "Processing…" : `Pay ${formatCents(session.price_cents)}`}
            </Button>
          </div>
          {msg?.kind === "err" && (
            <p className="mt-2 text-sm text-red-600">
              {msg.text}{" "}
              <button onClick={() => setMsg(null)} className="font-medium underline">
                Try again
              </button>
            </p>
          )}
          <button
            onClick={payFail}
            className="mt-2 text-xs text-navy/40 underline"
            disabled={busy}
          >
            (demo: simulate a declined card)
          </button>
        </Card>
      )}

      {/* Materials */}
      {session.status !== "cancelled" && (
        <Card>
          <h2 className="mb-2 font-serif text-lg font-semibold">Materials</h2>
          {materials.length === 0 ? (
            <p className="text-sm text-navy/50">No materials shared yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Badge>{m.kind}</Badge>
                  <span>{m.title}</span>
                  {m.file_url && (
                    <a
                      href={apiBase() + m.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold underline"
                    >
                      open PDF
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addMaterial} className="mt-3 space-y-2">
            <div className="flex items-end gap-2">
              <Input
                label="Add a material"
                placeholder="e.g. Worksheet"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                className="max-w-xs"
              />
              <Button type="submit" variant="outline">
                Add
              </Button>
            </div>
            <div className="max-w-xs">
              <PdfUpload
                label="Attach a PDF"
                onUploaded={(url, fn) => {
                  setMaterialFileUrl(url);
                  if (!materialTitle) setMaterialTitle(fn);
                }}
              />
            </div>
          </form>
        </Card>
      )}

      {/* Actions: reschedule + cancel (scheduled) + flag */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          {session.status === "scheduled" && (
            <>
              <Button variant="outline" onClick={() => setShowReschedule((v) => !v)}>
                Reschedule
              </Button>
              <Button variant="danger" onClick={cancelSession} disabled={busy}>
                Cancel session
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setReportOpen(true)}>
            Flag for trust &amp; safety
          </Button>
          <Link href="/disputes" className="text-sm font-medium text-gold">
            Open a dispute →
          </Link>
        </div>

        {showReschedule && session.status === "scheduled" && (
          <div className="mt-4 flex items-end gap-2 border-t border-navy/10 pt-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">New date &amp; time</span>
              <input
                type="datetime-local"
                className="rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </label>
            <Button onClick={reschedule} disabled={busy || !rescheduleTime}>
              Confirm
            </Button>
          </div>
        )}
      </Card>

      {/* Report modal (SL2) */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <Card className="w-full max-w-md">
            <h2 className="mb-3 font-serif text-lg font-semibold">Report a problem</h2>
            <div className="space-y-3">
              <Select
                label="Reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option>Inappropriate behavior</option>
                <option>No-show</option>
                <option>Safety concern</option>
                <option>Other</option>
              </Select>
              <Textarea
                label="Details (optional)"
                rows={3}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="danger" onClick={submitReport}>
                  Submit report
                </Button>
                <Button variant="ghost" onClick={() => setReportOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Review (student, completed) */}
      {isStudent && session.status === "completed" && !reviewed && (
        <Card>
          <h2 className="mb-2 font-serif text-lg font-semibold">Leave a review</h2>
          <form onSubmit={submitReview} className="space-y-3">
            <Select
              label="Rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </Select>
            <Textarea
              label="Comment (optional)"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              Submit review
            </Button>
          </form>
        </Card>
      )}

      {msg && (
        <p className={msg.kind === "ok" ? "text-green-700" : "text-red-600"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
