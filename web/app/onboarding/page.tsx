"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Subject, type Tutor } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { formatMinuteOfDay, formatWeekday } from "@/lib/format";
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from "@/components/ui";
import { PdfUpload } from "@/components/PdfUpload";

const HOURS = Array.from({ length: 25 }, (_, h) => h * 60);

// O1–O10: a guided tutor onboarding / vetting wizard.
const STEPS = [
  "Welcome",
  "Subjects",
  "Credentials",
  "Availability",
  "Teaching approach",
  "Payouts (Stripe)",
  "ID verification",
  "Background check",
  "Review status",
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Tutor | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState("");

  // step state
  const [picked, setPicked] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [cred, setCred] = useState({ kind: "degree", title: "", institution: "" });
  const [credFileUrl, setCredFileUrl] = useState("");
  const [credAdded, setCredAdded] = useState(false);
  // multiple weekly slots configured during the application
  const [slotDay, setSlotDay] = useState(0);
  const [slotStart, setSlotStart] = useState(16 * 60);
  const [slotEnd, setSlotEnd] = useState(20 * 60);
  const [slots, setSlots] = useState<{ weekday: number; start: number; end: number }[]>([]);
  const [philosophy, setPhilosophy] = useState("");
  const [docType, setDocType] = useState("passport");
  const [kycFileUrl, setKycFileUrl] = useState("");
  const [bgStatus, setBgStatus] = useState("");

  async function addOtherSubject() {
    if (!otherName.trim()) return;
    try {
      const subj = await api.createCustomSubject(otherName.trim());
      setSubjects((prev) => (prev.some((s) => s.id === subj.id) ? prev : [...prev, subj]));
      setPicked((prev) => (prev.includes(subj.id) ? prev : [...prev, subj.id]));
      setOtherName("");
      setShowOther(false);
      toast(`Added subject: ${subj.name}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not add subject", "error");
    }
  }

  async function addSlot() {
    try {
      await api.addAvailability({
        weekday: slotDay,
        start_minute: slotStart,
        end_minute: slotEnd,
      });
      setSlots((prev) => [...prev, { weekday: slotDay, start: slotStart, end: slotEnd }]);
      toast("Slot added ✓");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not add slot", "error");
    }
  }

  async function runBackgroundCheck() {
    try {
      const res = await api.startBackgroundCheck();
      setBgStatus(res.background_check_status);
      toast(`Background check: ${res.background_check_status}`, "info");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not start check", "error");
    }
  }

  function loadProfile() {
    return api.myTutorProfile().then((p) => {
      setProfile(p);
      setPicked(p.subjects.map((s) => s.subject.id));
    });
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    if (user.role !== "tutor") return void router.push("/dashboard");
    Promise.all([loadProfile(), api.subjects().then(setSubjects)])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function guard(fn: () => Promise<unknown>, next = true) {
    setMsg("");
    try {
      await fn();
      if (next) setStep((s) => s + 1);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Something went wrong");
    }
  }

  function toggleSubject(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  if (loading) return <Spinner />;
  if (!profile) return <p className="py-12 text-center">Could not load profile.</p>;

  const approved = profile.vetting_status === "approved";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Tutor onboarding</h1>
        <p className="text-navy/60">
          Complete these steps to get verified and start accepting students.
        </p>
      </div>

      {/* Progress */}
      <div className="flex flex-wrap gap-1">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={`rounded-full px-3 py-1 text-xs ${
              i === step
                ? "bg-gold text-navy"
                : i < step
                ? "bg-green-100 text-green-800"
                : "bg-navy/10 text-navy/60"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <Card>
        {/* 0 — Welcome */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Welcome, {profile.display_name}!</h2>
            <p className="text-sm text-navy/70">
              OmniMarkIt is credential-first: students trust us because every tutor
              is verified. This short setup collects what our team needs to approve
              you. You can revisit any step from your dashboard.
            </p>
            <Button onClick={() => setStep(1)}>Get started</Button>
          </div>
        )}

        {/* 1 — Subjects (with "Other") */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">What do you teach?</h2>
            <div className="flex flex-wrap gap-1">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    picked.includes(s.id) ? "bg-gold text-navy" : "bg-navy/10 text-navy/60"
                  }`}
                >
                  {s.name}
                </button>
              ))}
              <button
                onClick={() => setShowOther((v) => !v)}
                className="rounded-full bg-navy/10 px-3 py-1 text-sm text-navy/60"
              >
                + Other
              </button>
            </div>
            {showOther && (
              <div className="flex gap-2">
                <Input
                  placeholder="Custom subject (e.g. Aviation)"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addOtherSubject}>
                  Add
                </Button>
              </div>
            )}
            <Button
              disabled={picked.length === 0}
              onClick={() => guard(() => api.updateTutorProfile({ subject_ids: picked }))}
            >
              Save &amp; continue
            </Button>
          </div>
        )}

        {/* 2 — Credentials (with PDF upload) */}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Add a credential</h2>
            <Select value={cred.kind} onChange={(e) => setCred({ ...cred, kind: e.target.value })}>
              <option value="degree">Degree</option>
              <option value="certification">Certification</option>
              <option value="transcript">Transcript</option>
            </Select>
            <Input
              label="Title"
              placeholder="e.g. BSc Mathematics"
              value={cred.title}
              onChange={(e) => setCred({ ...cred, title: e.target.value })}
            />
            <Input
              label="Institution"
              value={cred.institution}
              onChange={(e) => setCred({ ...cred, institution: e.target.value })}
            />
            <PdfUpload
              label="Upload certificate"
              onUploaded={(url) => setCredFileUrl(url)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!cred.title}
                onClick={() =>
                  guard(async () => {
                    await api.submitCredential({ ...cred, file_url: credFileUrl || undefined });
                    setCredAdded(true);
                    setCred({ kind: "degree", title: "", institution: "" });
                    setCredFileUrl("");
                  }, false)
                }
              >
                Add credential
              </Button>
              <Button disabled={!credAdded} onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
            {credAdded && <p className="text-sm text-green-700">Credential added ✓</p>}
          </div>
        )}

        {/* 3 — Weekly availability (configure multiple slots now) */}
        {step === 3 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Set your weekly teaching slots</h2>
            {slots.length > 0 && (
              <ul className="flex flex-wrap gap-1">
                {slots.map((s, i) => (
                  <li key={i}>
                    <Badge className="bg-navy/5 text-navy">
                      {formatWeekday(s.weekday)} {formatMinuteOfDay(s.start)}–
                      {formatMinuteOfDay(s.end)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Select label="Day" value={slotDay} onChange={(e) => setSlotDay(Number(e.target.value))}>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {formatWeekday(d)}
                  </option>
                ))}
              </Select>
              <Select label="From" value={slotStart} onChange={(e) => setSlotStart(Number(e.target.value))}>
                {HOURS.map((m) => (
                  <option key={m} value={m}>
                    {formatMinuteOfDay(m)}
                  </option>
                ))}
              </Select>
              <Select label="To" value={slotEnd} onChange={(e) => setSlotEnd(Number(e.target.value))}>
                {HOURS.map((m) => (
                  <option key={m} value={m}>
                    {formatMinuteOfDay(m)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addSlot}>
                Add slot
              </Button>
              <Button disabled={slots.length === 0} onClick={() => setStep(4)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* 4 — Teaching approach */}
        {step === 4 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Your teaching approach</h2>
            <Textarea
              rows={5}
              placeholder="How do you help students learn?"
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
            />
            <Button
              disabled={!philosophy}
              onClick={() => guard(() => api.submitTeachingApproach({ philosophy }))}
            >
              Save &amp; continue
            </Button>
          </div>
        )}

        {/* 5 — Stripe (stub) */}
        {step === 5 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Connect payouts</h2>
            <p className="text-sm text-navy/70">
              In production you&apos;d connect a Stripe account here to receive
              payouts (Stripe Connect). This is <strong>stubbed</strong> in the demo
              — no real account needed.
            </p>
            <Badge className="bg-amber-100 text-amber-800">Stripe Connect — stubbed</Badge>
            <div>
              <Button onClick={() => setStep(6)}>Continue</Button>
            </div>
          </div>
        )}

        {/* 6 — ID verification */}
        {step === 6 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Verify your identity</h2>
            <Select label="Document type" value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver&apos;s license</option>
              <option value="national_id">National ID</option>
            </Select>
            <p className="text-xs text-navy/50">Upload your ID document as a PDF.</p>
            <PdfUpload label="Upload ID document" onUploaded={(url) => setKycFileUrl(url)} />
            <Button
              disabled={!kycFileUrl}
              onClick={() =>
                guard(() =>
                  api.submitIdVerification({ document_type: docType, document_url: kycFileUrl })
                )
              }
            >
              Submit &amp; continue
            </Button>
          </div>
        )}

        {/* 7 — Background check (Checkr) */}
        {step === 7 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Background check</h2>
            <p className="text-sm text-navy/70">
              We run a background check via Checkr. Click below to start it.{" "}
              <span className="text-navy/40">
                (Simulated unless a Checkr API key is configured.)
              </span>
            </p>
            {bgStatus ? (
              <Badge className="bg-amber-100 text-amber-800">
                Background check: {bgStatus}
              </Badge>
            ) : (
              <Button variant="outline" onClick={runBackgroundCheck}>
                Run background check
              </Button>
            )}
            <div>
              <Button disabled={!bgStatus} onClick={() => setStep(8)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* 8 — Review status (O9/O10) */}
        {step === 8 && (
          <div className="space-y-3 text-center">
            {approved ? (
              <>
                <div className="text-4xl">🎉</div>
                <h2 className="font-serif text-xl font-semibold">You&apos;re approved!</h2>
                <p className="text-sm text-navy/70">
                  You now appear in search and can accept bookings.
                </p>
                <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
              </>
            ) : (
              <>
                <div className="text-4xl">⏳</div>
                <h2 className="font-serif text-xl font-semibold">Application submitted</h2>
                <p className="text-sm text-navy/70">
                  Thanks! Our team is reviewing your application. You&apos;ll be
                  notified once an admin approves you. Status:{" "}
                  <Badge className="bg-amber-100 text-amber-800">
                    {profile.vetting_status}
                  </Badge>
                </p>
                <Button variant="outline" onClick={() => loadProfile()}>
                  Refresh status
                </Button>
                <div>
                  <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
                </div>
              </>
            )}
          </div>
        )}

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </Card>
    </div>
  );
}
