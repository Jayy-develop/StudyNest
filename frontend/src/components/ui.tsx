import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#25273b] bg-[#13141f] p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#9b7bf7] hover:bg-[#8a65f5] text-slate-950 font-semibold border border-violet-300/30 shadow-sm shadow-violet-950/50",
    secondary:
      "bg-[#1b1d2e] hover:bg-[#24273d] text-slate-100 border border-[#2d3048]",
    ghost:
      "bg-transparent hover:bg-[#1a1c2b] text-slate-300 hover:text-white border border-transparent",
    danger:
      "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[#25273b] bg-[#0b0c12] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#9b7bf7] focus:outline-none focus:ring-1 focus:ring-[#9b7bf7] disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-[#25273b] bg-[#0b0c12] px-3.5 py-2 text-sm text-slate-100 focus:border-[#9b7bf7] focus:outline-none focus:ring-1 focus:ring-[#9b7bf7] disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[#25273b] bg-[#0b0c12] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#9b7bf7] focus:outline-none focus:ring-1 focus:ring-[#9b7bf7] disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: "slate" | "violet" | "blue" | "emerald" | "amber" | "rose";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    slate: "bg-[#1c1e2e] text-slate-300 border-[#2b2e45]",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function AlertBanner({
  tone = "info",
  message,
  onClose,
}: {
  tone?: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}) {
  const styles = {
    error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    info: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  };

  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", styles[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 whitespace-pre-line">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pesan"
          className="rounded p-0.5 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#27293d] bg-[#10111a] px-6 py-8 text-center">
      <div className="mb-3 rounded-xl bg-[#1a1c2b] p-3 text-[#a78bfa]">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl border border-[#222436] bg-[#13141f]"
        />
      ))}
    </div>
  );
}
