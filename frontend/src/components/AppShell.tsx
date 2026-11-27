"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  FileText,
  Home,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Course } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { cn, LoadingSkeleton } from "@/components/ui";

const GENERAL_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/courses", label: "My Courses", icon: BookOpen },
  { href: "/materials", label: "My Materials", icon: FileText },
  { href: "/schedule", label: "Smart Schedule", icon: CalendarDays },
];

const MORE_NAV = [
  { href: "/tasks", label: "List Todo", icon: CheckSquare },
  { href: "/quiz", label: "AI Quiz", icon: ListChecks },
  { href: "/planner", label: "Study Planner", icon: Calendar },
  { href: "/assistant", label: "AI Assistants", icon: Sparkles, highlight: true },
];

export function AppShell({
  title,
  subtitle,
  actions,
  hidePageHeader = false,
  reminderCount = 0,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hidePageHeader?: boolean;
  reminderCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    apiFetch<{ data: Course[] }>("/courses?per_page=5")
      .then((res) => {
        if (active) setSidebarCourses(res.data || []);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/materials?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderSidebarContent = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="grid h-9 w-9 grid-cols-2 gap-0.5 rounded-xl bg-[#1d1934] p-2 ring-1 ring-violet-500/30">
          <span className="rounded-full bg-[#a78bfa]" />
          <span className="rounded-full bg-[#7c5dfa]" />
          <span className="rounded-full bg-[#7c5dfa]" />
          <span className="rounded-full bg-[#c4b5fd]" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">Hayabusa AI</p>
          <p className="text-[11px] text-slate-400">LMS & Student AI</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            General
          </p>
          <div className="space-y-1">
            {GENERAL_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#222436] text-white shadow-sm ring-1 ring-white/5"
                      : "text-slate-400 hover:bg-[#191b29] hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            More
          </p>
          <div className="space-y-1">
            {MORE_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#222436] text-white shadow-sm ring-1 ring-white/5"
                      : "text-slate-400 hover:bg-[#191b29] hover:text-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      item.highlight ? "text-[#f472b6]" : active ? "text-white" : "text-slate-400"
                    )}
                  />
                  <span
                    className={
                      item.highlight
                        ? "bg-gradient-to-r from-[#a78bfa] via-[#f472b6] to-[#fb923c] bg-clip-text font-semibold text-transparent"
                        : undefined
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Course Study List */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Course Study
          </p>
          {sidebarCourses.length === 0 ? (
            <Link
              href="/courses"
              onClick={onNavigate}
              className="block rounded-xl px-3 py-2 text-xs text-slate-500 hover:text-slate-300"
            >
              + Tambah mata kuliah
            </Link>
          ) : (
            <div className="space-y-1">
              {sidebarCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:bg-[#191b29] hover:text-white"
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-slate-950"
                    style={{ backgroundColor: course.color || "#a78bfa" }}
                  >
                    {course.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate">{course.name}</span>
                </Link>
              ))}
              <Link
                href="/courses"
                onClick={onNavigate}
                className="flex items-center gap-2 px-3 pt-1 text-xs text-slate-500 hover:text-slate-300"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Lihat semua</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA & Logout */}
      <div className="space-y-2 border-t border-[#1e2030] p-3">
        <Link
          href="/planner"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-violet-950/50 transition hover:brightness-110"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Susun Study Plan</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:bg-[#191b29] hover:text-rose-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar ({user.name.split(" ")[0]})</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0b0c12] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#1c1d2b] bg-[radial-gradient(circle_at_top_left,_rgba(124,93,250,0.16),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(124,93,250,0.18),_transparent_40%)] bg-[#0f1019] lg:block">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 border-r border-[#1c1d2b] bg-[#0f1019]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-[#1c1e2e]"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Utility Bar matching reference */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#191a27] bg-[#0b0c12]/90 px-4 py-3.5 backdrop-blur lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka navigasi"
              className="rounded-xl border border-[#25273b] bg-[#13141f] p-2 text-slate-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <form onSubmit={handleGlobalSearch} className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Cari materi, mata kuliah, atau catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[#25273b] bg-[#141521] py-2 pl-4 pr-10 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#9b7bf7] focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                aria-label="Cari"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-[#1e2030] p-1.5 text-slate-300 hover:text-white"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/schedule"
              className="hidden items-center gap-2 rounded-full border border-[#25273b] bg-[#141521] px-3.5 py-1.5 text-xs text-slate-300 hover:border-[#373a57] sm:inline-flex"
            >
              <Calendar className="h-3.5 w-3.5 text-[#a78bfa]" />
              <span>{user.timezone || "Asia/Jakarta"}</span>
            </Link>

            <Link
              href="/settings"
              aria-label="Pengaturan"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#25273b] bg-[#141521] text-slate-300 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              aria-label="Pengingat"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#25273b] bg-[#141521] text-slate-300 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {reminderCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a78bfa] px-1 text-[10px] font-bold text-slate-950">
                  {reminderCount}
                </span>
              )}
            </Link>

            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] to-[#6366f1] text-xs font-bold text-slate-950 ring-2 ring-[#25273b]"
              title={user.name}
            >
              {initials}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8">
          {!hidePageHeader && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
                {subtitle && <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
