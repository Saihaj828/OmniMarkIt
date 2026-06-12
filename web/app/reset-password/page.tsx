"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Input, Spinner } from "@/components/ui";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h1 className="mb-1 font-serif text-2xl font-bold">Reset password</h1>
      <p className="mb-6 text-sm text-navy/60">Enter your reset token and a new password.</p>

      {done ? (
        <p className="text-sm text-green-700">
          Password reset! Redirecting to login…
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <Input
            label="New password (min 8 chars)"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-navy/60">
        <Link href="/login" className="font-medium text-gold">
          Back to login
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense fallback={<Spinner />}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
