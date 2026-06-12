"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Review, type Tutor } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatRating } from "@/lib/format";
import { Button, Card, Spinner, Stars, Textarea } from "@/components/ui";

export default function TutorReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [msg, setMsg] = useState("");

  function reload(tutorId: string) {
    return api.tutorReviews(tutorId).then(setReviews);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    if (user.role !== "tutor") return void router.push("/dashboard");
    api
      .myTutorProfile()
      .then((p) => {
        setProfile(p);
        return reload(p.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function submitReply(reviewId: string) {
    setMsg("");
    try {
      await api.respondToReview(reviewId, replyText);
      setReplyFor(null);
      setReplyText("");
      if (profile) await reload(profile.id);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    }
  }

  if (loading) return <Spinner />;
  if (!profile) return <p className="py-12 text-center">Could not load profile.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">Reviews &amp; ratings</h1>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Stars ratingX100={profile.avg_rating} />
            <span className="font-mono font-bold">{formatRating(profile.avg_rating)}</span>
          </div>
          <p className="text-xs text-navy/50">{profile.total_reviews} reviews</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <p className="text-sm text-navy/50">No reviews yet.</p>
        </Card>
      ) : (
        reviews.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <Stars ratingX100={r.rating * 100} />
              <span className="text-xs text-navy/50">{formatDate(r.created_at)}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-navy/80">{r.comment}</p>}
            <p className="mt-1 text-xs text-navy/50">— {r.student_name}</p>

            {r.tutor_response ? (
              <div className="mt-3 rounded-lg bg-cream p-3 text-sm">
                <p className="font-medium text-navy">Your reply</p>
                <p className="text-navy/70">{r.tutor_response}</p>
              </div>
            ) : replyFor === r.id ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Write a public reply…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={() => submitReply(r.id)} disabled={!replyText.trim()}>
                    Post reply
                  </Button>
                  <Button variant="ghost" onClick={() => setReplyFor(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="mt-3" onClick={() => setReplyFor(r.id)}>
                Reply
              </Button>
            )}
          </Card>
        ))
      )}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
