import Link from "next/link";
import { Card } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="rounded-2xl bg-navy px-8 py-16 text-center text-cream">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-gold">
          Trust-first STEM tutoring
        </p>
        <h1 className="font-serif text-4xl font-bold md:text-5xl">
          Credential-verified tutors.
          <br />
          Measurable outcomes.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/80">
          Every tutor is vetted — degrees, certifications, and identity verified
          before they ever meet a student. Book structured sessions, track
          progress, pay securely.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/tutors"
            className="rounded-lg bg-gold px-6 py-3 font-medium text-navy hover:bg-gold-400"
          >
            Find a tutor
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-cream/30 px-6 py-3 font-medium text-cream hover:bg-white/10"
          >
            Become a tutor
          </Link>
        </div>
      </section>

      {/* Value props */}
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Vetted, not crowdsourced",
            body: "Multi-step vetting: credentials, ID verification, and a teaching-approach review before approval.",
          },
          {
            title: "Structured sessions",
            body: "Book 30/60/90-minute sessions with clear pricing. Pay per session — money held in cents, billed transparently.",
          },
          {
            title: "Measurable trust",
            body: "Real reviews from completed sessions feed a cached rating you can trust. Disputes go to a human admin.",
          },
        ].map((f) => (
          <Card key={f.title}>
            <div className="mb-2 text-gold text-2xl">✦</div>
            <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-navy/70">{f.body}</p>
          </Card>
        ))}
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 text-center font-serif text-2xl font-bold">
          How it works
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            ["1", "Search", "Filter tutors by subject, rate, and rating."],
            ["2", "Book", "Pick a slot and a subject. Lock in the price."],
            ["3", "Learn", "Meet in the session room. Message anytime."],
            ["4", "Review", "Rate the session — it feeds the tutor's score."],
          ].map(([n, t, b]) => (
            <div key={n} className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold font-bold text-navy">
                {n}
              </div>
              <h4 className="font-semibold">{t}</h4>
              <p className="mt-1 text-sm text-navy/60">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo credentials hint */}
      <section className="rounded-xl border border-gold/40 bg-cream p-5 text-sm">
        <p className="font-semibold text-navy">Demo accounts (password: <code>password123</code>)</p>
        <p className="mt-1 text-navy/70">
          <code>student@omnimarkit.com</code> · <code>tutor@omnimarkit.com</code> ·{" "}
          <code>admin@omnimarkit.com</code>
        </p>
      </section>
    </div>
  );
}
