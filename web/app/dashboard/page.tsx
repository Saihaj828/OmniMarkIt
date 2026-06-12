"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";
import { StudentDashboard } from "./StudentDashboard";
import { TutorDashboard } from "./TutorDashboard";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user?.role === "admin") router.push("/admin");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;
  if (user.role === "student") return <StudentDashboard />;
  if (user.role === "tutor") return <TutorDashboard />;
  return null;
}
