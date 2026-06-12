"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  api,
  ApiError,
  type Earnings,
  type SessionRow,
  type Subject,
  type Tutor,
} from "@/lib/api";
import { formatCents, formatDateTime, statusColor } from "@/lib/format";
import { useToast } from "@/lib/toast";
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from "@/components/ui";

export function TutorDashboard() {
  const [profile, setProfile] = useState<Tutor | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutMsg, setPayoutMsg] = useState("");

  function reload() {
    return Promise.all([
      api.myTutorProfile(),
      api.sessions(),
      api.subjects(),
      api.earnings(),
    ]).then(([p, s, subj, e]) => {
      setProfile(p);
      setSessions(s);
      setSubjects(subj);
      setEarnings(e);
    });
  }

  useEffect(() => {
    reload()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.setSessionStatus(id, status);
    reload();
  }

  async function payout() {
    setPayoutMsg("");
    try {
      const p = await api.requestPayout();
      setPayoutMsg(`Paid out ${formatCents(p.amount_cents)}.`);
      reload();
    } catch (e) {
      setPayoutMsg(e instanceof ApiError ? e.message : "Payout failed");
    }
  }

  if (loading) return <Spinner />;
  if (!profile) return <p className="py-12 text-center">Could not load profile.</p>;

  const pending = profile.vetting_status !== "approved";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Tutor dashboard</h1>
        <p className="text-navy/60">{profile.display_name}</p>
      </div>

      {pending && <VettingPanel profile={profile} onChange={reload} />}

      {/* Earnings */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Avg rating" value={(profile.avg_rating / 100).toFixed(2)} />
        <Stat label="Total reviews" value={String(profile.total_reviews)} />
        <Stat
          label="Available"
          value={earnings ? formatCents(earnings.available_cents) : "—"}
        />
        <Stat
          label="Paid out"
          value={earnings ? formatCents(earnings.paid_out_cents) : "—"}
        />
      </div>

      {earnings && earnings.available_cents > 0 && (
        <Card className="flex items-center justify-between">
          <p className="text-sm">
            You have{" "}
            <span className="font-mono font-bold">
              {formatCents(earnings.available_cents)}
            </span>{" "}
            available to withdraw.
          </p>
          <div className="flex items-center gap-3">
            {payoutMsg && <span className="text-sm text-green-700">{payoutMsg}</span>}
            <Button onClick={payout}>Request payout</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sessions */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-serif text-xl font-semibold">Your sessions</h2>
          {sessions.length === 0 ? (
            <Card>
              <p className="text-sm text-navy/50">No sessions booked yet.</p>
            </Card>
          ) : (
            sessions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {s.subject_name} · {s.student_name}
                    </p>
                    <p className="text-sm text-navy/60">
                      {formatDateTime(s.start_time)} · {s.duration_minutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusColor(s.status)}>{s.status}</Badge>
                    <p className="mt-1 font-mono text-sm">
                      {formatCents(s.price_cents)}
                    </p>
                  </div>
                </div>
                {s.status === "scheduled" && (
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => updateStatus(s.id, "in_progress")}>
                      Start
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(s.id, "cancelled")}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {s.status === "in_progress" && (
                  <Button
                    className="mt-3"
                    onClick={() => updateStatus(s.id, "completed")}
                  >
                    Mark completed
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Profile editor */}
        <aside>
          <h2 className="mb-3 font-serif text-xl font-semibold">Edit profile</h2>
          <ProfileEditor profile={profile} subjects={subjects} onSaved={reload} />
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-navy/50">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
    </Card>
  );
}

function VettingPanel({ profile, onChange }: { profile: Tutor; onChange: () => void }) {
  const [cred, setCred] = useState({ kind: "degree", title: "", institution: "" });
  const [docType, setDocType] = useState("passport");
  const [philosophy, setPhilosophy] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setMsg("");
    try {
      await fn();
      setMsg(`${label} submitted.`);
      onChange();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card className="border-amber-300 bg-amber-50">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className={statusColor(profile.vetting_status)}>{profile.vetting_status}</Badge>
        <p className="text-sm text-amber-900">
          Complete your vetting to appear in search and accept bookings.
        </p>
        <a href="/onboarding" className="text-sm font-medium text-gold underline">
          Use the guided setup →
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Credential */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">1. Add a credential</p>
          <Select value={cred.kind} onChange={(e) => setCred({ ...cred, kind: e.target.value })}>
            <option value="degree">Degree</option>
            <option value="certification">Certification</option>
            <option value="transcript">Transcript</option>
          </Select>
          <Input
            placeholder="Title (e.g. BSc Mathematics)"
            value={cred.title}
            onChange={(e) => setCred({ ...cred, title: e.target.value })}
          />
          <Input
            placeholder="Institution"
            value={cred.institution}
            onChange={(e) => setCred({ ...cred, institution: e.target.value })}
          />
          <Button
            className="w-full"
            disabled={!cred.title || busy === "Credential"}
            onClick={() => run("Credential", () => api.submitCredential(cred))}
          >
            Submit credential
          </Button>
        </div>

        {/* ID verification */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">2. Verify your ID</p>
          <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver&apos;s license</option>
            <option value="national_id">National ID</option>
          </Select>
          <p className="text-xs text-navy/50">
            (Upload is stubbed — submitting marks ID as pending review.)
          </p>
          <Button
            className="w-full"
            disabled={busy === "ID verification"}
            onClick={() =>
              run("ID verification", () => api.submitIdVerification({ document_type: docType }))
            }
          >
            Submit ID
          </Button>
        </div>

        {/* Teaching approach */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">3. Teaching approach</p>
          <Textarea
            rows={4}
            placeholder="Your teaching philosophy…"
            value={philosophy}
            onChange={(e) => setPhilosophy(e.target.value)}
          />
          <Button
            className="w-full"
            disabled={!philosophy || busy === "Teaching approach"}
            onClick={() =>
              run("Teaching approach", () => api.submitTeachingApproach({ philosophy }))
            }
          >
            Submit approach
          </Button>
        </div>
      </div>
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
    </Card>
  );
}

function ProfileEditor({
  profile,
  subjects,
  onSaved,
}: {
  profile: Tutor;
  subjects: Subject[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [headline, setHeadline] = useState(profile.headline || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [rate, setRate] = useState((profile.hourly_rate_cents / 100).toString());
  const [selected, setSelected] = useState<string[]>(
    profile.subjects.map((s) => s.subject.id)
  );
  const [allSubjects, setAllSubjects] = useState<Subject[]>(subjects);
  const [showOther, setShowOther] = useState(false);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function addOther() {
    if (!other.trim()) return;
    try {
      const subj = await api.createCustomSubject(other.trim());
      setAllSubjects((prev) =>
        prev.some((s) => s.id === subj.id) ? prev : [...prev, subj]
      );
      setSelected((prev) => (prev.includes(subj.id) ? prev : [...prev, subj.id]));
      setOther("");
      setShowOther(false);
      toast(`Added subject: ${subj.name}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not add subject", "error");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateTutorProfile({
        headline,
        bio,
        hourly_rate_cents: Math.round(parseFloat(rate) * 100),
        subject_ids: selected,
      });
      toast("Profile saved!"); // fires a fresh toast on every save
      onSaved();
    } catch (e2) {
      toast(e2 instanceof ApiError ? e2.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={save} className="space-y-3">
        <Input
          label="Headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
        <Textarea
          label="Bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <Input
          label="Hourly rate ($)"
          type="number"
          min={0}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
        <div>
          <span className="mb-1 block text-sm font-medium text-navy">Subjects</span>
          <div className="flex flex-wrap gap-1">
            {allSubjects.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  selected.includes(s.id)
                    ? "bg-gold text-navy"
                    : "bg-navy/10 text-navy/60"
                }`}
              >
                {s.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowOther((v) => !v)}
              className="rounded-full bg-navy/10 px-2.5 py-1 text-xs text-navy/60"
            >
              + Other
            </button>
          </div>
          {showOther && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Custom subject (e.g. Aviation)"
                value={other}
                onChange={(e) => setOther(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addOther}>
                Add
              </Button>
            </div>
          )}
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}
