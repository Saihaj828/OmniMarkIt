"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Notification } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { Badge, Button, Card, Spinner } from "@/components/ui";

const KIND_COLOR: Record<string, string> = {
  booking: "bg-blue-100 text-blue-800",
  payment: "bg-green-100 text-green-800",
  message: "bg-purple-100 text-purple-800",
  review: "bg-amber-100 text-amber-800",
  vetting: "bg-gold/20 text-navy",
  dispute: "bg-red-100 text-red-800",
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    return api.notifications().then(setItems);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    reload().finally(() => setLoading(false));
  }, [authLoading, user]);

  async function markRead(id: string) {
    await api.markNotificationRead(id);
    reload();
  }

  async function markAllRead() {
    await Promise.all(items.filter((n) => !n.is_read).map((n) => api.markNotificationRead(n.id)));
    reload();
  }

  if (loading) return <Spinner />;
  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">
          Notifications {unread > 0 && <span className="text-gold">({unread})</span>}
        </h1>
        {unread > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-navy/50">Nothing here yet.</p>
        </Card>
      ) : (
        items.map((n) => (
          <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={KIND_COLOR[n.kind] || "bg-navy/10 text-navy"}>{n.kind}</Badge>
                  <p className="font-semibold">{n.title}</p>
                </div>
                {n.body && <p className="mt-1 text-sm text-navy/70">{n.body}</p>}
                <p className="mt-1 text-xs text-navy/40">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="shrink-0 text-xs font-medium text-gold"
                >
                  Mark read
                </button>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
