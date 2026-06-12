"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Subject, type Tutor } from "@/lib/api";
import { formatCents, formatRating } from "@/lib/format";
import { Badge, Card, Input, Select, Spinner, Stars } from "@/components/ui";

export default function TutorSearchPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [maxRate, setMaxRate] = useState("");

  useEffect(() => {
    api.subjects().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .searchTutors({
          q: q || undefined,
          subject_id: subjectId || undefined,
          max_rate_cents: maxRate ? Math.round(parseFloat(maxRate) * 100) : undefined,
        })
        .then(setTutors)
        .catch(() => setTutors([]))
        .finally(() => setLoading(false));
    }, 250); // debounce
    return () => clearTimeout(t);
  }, [q, subjectId, maxRate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Find a tutor</h1>
        <p className="text-navy/60">Every tutor here is credential-verified.</p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Search"
            placeholder="Name or headline…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </Select>
          <Input
            label="Max rate ($/hr)"
            type="number"
            min={0}
            placeholder="e.g. 70"
            value={maxRate}
            onChange={(e) => setMaxRate(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : tutors.length === 0 ? (
        <p className="py-12 text-center text-navy/50">No tutors match your filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <Link key={t.id} href={`/tutors/${t.id}`}>
              <Card className="h-full transition hover:border-gold hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold">
                      {t.display_name}
                    </h3>
                    <p className="text-sm text-navy/60">{t.headline}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">verified</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Stars ratingX100={t.avg_rating} />
                  <span className="text-navy/60">
                    {formatRating(t.avg_rating)} · {t.total_reviews} reviews
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.subjects.map((ts) => (
                    <Badge key={ts.subject.id}>{ts.subject.name}</Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-navy">
                    {formatCents(t.hourly_rate_cents)}
                    <span className="text-xs font-normal text-navy/50">/hr</span>
                  </span>
                  <span className="text-sm font-medium text-gold">View →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
