"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, recordingObjectUrl, type Recording } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { formatCents, formatDate } from "@/lib/format";
import { Badge, Button, Card, Spinner } from "@/components/ui";

export default function RecordingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  function reload() {
    return api.myRecordings().then(setRecordings);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    reload()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function view(r: Recording) {
    try {
      setVideoUrl(await recordingObjectUrl(r.id));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Cannot view", "error");
    }
  }
  async function pay(r: Recording) {
    try {
      await api.purchaseRecording(r.id);
      toast("Recording unlocked ✓");
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Payment failed", "error");
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-bold">Session recordings</h1>
        <p className="text-navy/60">
          Recordings an admin has shared with you. Free to view for a limited time,
          then payable.
        </p>
      </div>

      {recordings.length === 0 ? (
        <Card>
          <p className="text-sm text-navy/50">
            No recordings available to you yet. An admin grants access after a session
            is recorded.
          </p>
        </Card>
      ) : (
        recordings.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {r.subject_name} session · {formatDate(r.created_at)}
                </p>
                <p className="mt-1 text-sm">
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
              {r.requires_payment ? (
                <Button onClick={() => pay(r)}>Pay {formatCents(r.price_cents)} to view</Button>
              ) : (
                <Button variant="outline" onClick={() => view(r)}>
                  ▶ View
                </Button>
              )}
            </div>
          </Card>
        ))
      )}

      {videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setVideoUrl(null)}
        >
          <video src={videoUrl} controls autoPlay className="max-h-[80vh] w-full max-w-3xl rounded-lg" />
        </div>
      )}
    </div>
  );
}
