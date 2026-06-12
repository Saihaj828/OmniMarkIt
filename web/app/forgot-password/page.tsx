"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.forgotPassword(email);
      setSent(true);
      // DEV ONLY: with no email provider, the backend returns the token directly.
      setDevToken(res.reset_token ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-1 font-serif text-2xl font-bold">Forgot password</h1>
        <p className="mb-6 text-sm text-navy/60">
          Enter your email and we&apos;ll generate a reset link.
        </p>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700">
              If that email exists, a reset link has been generated.
            </p>
            {devToken && (
              <div className="rounded-lg border border-gold/40 bg-cream p-3 text-sm">
                <p className="font-medium">Demo mode (no email provider wired)</p>
                <p className="mt-1 text-navy/70">Use this token to reset your password:</p>
                <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-xs">
                  {devToken}
                </code>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                  className="mt-2 inline-block font-medium text-gold"
                >
                  Continue to reset →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-navy/60">
          <Link href="/login" className="font-medium text-gold">
            Back to login
          </Link>
        </p>
      </Card>
    </div>
  );
}
