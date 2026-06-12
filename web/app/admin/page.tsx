"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  type Dispute,
  type Flag,
  type Recording,
  type Tutor,
  type User,
  type VettingDetail,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { formatCents, formatDate, statusColor } from "@/lib/format";
import { Badge, Button, Card, Spinner } from "@/components/ui";

type Tab = "vetting" | "users" | "disputes" | "flagged" | "recordings" | "database";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [queue, setQueue] = useState<Tutor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("vetting");
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const [detail, setDetail] = useState<VettingDetail | null>(null);

  function reload() {
    return Promise.all([
      api.vettingQueue(),
      api.adminUsers(),
      api.adminDisputes(),
      api.flaggedSessions(),
      api.adminRecordings(),
      api.dbOverview(),
    ]).then(([q, u, d, f, r, db]) => {
      setQueue(q);
      setUsers(u);
      setDisputes(d);
      setFlags(f);
      setRecordings(r);
      setDbCounts(db.tables);
    });
  }

  async function grant(recordingId: string, userId: string | null | undefined) {
    if (!userId) return;
    await api.grantRecording(recordingId, userId);
    toast("Access granted");
    reload();
  }
  async function revoke(recordingId: string, userId: string | null | undefined) {
    if (!userId) return;
    await api.revokeRecording(recordingId, userId);
    toast("Access revoked", "info");
    reload();
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    if (user.role !== "admin") return void router.push("/dashboard");
    reload()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function decide(tutorId: string, decision: "approve" | "reject") {
    await api.decideVetting(tutorId, decision);
    setDetailFor(null);
    reload();
  }
  async function viewDetail(tutorId: string) {
    if (detailFor === tutorId) {
      setDetailFor(null);
      return;
    }
    setDetailFor(tutorId);
    setDetail(null);
    setDetail(await api.tutorVettingDetail(tutorId));
  }
  async function toggleActive(u: User) {
    await api.setUserActive(u.id, !u.is_active);
    reload();
  }
  async function resolveFlag(flagId: string, legalHold: boolean) {
    await api.resolveFlag(flagId, legalHold);
    reload();
  }
  async function resolveDispute(d: Dispute, decision: "resolved" | "rejected") {
    const resolution = window.prompt(
      "Resolution note:",
      decision === "resolved" ? "Refund issued." : "No action warranted."
    );
    if (resolution == null) return;
    let refund: number | undefined;
    if (decision === "resolved") {
      const r = window.prompt("Refund amount in cents (blank for none):", "");
      refund = r ? parseInt(r, 10) : undefined;
    }
    await api.resolveDispute(d.id, { decision, resolution, refund_amount_cents: refund });
    reload();
  }

  if (loading) return <Spinner />;

  const tabs: [Tab, string, number][] = [
    ["vetting", "Vetting queue", queue.length],
    ["users", "Users", users.length],
    ["disputes", "Disputes", disputes.filter((d) => d.status === "open").length],
    ["flagged", "Flagged", flags.length],
    ["recordings", "Recordings", recordings.length],
    ["database", "Database", Object.keys(dbCounts).length],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Admin console</h1>
        <p className="text-navy/60">Trust &amp; safety operations.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([t, label, count]) => (
          <Button
            key={t}
            variant={tab === t ? "primary" : "outline"}
            onClick={() => setTab(t)}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {tab === "vetting" &&
        (queue.length === 0 ? (
          <Card>
            <p className="text-sm text-navy/50">No tutors awaiting review. 🎉</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {queue.map((t) => (
              <Card key={t.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{t.display_name}</p>
                    <p className="text-sm text-navy/60">{t.headline}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.subjects.map((s) => (
                        <Badge key={s.subject.id}>{s.subject.name}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-navy/60">
                      Rate: {formatCents(t.hourly_rate_cents)}/hr
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusColor(t.vetting_status)}>{t.vetting_status}</Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => viewDetail(t.id)}>
                        {detailFor === t.id ? "Hide" : "View credentials"}
                      </Button>
                      <Button onClick={() => decide(t.id, "approve")}>Approve</Button>
                      <Button variant="danger" onClick={() => decide(t.id, "reject")}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Credential viewer (A3) */}
                {detailFor === t.id && (
                  <div className="mt-4 border-t border-navy/10 pt-4 text-sm">
                    {!detail ? (
                      <p className="text-navy/50">Loading…</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-navy/50">Background check: </span>
                            <Badge className={statusColor(detail.background_check_status)}>
                              {detail.background_check_status}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-navy/50">ID: </span>
                            <Badge className={statusColor(detail.id_status)}>
                              {detail.id_status}
                              {detail.id_document_type ? ` (${detail.id_document_type})` : ""}
                            </Badge>
                          </div>
                        </div>
                        {detail.teaching_philosophy && (
                          <div>
                            <p className="text-navy/50">Teaching philosophy</p>
                            <p className="text-navy/80">{detail.teaching_philosophy}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-navy/50">Credentials ({detail.credentials.length})</p>
                          {detail.credentials.length === 0 ? (
                            <p className="text-navy/40">None submitted.</p>
                          ) : (
                            <ul className="mt-1 space-y-1">
                              {detail.credentials.map((c) => (
                                <li key={c.id} className="flex items-center gap-2">
                                  <Badge>{c.kind}</Badge>
                                  <span>
                                    {c.title}
                                    {c.institution ? ` — ${c.institution}` : ""}
                                  </span>
                                  {c.file_url && (
                                    <a
                                      href={c.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-gold"
                                    >
                                      view file
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}

      {tab === "users" && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-navy/5">
                  <td className="py-2 font-medium">{u.full_name}</td>
                  <td className="text-navy/70">{u.email}</td>
                  <td>
                    <Badge>{u.role}</Badge>
                  </td>
                  <td>
                    <Badge
                      className={
                        u.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {u.is_active ? "active" : "suspended"}
                    </Badge>
                  </td>
                  <td className="text-right">
                    {u.role !== "admin" && (
                      <Button
                        variant={u.is_active ? "outline" : "primary"}
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? "Suspend" : "Reactivate"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "disputes" &&
        (disputes.length === 0 ? (
          <Card>
            <p className="text-sm text-navy/50">No disputes filed.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <Card key={d.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold capitalize">
                      {d.category.replace("_", " ")}
                    </p>
                    <p className="text-sm text-navy/70">{d.description}</p>
                    <p className="mt-1 text-xs text-navy/50">{formatDate(d.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                    {d.status === "open" && (
                      <div className="flex gap-2">
                        <Button onClick={() => resolveDispute(d, "resolved")}>Resolve</Button>
                        <Button variant="danger" onClick={() => resolveDispute(d, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {tab === "flagged" &&
        (flags.length === 0 ? (
          <Card>
            <p className="text-sm text-navy/50">No open flags.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {flags.map((f) => (
              <Card key={f.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{f.reason}</p>
                    {f.detail && <p className="text-sm text-navy/70">{f.detail}</p>}
                    <p className="mt-1 text-xs text-navy/50">
                      Session {f.session_id.slice(0, 8)} · {formatDate(f.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {f.legal_hold && (
                      <Badge className="bg-red-100 text-red-800">legal hold</Badge>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => resolveFlag(f.id, false)}>
                        Dismiss
                      </Button>
                      <Button variant="danger" onClick={() => resolveFlag(f.id, true)}>
                        Resolve + legal hold
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {tab === "recordings" &&
        (recordings.length === 0 ? (
          <Card>
            <p className="text-sm text-navy/50">No recordings uploaded yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recordings.map((r) => {
              const studentGranted =
                r.student_id != null && r.granted_user_ids.includes(r.student_id);
              const tutorGranted =
                r.tutor_user_id != null && r.granted_user_ids.includes(r.tutor_user_id);
              return (
                <Card key={r.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {r.subject_name} · {formatDate(r.created_at)}
                      </p>
                      <p className="text-sm text-navy/60">
                        {r.in_free_window ? (
                          <Badge className="bg-green-100 text-green-800">
                            free until {formatDate(r.free_until)}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">
                            {formatCents(r.price_cents)} to view
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-32 text-navy/60">{r.student_name} (student)</span>
                        {studentGranted ? (
                          <Button variant="outline" onClick={() => revoke(r.id, r.student_id)}>
                            Revoke
                          </Button>
                        ) : (
                          <Button onClick={() => grant(r.id, r.student_id)}>Grant</Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-32 text-navy/60">{r.tutor_name} (tutor)</span>
                        {tutorGranted ? (
                          <Button variant="outline" onClick={() => revoke(r.id, r.tutor_user_id)}>
                            Revoke
                          </Button>
                        ) : (
                          <Button onClick={() => grant(r.id, r.tutor_user_id)}>Grant</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === "database" && (
        <Card>
          <p className="mb-3 text-sm text-navy/60">
            Live row counts per table (the database in action). For full inspection use
            the SQLite tools described in <code>GETTING_STARTED.md</code> or the API docs
            at <code>/docs</code>.
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {Object.entries(dbCounts)
              .sort()
              .map(([name, count]) => (
                <div key={name} className="flex justify-between border-b border-navy/5 py-1">
                  <span className="font-mono text-navy/70">{name}</span>
                  <span className="font-mono font-bold">{count}</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
