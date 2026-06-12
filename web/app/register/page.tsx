"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError, type Role } from "@/lib/api";
import { Button, Card, Input, Select } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [stripeAccount, setStripeAccount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register(email, password, fullName, role, stripeAccount);
      // New tutors land on the dashboard where they complete vetting.
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-1 font-serif text-2xl font-bold">Create your account</h1>
        <p className="mb-6 text-sm text-navy/60">
          Join as a student to learn, or as a tutor to teach.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password (min 8 chars)"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Select
            label="I am a…"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
          </Select>
          {role === "tutor" && (
            <div>
              <Input
                label="Stripe account ID (for payouts)"
                placeholder="acct_..."
                value={stripeAccount}
                onChange={(e) => setStripeAccount(e.target.value)}
              />
              <p className="mt-1 text-xs text-navy/50">
                Your Stripe Connect account so we can pay you out. You can add or
                change this later in Settings.
              </p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-navy/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gold">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
