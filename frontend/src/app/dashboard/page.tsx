"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Plus,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { DashboardPayload } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { AlertBanner, Badge, Button, EmptyState, LoadingSkeleton } from "@/components/ui";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const payload = await apiFetch<DashboardPayload>("/dashboard");
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch<DashboardPayload>("/dashboard")
      .then((payload) => {
        if (active) {
          setData(payload);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Gagal memuat dashboard.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const dismissReminder = async (id: number) => {
    try {
      await apiFetch(`/reminders/${id}/dismiss`, { method: "POST" });
      await loadDashboard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menutup pengingat.");
    }
  };

  const todayDateObj = data ? new Date(`${data.today_date}T00:00:00`) : null;
  const weekStrip = todayDateObj
    ? Array.from({ length: 6 }, (_, idx) => {
        const d = new Date(todayDateObj);
        d.setDate(todayDateObj.getDate() - 2 + idx);
        return {
          dayName: d.toLocaleDateString("id-ID", { weekday: "short" }),
          dayNum: d.getDate(),
          isToday: idx === 2,
        };
      })
    : [];

  const totalMaterials = data?.progress.materials_count ?? 0;
  const completedMaterials = data?.progress.completed_materials_count ?? 0;
  const materialRatio =
    totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

  const totalTasks = data?.progress.tasks_total ?? 0;
  const completedTasks = data?.progress.tasks_completed ?? 0;
  const openTasks = Math.max(0, totalTasks - completedTasks);
  const taskRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const greetingParts = (data?.greeting || "Hai, Mahasiswa").split(",");
  const greetingPrefix = greetingParts[0] || "Hai";
  const studentName = greetingParts.slice(1).join(",").trim() || "Mahasiswa";

  return (
    <AppShell
      title="Dashboard"
      hidePageHeader
      reminderCount={data?.pending_reminders.length ?? 0}
    >
      {error && (
        <div className="mb-5">
          <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {loading || !data ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <div className="space-y-5">
          {/* Hero Greeting matching reference */}
          <div className="pb-1">
            <p className="text-xl font-medium text-slate-400 sm:text-2xl">
              {greetingPrefix}, {studentName}!
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Apa fokus belajar Anda hari ini?
            </h1>
          </div>

          {/* BENTO ROW 1: Readiness Card | Hayabusa Intelligence Hero | Mini Calendar & Agenda */}
          <div className="grid gap-4 xl:grid-cols-12">
            {/* Left Card: Academic Materials & Tasks Readiness */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#25273b] bg-[#141521] p-5 xl:col-span-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2e314a] bg-[#1b1c2c] text-slate-300">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium text-slate-200">Materi & Tugas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/materials"
                      className="rounded-full border border-[#2a2d44] bg-[#1a1c2c] px-3 py-1 text-[11px] text-slate-300 hover:text-white"
                    >
                      View all
                    </Link>
                    <button
                      type="button"
                      onClick={() => void loadDashboard()}
                      aria-label="Muat ulang"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2a2d44] bg-[#1a1c2c] text-slate-400 hover:text-white"
                    >
                      <RotateCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-3xl font-bold tracking-tight text-white">
                    {totalMaterials + totalTasks}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {completedMaterials} materi siap AI · {completedTasks} tugas selesai
                  </p>
                </div>
              </div>

              {/* Segmented Hatched + Glowing Lavender Bar */}
              <div className="mt-6">
                <div className="relative mb-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Kesiapan Materi</span>
                  <span className="rounded-lg border border-violet-400/30 bg-[#1e1b38] px-2 py-0.5 font-semibold text-violet-200">
                    {materialRatio}% siap
                  </span>
                </div>
                <div className="flex h-12 items-end gap-2">
                  <div
                    className="bg-hatched h-full flex-1 rounded-xl border border-[#2a2d44]"
                    title={`Total Materi: ${totalMaterials}`}
                  />
                  <div
                    className="h-full w-16 rounded-xl bg-gradient-to-b from-[#c4b5fd] to-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all"
                    style={{ height: `${Math.max(28, materialRatio)}%` }}
                    title={`Materi Selesai Diproses: ${completedMaterials}`}
                  />
                  <div
                    className="bg-hatched-violet h-full w-10 rounded-xl border border-violet-500/30"
                    style={{ height: `${Math.max(25, taskRatio)}%` }}
                    title={`Tugas Selesai: ${completedTasks}/${totalTasks}`}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{totalMaterials} Dokumen</span>
                  <span>{materialRatio}% AI Ready</span>
                  <span>{taskRatio}% Tugas</span>
                </div>
              </div>
            </div>

            {/* Center Spotlight Card: Hayabusa Intelligence */}
            <div className="relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-2xl border border-violet-500/50 bg-[#12121e] p-6 text-center shadow-[0_0_35px_rgba(139,92,246,0.2)] xl:col-span-5">
              {/* Subtle ambient dot grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage: "radial-gradient(#475569 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />

              <div className="relative z-10">
                <h2 className="bg-gradient-to-r from-[#60a5fa] via-[#c084fc] to-[#fb923c] bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                  Hayabusa Intelligence
                </h2>
                <p className="mt-1.5 text-xs text-slate-300 sm:text-sm">
                  Belajar dari materi kuliah, rangkum dokumen, dan uji pemahaman secara terarah
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link href="/assistant">
                    <Button size="sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      Buka AI Assistant
                    </Button>
                  </Link>
                  <Link href="/quiz">
                    <Button size="sm" variant="secondary">
                      Buat AI Quiz
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Layered organic wave graphic */}
              <svg
                viewBox="0 0 500 130"
                className="pointer-events-none relative z-0 -mx-6 -mb-6 mt-3 h-28 w-[calc(100%+3rem)]"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="waveGlowA" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="waveGlowB" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
                    <stop offset="55%" stopColor="#f43f5e" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,95 C90,30 160,115 260,55 C350,0 420,90 500,45 L500,130 L0,130 Z"
                  fill="url(#waveGlowA)"
                  opacity="0.7"
                />
                <path
                  d="M0,110 C110,55 180,20 280,75 C360,118 430,45 500,80 L500,130 L0,130 Z"
                  fill="url(#waveGlowB)"
                  opacity="0.88"
                />
                <path
                  d="M40,130 C130,75 220,70 320,100 C400,122 455,88 500,105 L500,130 Z"
                  fill="#c084fc"
                  opacity="0.45"
                />
              </svg>
            </div>

            {/* Right Card: Mini Calendar + Agenda & Create Activity */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#25273b] bg-[#141521] p-5 xl:col-span-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <Link href="/schedule" className="text-slate-400 hover:text-white" aria-label="Jadwal">
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                  <span>
                    {todayDateObj?.toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Link href="/schedule" className="text-slate-400 hover:text-white" aria-label="Jadwal">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-6 gap-1 text-center">
                  {weekStrip.map((d, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500">{d.dayName}</span>
                      <span
                        className={
                          d.isToday
                            ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#a78bfa] text-xs font-bold text-slate-950 shadow-[0_0_12px_rgba(167,139,250,0.6)]"
                            : "flex h-7 w-7 items-center justify-center text-xs text-slate-300"
                        }
                      >
                        {d.dayNum}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Agenda Items from real today_schedules + upcoming_tasks */}
                <div className="mt-4 space-y-2">
                  {data.today_schedules.length === 0 && data.upcoming_tasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#27293d] bg-[#10111a] p-3 text-center text-xs text-slate-400">
                      Tidak ada agenda hari ini.
                    </div>
                  ) : (
                    <>
                      {data.today_schedules.slice(0, 2).map((item) => (
                        <div
                          key={`sched-${item.id}`}
                          className="rounded-xl border border-[#24263a] bg-[#191a29] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-white">{item.title}</p>
                            <Badge tone={item.type === "exam" ? "rose" : "violet"}>{item.type}</Badge>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="truncate">{item.course?.name || "Akademik"}</span>
                            <span className="flex items-center gap-1 font-mono text-slate-300">
                              <Clock className="h-3 w-3" />
                              {item.start_time.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {data.today_schedules.length < 2 &&
                        data.upcoming_tasks.slice(0, 2 - data.today_schedules.length).map((task) => (
                          <div
                            key={`task-${task.id}`}
                            className="rounded-xl border border-[#24263a] bg-[#191a29] p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-white">{task.title}</p>
                              <Badge tone="amber">{task.priority}</Badge>
                            </div>
                            <p className="mt-1 truncate text-[11px] text-slate-400">
                              {task.course?.name || "Tugas"} ·{" "}
                              {task.due_at
                                ? new Date(task.due_at).toLocaleDateString("id-ID")
                                : "Tanpa deadline"}
                            </p>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>

              <Link
                href="/schedule"
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#a78bfa] py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-[#9370f7]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Activity</span>
              </Link>
            </div>
          </div>

          {/* BENTO ROW 2: 2x2 Stat Grid | Weekly Engagement Matrix */}
          <div className="grid gap-4 xl:grid-cols-12">
            {/* Left 2x2 Compact Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:col-span-5">
              {/* Card 1: Mata Kuliah */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#25273b] bg-[#141521] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2e314a] bg-[#1b1c2c] text-slate-300">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-medium text-slate-200">Mata Kuliah</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/courses"
                      className="rounded-full border border-[#2a2d44] bg-[#1a1c2c] px-2.5 py-0.5 text-[11px] text-slate-300 hover:text-white"
                    >
                      View all
                    </Link>
                    <Link
                      href="/courses"
                      aria-label="Buka My Courses"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2a2d44] bg-[#1a1c2c] text-slate-300 hover:text-white"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-3xl font-bold text-white">{data.progress.courses_count}</p>
                  <p className="mt-1 text-xs text-violet-300">
                    {totalMaterials} materi terhubung
                  </p>
                </div>
              </div>

              {/* Card 2: Skor Kuis */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#25273b] bg-[#141521] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2e314a] bg-[#1b1c2c] text-slate-300">
                      <GraduationCap className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-medium text-slate-200">Rata-rata Kuis</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/quiz"
                      className="rounded-full border border-[#2a2d44] bg-[#1a1c2c] px-2.5 py-0.5 text-[11px] text-slate-300 hover:text-white"
                    >
                      View all
                    </Link>
                    <Link
                      href="/quiz"
                      aria-label="Buka AI Quiz"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2a2d44] bg-[#1a1c2c] text-slate-300 hover:text-white"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-3xl font-bold text-white">
                    {data.progress.average_quiz_score !== null
                      ? `${data.progress.average_quiz_score}%`
                      : "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {data.progress.average_quiz_score !== null
                      ? "Hasil evaluasi AI Quiz"
                      : "Belum ada kuis dikerjakan"}
                  </p>
                </div>
              </div>

              {/* Card 3: Study Sessions (Radial Violet Glow like Session card) */}
              <div className="flex flex-col justify-between rounded-2xl border border-violet-500/35 bg-[radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.35),_rgba(20,21,33,0.96)_70%)] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/20 text-violet-200">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-medium text-slate-100">Sesi Belajar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/planner"
                      className="rounded-full border border-violet-400/30 bg-[#1e1a36] px-2.5 py-0.5 text-[11px] text-violet-200 hover:text-white"
                    >
                      View all
                    </Link>
                    <Link
                      href="/planner"
                      aria-label="Buka Study Planner"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-violet-400/30 bg-[#1e1a36] text-violet-200 hover:text-white"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-3xl font-bold text-white">
                    {data.progress.study_sessions_completed}/{data.progress.study_sessions_total}
                  </p>
                  <p className="mt-1 text-xs text-violet-200">Sesi selesai dari rencana disetujui</p>
                </div>
              </div>

              {/* Card 4: Tugas Aktif */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#25273b] bg-[#141521] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2e314a] bg-[#1b1c2c] text-slate-300">
                      <CheckSquare className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-medium text-slate-200">Tugas Aktif</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/tasks"
                      className="rounded-full border border-[#2a2d44] bg-[#1a1c2c] px-2.5 py-0.5 text-[11px] text-slate-300 hover:text-white"
                    >
                      View all
                    </Link>
                    <Link
                      href="/tasks"
                      aria-label="Buka Task Manager"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2a2d44] bg-[#1a1c2c] text-slate-300 hover:text-white"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-3xl font-bold text-white">{openTasks}</p>
                  <p className="mt-1 text-xs text-amber-300">
                    {completedTasks} dari {totalTasks} tugas selesai
                  </p>
                </div>
              </div>
            </div>

            {/* Right Wide Card: Weekly Engagement Heatmap Matrix */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#25273b] bg-[#141521] p-5 xl:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2e314a] bg-[#1b1c2c] text-slate-300">
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-sm font-semibold text-white">Weekly Engagement</h2>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-hatched h-2.5 w-2.5 rounded-sm border border-[#31344f]" />
                    Kosong
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#4f3d8f]" />
                    Rendah
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#7c5dfa]" />
                    Sedang
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#b794f4]" />
                    Padat
                  </span>
                  <Link
                    href="/planner"
                    className="ml-1 rounded-full border border-[#2a2d44] bg-[#1a1c2c] px-2.5 py-0.5 text-slate-300 hover:text-white"
                  >
                    View all
                  </Link>
                </div>
              </div>

              {data.weekly_matrix.length === 0 ? (
                <div className="my-6">
                  <EmptyState
                    icon={<CalendarDays className="h-5 w-5" />}
                    title="Belum ada matriks aktivitas mingguan"
                    description="Tambahkan mata kuliah, jadwal, tugas, atau sesi belajar untuk memetakan intensitas minggu ini."
                    action={
                      <Link href="/courses">
                        <Button size="sm">Tambah Mata Kuliah</Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div className="mt-5 space-y-2">
                  {data.weekly_matrix.map((row) => (
                    <div key={row.course_id} className="flex items-center gap-3">
                      <span
                        className="w-16 shrink-0 truncate text-xs font-medium text-slate-400"
                        title={row.course_name}
                      >
                        {row.label}
                      </span>
                      <div className="grid flex-1 grid-cols-7 gap-2">
                        {row.cells.map((cell) => {
                          const tileStyle =
                            cell.intensity >= 3
                              ? "bg-[#b794f4] border-violet-300/40 shadow-[0_0_10px_rgba(183,148,244,0.3)]"
                              : cell.intensity === 2
                                ? "bg-[#7c5dfa] border-violet-400/30"
                                : cell.intensity === 1
                                  ? "bg-[#43357d] border-violet-500/20"
                                  : "bg-hatched border-[#272a40]";

                          return (
                            <div
                              key={cell.date}
                              title={`${row.course_name} (${cell.date}): ${cell.intensity} agenda/tugas/sesi`}
                              className={`h-8 rounded-lg border transition-transform hover:scale-105 ${tileStyle}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-3 pt-1">
                    <span className="w-16 shrink-0" />
                    <div className="grid flex-1 grid-cols-7 gap-2 text-center text-[11px] text-slate-500">
                      {data.weekly_matrix[0]?.cells.map((c) => (
                        <span key={c.date}>{c.day_label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BENTO ROW 3: Pending Reminders & Actionable Recommendations */}
          {(data.pending_reminders.length > 0 || data.recommendations.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.pending_reminders.length > 0 && (
                <div className="rounded-2xl border border-violet-500/30 bg-[#141521] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#a78bfa]" />
                    <h2 className="text-sm font-semibold text-white">Pengingat Aktif</h2>
                  </div>
                  <div className="space-y-2">
                    {data.pending_reminders.map((rem) => (
                      <div
                        key={rem.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[#25273b] bg-[#0e0f18] px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-medium text-slate-100">{rem.title}</p>
                          <p className="text-slate-400">
                            {new Date(rem.remind_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => dismissReminder(rem.id)}>
                          Tutup
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-[#25273b] bg-[#141521] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#a78bfa]" />
                  <h2 className="text-sm font-semibold text-white">Rekomendasi Tindakan</h2>
                </div>
                <div className="space-y-2.5">
                  {data.recommendations.slice(0, 3).map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#25273b] bg-[#0e0f18] px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{rec.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {rec.description}
                        </p>
                      </div>
                      <Link
                        href={rec.action_href}
                        className="shrink-0 rounded-lg bg-[#212338] px-2.5 py-1 text-[11px] font-medium text-[#c4b5fd] hover:bg-[#2c2f4b]"
                      >
                        {rec.action_label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
