"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckSquare, FileText, ListChecks } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { AlertBanner, Badge, Button, Card, EmptyState, LoadingSkeleton } from "@/components/ui";

function CourseDetailContent() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!params.id) return;

    apiFetch<{ course: Course }>(`/courses/${params.id}`)
      .then((res) => {
        if (active) setCourse(res.course);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Gagal memuat detail mata kuliah.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <AppShell
      title={course?.name || "Detail Mata Kuliah"}
      subtitle={
        course
          ? [course.code, course.lecturer, course.semester].filter(Boolean).join(" · ") ||
            "Ringkasan seluruh modul terkait"
          : ""
      }
      actions={
        <Link href="/courses">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
      }
    >
      {error && (
        <div className="mb-4">
          <AlertBanner tone="error" message={error} />
        </div>
      )}

      {loading || !course ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <h2 className="font-semibold text-white">Materi Kuliah</h2>
              </div>
              <Link href="/materials" className="text-xs text-violet-400">Kelola materi</Link>
            </div>
            {!course.materials?.length ? (
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title="Belum ada materi"
                description="Unggah modul PDF/DOCX/PPTX untuk mata kuliah ini."
              />
            ) : (
              <div className="space-y-2">
                {course.materials.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-[#090e1f] px-3 py-2 text-sm">
                    <span className="truncate">{m.title}</span>
                    <Badge tone={m.status === "completed" ? "emerald" : m.status === "failed" ? "rose" : "amber"}>
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-violet-400" />
                <h2 className="font-semibold text-white">Tugas Terkait</h2>
              </div>
              <Link href="/tasks" className="text-xs text-violet-400">Kelola tugas</Link>
            </div>
            {!course.tasks?.length ? (
              <EmptyState
                icon={<CheckSquare className="h-5 w-5" />}
                title="Belum ada tugas"
                description="Tambahkan tugas untuk mata kuliah ini di Task Manager."
              />
            ) : (
              <div className="space-y-2">
                {course.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-[#090e1f] px-3 py-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    <Badge tone={t.status === "completed" ? "emerald" : "amber"}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-400" />
                <h2 className="font-semibold text-white">Jadwal & Ujian</h2>
              </div>
              <Link href="/schedule" className="text-xs text-violet-400">Kelola jadwal</Link>
            </div>
            {!course.schedules?.length ? (
              <EmptyState
                icon={<CalendarDays className="h-5 w-5" />}
                title="Belum ada jadwal"
                description="Tambahkan jadwal kuliah, praktikum, atau ujian."
              />
            ) : (
              <div className="space-y-2">
                {course.schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-[#090e1f] px-3 py-2 text-sm">
                    <span>{s.title}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-400" />
                <h2 className="font-semibold text-white">Kuis Latihan</h2>
              </div>
              <Link href="/quiz" className="text-xs text-violet-400">Buka AI Quiz</Link>
            </div>
            {!course.quizzes?.length ? (
              <EmptyState
                icon={<ListChecks className="h-5 w-5" />}
                title="Belum ada kuis"
                description="Buat kuis latihan dari materi mata kuliah ini."
              />
            ) : (
              <div className="space-y-2">
                {course.quizzes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded-lg bg-[#090e1f] px-3 py-2 text-sm">
                    <span>{q.title}</span>
                    <Badge tone="violet">{q.questions_count ?? 0} soal</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-12">
          <LoadingSkeleton rows={4} />
        </div>
      }
    >
      <CourseDetailContent />
    </Suspense>
  );
}
