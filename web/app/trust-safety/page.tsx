import Link from "next/link";
import { Card } from "@/components/ui";

export const metadata = { title: "Trust & Safety — OmniMarkIt" };

const PILLARS = [
  {
    title: "Every tutor is vetted",
    body: "Before a tutor can accept a single booking, they pass a multi-step review: credential checks, government-ID verification, and a teaching-approach review. Only then does an admin approve them.",
  },
  {
    title: "Secure, transparent payments",
    body: "Payments are processed securely and held in cents — no hidden fees. You see the exact price before you book, and disputes are handled by a real human admin.",
  },
  {
    title: "Report & flag, anytime",
    body: "Any session can be flagged for our Trust & Safety team. Serious cases can be placed under a legal hold so records are preserved and protected.",
  },
  {
    title: "Your data is protected",
    body: "Sensitive tokens are encrypted at rest, and we never put personal information in our logs. You control your own data.",
  },
];

export default function TrustSafetyPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-navy px-8 py-12 text-center text-cream">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-gold">
          Trust &amp; Safety
        </p>
        <h1 className="font-serif text-3xl font-bold md:text-4xl">
          Built on trust, by design.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-cream/80">
          OmniMarkIt is a credential-first marketplace. Here&apos;s how we keep
          students and tutors safe.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {PILLARS.map((p) => (
          <Card key={p.title}>
            <div className="mb-2 text-gold text-2xl">✦</div>
            <h2 className="font-serif text-lg font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-navy/70">{p.body}</p>
          </Card>
        ))}
      </section>

      <section className="rounded-xl border border-gold/40 bg-cream p-6 text-center">
        <h3 className="font-serif text-xl font-semibold">Need to report something?</h3>
        <p className="mt-1 text-sm text-navy/70">
          Open any session and use “Flag for trust &amp; safety,” or file a formal
          dispute from your account.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/disputes" className="rounded-lg bg-gold px-5 py-2 font-medium text-navy">
            File a dispute
          </Link>
          <Link href="/tutors" className="rounded-lg border border-navy/20 px-5 py-2 font-medium">
            Browse tutors
          </Link>
        </div>
      </section>
    </div>
  );
}
