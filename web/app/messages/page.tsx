"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Conversation, type Message } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { Button, Card, Spinner } from "@/components/ui";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .conversations()
      .then((c) => {
        setConversations(c);
        if (c[0]) setActiveId(c[0].id);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  useEffect(() => {
    if (!activeId) return;
    api.messages(activeId).then(setMessages);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const msg = await api.sendMessage(activeId, draft.trim());
    setMessages((m) => [...m, msg]);
    setDraft("");
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Messages</h1>
      {conversations.length === 0 ? (
        <Card>
          <p className="text-sm text-navy/50">
            No conversations yet. Open a tutor&apos;s profile and click “Message”.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Conversation list */}
          <Card className="md:col-span-1">
            <ul className="space-y-1">
              {conversations.map((c) => {
                const unread =
                  user?.id === c.student_id
                    ? c.student_unread_count
                    : c.tutor_unread_count;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                        activeId === c.id ? "bg-gold/20" : "hover:bg-navy/5"
                      }`}
                    >
                      <span className="font-medium">
                        {c.other_party_name || "Conversation"}
                      </span>
                      {unread > 0 && (
                        <span className="rounded-full bg-gold px-2 text-xs text-navy">
                          {unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Thread */}
          <Card className="flex h-[28rem] flex-col md:col-span-2">
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        mine ? "bg-navy text-cream" : "bg-navy/5 text-navy"
                      }`}
                    >
                      <p>{m.body}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? "text-cream/50" : "text-navy/40"
                        }`}
                      >
                        {formatDateTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
              <Button type="submit">Send</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
