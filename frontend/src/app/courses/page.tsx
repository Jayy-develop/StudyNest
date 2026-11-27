"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSkeleton,
  Textarea,
} from "@/components/ui";

const COURSE_COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [lecturer, setLecturer] = useState("");
  const [semester, setSemester] = useState("");
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Course[] }>("/courses");
      setCourses(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat mata kuliah.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch<{ data: Course[] }>("/courses")
      .then((res) => {
        if (active) setCourses(res.data || []);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Gagal memuat mata kuliah.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setCredits("3");
    setLecturer("");
    setSemester("");
    setColor(COURSE_COLORS[0]);
    setDescription("");
    setShowForm(false);
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setName(course.name);
    setCode(course.code || "");
    setCredits(course.credits ? String(course.credits) : "");
    setLecturer(course.lecturer || "");
    setSemester(course.semester || "");
    setColor(course.color || COURSE_COLORS[0]);
    setDescription(course.description || "");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        code: code || null,
        credits: credits ? Number(credits) : null,
        lecturer: lecturer || null,
        semester: semester || null,
        color,
        description: description || null,
      };
      if (editingId !== null) {
        await apiFetch(`/courses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadCourses();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan mata kuliah.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Hapus mata kuliah "${course.name}" beserta materi dan kuis terkait?`)) {
      return;
    }
    try {
      await apiFetch(`/courses/${course.id}`, { method: "DELETE" });
      await loadCourses();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus mata kuliah.");
    }
  };

  return (
    <AppShell
      title="My Courses"
      subtitle="Pusat integrasi mata kuliah untuk materi, jadwal, tugas, kuis, dan rencana belajar."
      actions={
        <Button
          size="sm"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Tutup Form" : "Tambah Mata Kuliah"}
        </Button>
      }
    >
      {error && (
        <div className="mb-5">
          <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-base font-semibold text-white">
            {editingId !== null ? "Ubah Mata Kuliah" : "Mata Kuliah Baru"}
          </h2>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Nama Mata Kuliah *</label>
              <Input
                required
                placeholder="Struktur Data & Algoritma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Kode (opsional)</label>
              <Input placeholder="IF204" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">SKS (opsional)</label>
              <Input
                type="number"
                min={1}
                max={12}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Dosen (opsional)</label>
              <Input
                placeholder="Dr. Nadia Kusuma"
                value={lecturer}
                onChange={(e) => setLecturer(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Semester (opsional)</label>
              <Input
                placeholder="Semester 3"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Warna Label</label>
              <div className="flex items-center gap-2 pt-1">
                {COURSE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Pilih warna ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      color === c ? "border-white scale-110" : "border-transparent opacity-70"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-300">Deskripsi Singkat</label>
              <Textarea
                rows={2}
                placeholder="Topik utama dan catatan mata kuliah..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : editingId !== null ? "Simpan Perubahan" : "Simpan Mata Kuliah"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Belum ada mata kuliah"
          description="Buat mata kuliah terlebih dahulu agar materi, jadwal, tugas, dan kuis Anda terhubung rapi."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Tambah Mata Kuliah
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: course.color || "#6366f1" }}
                    />
                    <div>
                      <h3 className="font-semibold text-white">{course.name}</h3>
                      <p className="text-xs text-slate-400">
                        {[course.code, course.credits ? `${course.credits} SKS` : null, course.semester]
                          .filter(Boolean)
                          .join(" · ") || "Mata Kuliah"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Ubah ${course.name}`}
                      onClick={() => startEdit(course)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-[#1a2444] hover:text-violet-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${course.name}`}
                      onClick={() => handleDelete(course)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {course.lecturer && (
                  <p className="mt-2 text-xs text-slate-400">Dosen: {course.lecturer}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge tone="blue">{course.materials_count ?? 0} Materi</Badge>
                  <Badge tone="amber">{course.open_tasks_count ?? 0} Tugas Aktif</Badge>
                  <Badge tone="violet">{course.quizzes_count ?? 0} Kuis</Badge>
                  <Badge tone="slate">{course.schedules_count ?? 0} Jadwal</Badge>
                </div>
              </div>

              <div className="mt-5 border-t border-[#1e2948] pt-3">
                <Link
                  href={`/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300"
                >
                  <span>Buka detail mata kuliah</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
