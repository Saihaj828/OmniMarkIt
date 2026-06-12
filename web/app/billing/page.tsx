"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type BillingPlan, type Payment, type Subscription } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { formatCents, formatDate } from "@/lib/format";
import { Badge, Button, Card, Spinner } from "@/components/ui";

// Detailed, human-readable benefits shown before purchase (item 5).
const PLAN_DETAILS: Record<string, string[]> = {
  Starter: [
    "Browse and book any verified tutor",
    "Pay per session — no monthly commitment",
    "Messaging, reviews, and dispute support",
  ],
  Plus: [
    "Everything in Starter",
    "Priority booking with top-rated tutors",
    "Discounted per-session rates",
    "Email + in-app session reminders",
  ],
  Pro: [
    "Everything in Plus",
    "Best value per session for frequent learners",
    "Dedicated support and faster dispute resolution",
    "Monthly progress summary",
  ],
};

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [confirmPlan, setConfirmPlan] = useState<BillingPlan | null>(null);

  function reload() {
    return Promise.all([api.plans(), api.mySubscription(), api.myPayments()]).then(
      ([p, s, pay]) => {
        setPlans(p);
        setSubscription(s);
        setPayments(pay);
      }
    );
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    if (user.role !== "student") return void router.push("/dashboard");
    reload()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function subscribe(planId: string) {
    setBusy(planId);
    setMsg("");
    try {
      await api.subscribe(planId);
      await reload();
      setConfirmPlan(null);
      toast("Subscription updated!");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    try {
      await api.cancelSubscription();
      await reload();
      toast("Subscription cancelled.", "info");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Billing &amp; plans</h1>
        <p className="text-navy/60">Manage your subscription and view payment history.</p>
      </div>

      {subscription && (
        <Card className="border-gold/40 bg-cream">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-navy/60">Current plan</p>
              <p className="font-serif text-xl font-bold">{subscription.plan?.name}</p>
              {subscription.current_period_end && (
                <p className="text-xs text-navy/50">
                  Renews {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={cancel} disabled={busy === "cancel"}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const active = subscription?.plan_id === p.id;
          return (
            <Card key={p.id} className={active ? "border-gold" : ""}>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold">{p.name}</h3>
                {active && <Badge className="bg-green-100 text-green-800">current</Badge>}
              </div>
              <p className="mt-1 text-sm text-navy/60">{p.description}</p>
              <p className="mt-3 font-mono text-2xl font-bold">
                {p.price_cents === 0 ? "Free" : formatCents(p.price_cents)}
                {p.price_cents > 0 && (
                  <span className="text-xs font-normal text-navy/50">/mo</span>
                )}
              </p>
              <p className="mt-1 text-xs text-navy/50">
                {p.sessions_included > 0
                  ? `${p.sessions_included} sessions included`
                  : "Pay per session"}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-navy/70">
                {(PLAN_DETAILS[p.name] ?? []).map((f) => (
                  <li key={f} className="flex gap-1.5">
                    <span className="text-gold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                variant={active ? "outline" : "primary"}
                disabled={active}
                onClick={() => setConfirmPlan(p)}
              >
                {active ? "Active" : "Choose plan"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Plan confirmation — clear details before any payment (item 5) */}
      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <Card className="w-full max-w-md">
            <h2 className="font-serif text-xl font-bold">{confirmPlan.name} plan</h2>
            <p className="mt-1 text-sm text-navy/70">{confirmPlan.description}</p>
            <p className="mt-3 font-mono text-3xl font-bold">
              {confirmPlan.price_cents === 0
                ? "Free"
                : formatCents(confirmPlan.price_cents)}
              {confirmPlan.price_cents > 0 && (
                <span className="text-sm font-normal text-navy/50"> /month</span>
              )}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-navy/80">
              {(PLAN_DETAILS[confirmPlan.name] ?? []).map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-gold">✓</span>
                  <span>{f}</span>
                </li>
              ))}
              <li className="flex gap-2">
                <span className="text-gold">✓</span>
                <span>
                  {confirmPlan.sessions_included > 0
                    ? `${confirmPlan.sessions_included} sessions included each month`
                    : "Pay only for the sessions you book"}
                </span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-navy/50">
              You can cancel anytime. Payments are processed securely via Stripe
              (simulated in this demo unless a live key is configured).
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => subscribe(confirmPlan.id)}
                disabled={busy === confirmPlan.id}
              >
                {busy === confirmPlan.id
                  ? "Processing…"
                  : confirmPlan.price_cents === 0
                  ? "Confirm"
                  : `Pay ${formatCents(confirmPlan.price_cents)} & subscribe`}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmPlan(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <section>
        <h2 className="mb-3 font-serif text-xl font-semibold">Payment history</h2>
        <Card>
          {payments.length === 0 ? (
            <p className="text-sm text-navy/50">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-left text-navy/50">
                  <th className="py-2">Date</th>
                  <th>Amount</th>
                  <th>Discount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-navy/5">
                    <td className="py-2">{formatDate(p.created_at)}</td>
                    <td className="font-mono">{formatCents(p.amount_cents)}</td>
                    <td className="font-mono text-green-700">
                      {p.discount_cents ? "-" + formatCents(p.discount_cents) : "—"}
                    </td>
                    <td>
                      <Badge
                        className={
                          p.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : p.status === "refunded"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  );
}
