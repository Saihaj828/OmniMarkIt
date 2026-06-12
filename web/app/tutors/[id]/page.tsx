"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  api,
  ApiError,
  type Availability,
  type Review,
  type Tutor,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatCents,
  formatDate,
  formatMinuteOfDay,
  formatRating,
  formatWeekday,
  minDateTime,
} from "@/lib/format";
import { Badge, Button, Card, Select, Spinner, Stars } from "@/components/ui";

export default function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [subjectId, setSubjectId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [booking, setBooking] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.tutor(id),
      api.tutorReviews(id),
      api.tutorAvailability(id),
    ])
      .then(([t, r, a]) => {
        setTutor(t);
        setReviews(r);
        setAvailability(a);
        if (t.subjects[0]) setSubjectId(t.subjects[0].subject.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const price = tutor ? Math.round((tutor.hourly_rate_cents * duration) / 60) : 0;

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "student") {
      setMsg({ kind: "err", text: "Only students can book sessions." });
      return;
    }
    // Past-date guard (client side; backend also enforces this).
    if (new Date(startTime).getTime() <= Date.now()) {
      setMsg({ kind: "err", text: "Please pick a date and time in the future." });
      return;
    }
    setBooking(true);
    try {
      const session = await api.bookSession({
        tutor_id: id,
        subject_id: subjectId,
        start_time: new Date(startTime).toISOString(),
        duration_minutes: duration,
      });
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setMsg({
        kind: "err",
        text: err instanceof ApiError ? err.message : "Booking failed",
      });
      setBooking(false);
    }
  }

  async function messageTutor() {
    if (!user) return router.push("/login");
    try {
      await api.startConversation(tutor!.user_id);
      router.push("/messages");
    } catch {
      /* ignore */
    }
  }

  if (loading) return <Spinner />;
  if (!tutor) return <p className="py-12 text-center text-navy/50">Tutor not found.</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: profile + reviews */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold">{tutor.display_name}</h1>
              <p className="mt-1 text-navy/70">{tutor.headline}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">verified</Badge>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Stars ratingX100={tutor.avg_rating} />
            <span className="text-sm text-navy/60">
              {formatRating(tutor.avg_rating)} · {tutor.total_reviews} reviews ·{" "}
              {tutor.total_sessions} sessions
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {tutor.subjects.map((ts) => (
              <Badge key={ts.subject.id}>{ts.subject.name}</Badge>
            ))}
          </div>
          {tutor.bio && <p className="mt-4 text-navy/80">{tutor.bio}</p>}
          <Button variant="outline" className="mt-4" onClick={messageTutor}>
            Message {tutor.display_name.split(" ")[0]}
          </Button>
        </Card>

        <Card>
          <h2 className="mb-3 font-serif text-xl font-semibold">Weekly availability</h2>
          {availability.length === 0 ? (
            <p className="text-sm text-navy/50">No availability published.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availability.map((a) => (
                <Badge key={a.id} className="bg-navy/5 text-navy">
                  {formatWeekday(a.weekday)} {formatMinuteOfDay(a.start_minute)}–
                  {formatMinuteOfDay(a.end_minute)}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-serif text-xl font-semibold">
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-navy/50">No reviews yet.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-navy/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <Stars ratingX100={r.rating * 100} />
                    <span className="text-xs text-navy/50">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-navy/80">{r.comment}</p>}
                  <p className="mt-1 text-xs text-navy/50">— {r.student_name}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Right: booking (admins cannot book) */}
      <div>
        {user?.role === "admin" ? (
          <Card className="sticky top-6">
            <div className="mb-2">
              <span className="font-mono text-3xl font-bold">
                {formatCents(tutor.hourly_rate_cents)}
              </span>
              <span className="text-navy/50">/hr</span>
            </div>
            <Badge className="bg-navy/10 text-navy">Admin view</Badge>
            <p className="mt-3 text-sm text-navy/60">
              Admins manage and monitor the platform and cannot book lectures.
              Use the admin console to review this tutor.
            </p>
          </Card>
        ) : (
        <Card className="sticky top-6">
          <div className="mb-4">
            <span className="font-mono text-3xl font-bold">
              {formatCents(tutor.hourly_rate_cents)}
            </span>
            <span className="text-navy/50">/hr</span>
          </div>
          <form onSubmit={book} className="space-y-4">
            <Select
              label="Subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              {tutor.subjects.map((ts) => (
                <option key={ts.subject.id} value={ts.subject.id}>
                  {ts.subject.name}
                </option>
              ))}
            </Select>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">
                Date &amp; time
              </span>
              <input
                type="datetime-local"
                min={minDateTime()}
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </label>
            <Select
              label="Duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </Select>

            <div className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm">
              <span>Total</span>
              <span className="font-mono font-bold">{formatCents(price)}</span>
            </div>

            {msg && (
              <p
                className={`text-sm ${
                  msg.kind === "ok" ? "text-green-700" : "text-red-600"
                }`}
              >
                {msg.text}
              </p>
            )}
            <Button type="submit" disabled={booking} className="w-full">
              {booking ? "Booking…" : user ? "Book session" : "Log in to book"}
            </Button>
            <p className="text-center text-xs text-navy/50">
              You won&apos;t be charged until you confirm payment.
            </p>
          </form>
        </Card>
        )}
      </div>
    </div>
  );
}
