"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

  // Badge = unread notifications (incl. messages) + upcoming lectures.
  useEffect(() => {
    if (!user) {
      setAlertCount(0);
      return;
    }
    let active = true;
    const refresh = async () => {
      try {
        const [notifs, sessions] = await Promise.all([
          api.notifications(),
          api.sessions(),
        ]);
        if (!active) return;
        const unread = notifs.filter((n) => !n.is_read).length;
        const now = Date.now();
        const upcoming = sessions.filter(
          (s) => s.status === "scheduled" && new Date(s.start_time).getTime() > now
        ).length;
        setAlertCount(unread + upcoming);
      } catch {
        /* ignore */
      }
    };
    refresh();
    const t = setInterval(refresh, 30_000); // poll every 30s
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user, pathname]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition hover:text-gold ${
        pathname === href ? "text-gold" : "text-cream"
      }`}
    >
      {label}
    </Link>
  );

  const bell = (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className={`relative text-sm transition hover:text-gold ${
        pathname === "/notifications" ? "text-gold" : "text-cream"
      }`}
    >
      🔔
      {alertCount > 0 && (
        <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {alertCount > 9 ? "9+" : alertCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="border-b border-white/10 bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-gold text-xl">✦</span>
          <span className="font-serif text-lg font-bold text-cream">OmniMarkIt</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {link("/tutors", "Find Tutors")}
          {user && link("/dashboard", "Dashboard")}
          {user?.role === "tutor" && link("/availability", "Availability")}
          {user?.role === "tutor" && link("/reviews", "Reviews")}
          {user && link("/messages", "Messages")}
          {user && user.role !== "admin" && link("/recordings", "Recordings")}
          {user?.role === "student" && link("/billing", "Billing")}
          {user && user.role !== "admin" && link("/disputes", "Disputes")}
          {user?.role === "admin" && link("/admin", "Admin")}
          {user && bell}
          {user && link("/settings", "Settings")}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-cream/70">
                {user.full_name} · {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-cream/30 px-3 py-1.5 text-sm text-cream hover:bg-white/10"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {link("/login", "Log in")}
              <Link
                href="/register"
                className="rounded-lg bg-gold px-3 py-1.5 text-sm font-medium text-navy hover:bg-gold-400"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
