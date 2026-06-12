"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type StudentProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, Input, Spinner, Textarea } from "@/components/ui";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [grade, setGrade] = useState("");
  const [bio, setBio] = useState("");
  const [tz, setTz] = useState("UTC");

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    setFullName(user.full_name);
    setPhone(user.phone || "");
    const tasks: Promise<unknown>[] = [];
    if (user.role === "student") {
      tasks.push(
        api.myStudentProfile().then((p) => {
          setStudent(p);
          setGrade(p.grade_level || "");
          setBio(p.bio || "");
          setTz(p.timezone || "UTC");
        })
      );
    }
    Promise.all(tasks).finally(() => setLoading(false));
  }, [authLoading, user]);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api.updateMe({ full_name: fullName, phone });
      if (user?.role === "student") {
        await api.updateStudentProfile({ grade_level: grade, bio, timezone: tz });
      }
      setMsg({ kind: "ok", text: "Profile saved." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Save failed" });
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api.changePassword({ current_password: pwCurrent, new_password: pwNew });
      setPwCurrent("");
      setPwNew("");
      setMsg({ kind: "ok", text: "Password changed." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Change failed" });
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl font-bold">Settings</h1>

      <Card>
        <h2 className="mb-3 font-serif text-xl font-semibold">Account</h2>
        <form onSubmit={saveAccount} className="space-y-3">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Email (read-only)" value={user?.email || ""} disabled />
          {user?.role === "student" && (
            <>
              <Input label="Grade level" value={grade} onChange={(e) => setGrade(e.target.value)} />
              <Input label="Timezone" value={tz} onChange={(e) => setTz(e.target.value)} />
              <Textarea label="Bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </>
          )}
          <Button type="submit">Save profile</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-serif text-xl font-semibold">Change password</h2>
        <form onSubmit={savePassword} className="space-y-3">
          <Input
            label="Current password"
            type="password"
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
            required
          />
          <Input
            label="New password (min 8 chars)"
            type="password"
            minLength={8}
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            required
          />
          <Button type="submit">Update password</Button>
        </form>
      </Card>

      {msg && (
        <p className={msg.kind === "ok" ? "text-green-700" : "text-red-600"}>{msg.text}</p>
      )}
    </div>
  );
}
