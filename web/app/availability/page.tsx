"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Availability, type AvailabilityException } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatMinuteOfDay, formatWeekday } from "@/lib/format";
import { Badge, Button, Card, Input, Select, Spinner } from "@/components/ui";

const HOURS = Array.from({ length: 25 }, (_, h) => h * 60); // 0..1440 by hour

export default function AvailabilityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [slots, setSlots] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // new slot form
  const [weekday, setWeekday] = useState(0);
  const [start, setStart] = useState(16 * 60);
  const [end, setEnd] = useState(20 * 60);
  // new exception form
  const [exDate, setExDate] = useState("");
  const [exReason, setExReason] = useState("");

  function reload() {
    return Promise.all([api.myAvailability(), api.myExceptions()]).then(([s, e]) => {
      setSlots(s);
      setExceptions(e);
    });
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return void router.push("/login");
    if (user.role !== "tutor") return void router.push("/dashboard");
    reload()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.addAvailability({ weekday, start_minute: start, end_minute: end });
      await reload();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    }
  }
  async function removeSlot(id: string) {
    await api.deleteAvailability(id);
    reload();
  }
  async function addException(e: React.FormEvent) {
    e.preventDefault();
    if (!exDate) return;
    setMsg("");
    try {
      await api.addException({ date: exDate, is_available: false, reason: exReason });
      setExDate("");
      setExReason("");
      await reload();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Availability</h1>
        <p className="text-navy/60">Set your weekly hours and block off specific dates.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly hours */}
        <Card>
          <h2 className="mb-3 font-serif text-xl font-semibold">Weekly hours</h2>
          {slots.length === 0 ? (
            <p className="mb-3 text-sm text-navy/50">No weekly hours set.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {slots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-navy/5 px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{formatWeekday(s.weekday)}</strong>{" "}
                    {formatMinuteOfDay(s.start_minute)}–{formatMinuteOfDay(s.end_minute)}
                  </span>
                  <button
                    onClick={() => removeSlot(s.id)}
                    className="text-xs font-medium text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addSlot} className="grid grid-cols-2 gap-2">
            <Select label="Day" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>
                  {formatWeekday(d)}
                </option>
              ))}
            </Select>
            <div />
            <Select label="From" value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {HOURS.map((m) => (
                <option key={m} value={m}>
                  {formatMinuteOfDay(m)}
                </option>
              ))}
            </Select>
            <Select label="To" value={end} onChange={(e) => setEnd(Number(e.target.value))}>
              {HOURS.map((m) => (
                <option key={m} value={m}>
                  {formatMinuteOfDay(m)}
                </option>
              ))}
            </Select>
            <div className="col-span-2">
              <Button type="submit" className="w-full">
                Add weekly slot
              </Button>
            </div>
          </form>
        </Card>

        {/* Exceptions */}
        <Card>
          <h2 className="mb-3 font-serif text-xl font-semibold">Time off (exceptions)</h2>
          {exceptions.length === 0 ? (
            <p className="mb-3 text-sm text-navy/50">No blocked dates.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {exceptions.map((x) => (
                <li
                  key={x.id}
                  className="flex items-center justify-between rounded-lg bg-navy/5 px-3 py-2 text-sm"
                >
                  <span>
                    <Badge className="bg-red-100 text-red-800">blocked</Badge>{" "}
                    {formatDate(x.date)} {x.reason && `· ${x.reason}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addException} className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Date to block</span>
              <input
                type="date"
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
                required
              />
            </label>
            <Input
              label="Reason (optional)"
              value={exReason}
              onChange={(e) => setExReason(e.target.value)}
            />
            <Button type="submit" variant="outline" className="w-full">
              Block this date
            </Button>
          </form>
        </Card>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
