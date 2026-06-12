"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Notification, type SessionRow } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCents, formatDateTime, statusColor } from "@/lib/format";
import { Badge, Button, Card, Spinner } from "@/components/ui";

export function StudentDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    return Promise.all([api.sessions(), api.notifications()]).then(([s, n]) => {
      setSessions(s);
      setNotifs(n);
    });
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const upcoming = sessions.filter((s) => s.status === "scheduled");
  const past = sessions.filter((s) => s.status !== "scheduled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">
            Welcome, {user?.full_name.split(" ")[0]}
          </h1>
          <p className="text-navy/60">Your sessions and activity.</p>
        </div>
        <Link href="/tutors">
          <Button>Book a new session</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <Card>
                <p className="text-sm text-navy/50">
                  No upcoming sessions.{" "}
                  <Link href="/tutors" className="text-gold">
                    Find a tutor →
                  </Link>
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <SessionCard key={s.id} s={s} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold">
              Past sessions ({past.length})
            </h2>
            {past.length === 0 ? (
              <Card>
                <p className="text-sm text-navy/50">No past sessions yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {past.map((s) => (
                  <SessionCard key={s.id} s={s} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside>
          <h2 className="mb-3 font-serif text-xl font-semibold">Notifications</h2>
          <Card>
            {notifs.length === 0 ? (
              <p className="text-sm text-navy/50">Nothing new.</p>
            ) : (
              <ul className="space-y-3">
                {notifs.slice(0, 8).map((n) => (
                  <li key={n.id} className="border-b border-navy/5 pb-2 last:border-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-xs text-navy/60">{n.body}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SessionCard({ s }: { s: SessionRow }) {
  return (
    <Link href={`/sessions/${s.id}`}>
      <Card className="transition hover:border-gold">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">
              {s.subject_name} with {s.tutor_name}
            </p>
            <p className="text-sm text-navy/60">{formatDateTime(s.start_time)}</p>
          </div>
          <div className="text-right">
            <Badge className={statusColor(s.status)}>{s.status}</Badge>
            <p className="mt-1 font-mono text-sm">{formatCents(s.price_cents)}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
