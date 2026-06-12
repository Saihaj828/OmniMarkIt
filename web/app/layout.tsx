import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "OmniMarkIt — Trust-first STEM tutoring",
  description: "Credential-verified tutors. Structured sessions. Measurable outcomes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <footer className="border-t border-navy/10 py-6 text-center text-xs text-navy/50">
              OmniMarkIt · Demo build · Backend: FastAPI · Frontend: Next.js 14
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
