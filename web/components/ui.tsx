"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gold text-navy hover:bg-gold-400",
    outline: "border border-navy/20 text-navy hover:bg-navy/5",
    ghost: "text-navy hover:bg-navy/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-navy/10 bg-white p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        className || "bg-navy/10 text-navy"
      )}
    >
      {children}
    </span>
  );
}

export function Input({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-navy">{label}</span>
      )}
      <input
        className={cn(
          "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-navy">{label}</span>
      )}
      <textarea
        className={cn(
          "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-navy">{label}</span>
      )}
      <select
        className={cn(
          "w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Stars({ ratingX100 }: { ratingX100: number }) {
  const full = Math.round(ratingX100 / 100);
  return (
    <span className="text-gold" aria-label={`${(ratingX100 / 100).toFixed(2)} stars`}>
      {"★".repeat(full)}
      <span className="text-navy/20">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-gold" />
    </div>
  );
}
