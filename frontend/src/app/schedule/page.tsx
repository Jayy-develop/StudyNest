"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Course, Schedule } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSkeleton,
  Select,
} from "@/components/ui";

const DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Schedule[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Schedule["type"]>("lecture");
  const [isRecurring, setIsRecurring] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [specificDate, setSpecificDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [schedRes, courseRes] = await Promise.all([
        apiFetch<{ data: Schedule[] }>("/schedules"),
        apiFetch<{ data: Course[] }>("/courses?per_page=100"),
      ]);
      setSchedules(schedRes.data || []);
      setCourses(courseRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat jadwal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ data: Schedule[] }>("/schedules"),
      apiFetch<{ data: Course[] }>("/courses?per_page=100"),
    ])
      .then(([schedRes, courseRes]) => {
        if (!active) return;
        setSchedules(schedRes.data || []);
        setCourses(courseRes.data || []);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Gagal memuat jadwal.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const startEdit = (item: Schedule) => {
    setEditingId(item.id);
    setCourseId(item.course_id ? String(item.course_id) : "");
    setTitle(item.title);
    setType(item.type);
    setIsRecurring(item.is_recurring);
    setDayOfWeek(item.day_of_week ? String(item.day_of_week) : "1");
    setSpecificDate(item.specific_date || "");
    setStartTime(item.start_time.slice(0, 5));
    setEndTime(item.end_time.slice(0, 5));
    setLocation(item.location || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setLocation("");
  };

  const submitSchedule = async (allowConflict = false) => {
    setSaving(true);
    setError(null);
    setConflicts([]);

    try {
      const payload = {
        course_id: courseId ? Number(courseId) : null,
        title,
        type,
        is_recurring: isRecurring,
        day_of_week: isRecurring ? Number(dayOfWeek) : null,
        specific_date: !isRecurring ? specificDate : null,
        start_time: startTime,
        end_time: endTime,
        location: location || null,
        reminder_minutes_before: !isRecurring ? 30 : null,
        allow_conflict: allowConflict,
      };

      if (editingId !== null) {
        await apiFetch(`/schedules/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/schedules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && Array.isArray(err.data?.conflicts)) {
        setConflicts(err.data.conflicts as Schedule[]);
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : "Gagal menyimpan jadwal.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/schedules/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus jadwal.");
    }
  };

  return (
    <AppShell
      title="Smart Schedule"
      subtitle="Kelola jadwal kuliah mingguan, praktikum, dan ujian dengan deteksi bentrok otomatis."
      actions={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === "calendar" ? "primary" : "secondary"}
            onClick={() => setViewMode("calendar")}
          >
            Kalender Mingguan
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "primary" : "secondary"}
            onClick={() => setViewMode("list")}
          >
            Daftar
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 space-y-2">
          <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
          {conflicts.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
              <span>
                Bentrok dengan:{" "}
                {conflicts.map((c) => `${c.title} (${c.start_time.slice(0, 5)}-${c.end_time.slice(0, 5)})`).join(", ")}
              </span>
              <Button size="sm" variant="secondary" onClick={() => submitSchedule(true)}>
                Tetap Simpan
              </Button>
            </div>
          )}
        </div>
      )}

      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Plus className="h-4 w-4 text-violet-400" />
            {editingId !== null ? "Ubah Jadwal" : "Tambah Jadwal"}
          </h2>
          {editingId !== null && (
            <Button size="sm" variant="ghost" onClick={resetForm}>
              Batal Ubah
            </Button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitSchedule(false);
          }}
          className="grid gap-3 md:grid-cols-4"
        >
          <Input
            required
            placeholder="Judul (mis. Kuliah Struktur Data)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Mata Kuliah (Opsional)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value as Schedule["type"])}>
            <option value="lecture">Kuliah</option>
            <option value="lab">Praktikum</option>
            <option value="exam">Ujian</option>
            <option value="activity">Kegiatan Akademik</option>
          </Select>
          <Select
            value={isRecurring ? "recurring" : "once"}
            onChange={(e) => setIsRecurring(e.target.value === "recurring")}
          >
            <option value="recurring">Rutin Mingguan</option>
            <option value="once">Tanggal Tertentu</option>
          </Select>

          {isRecurring ? (
            <Select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              type="date"
              required
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
            />
          )}

          <Input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <div className="flex gap-2">
            <Input
              placeholder="Ruang / Link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Button type="submit" disabled={saving}>
              {saving ? "..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Belum ada jadwal akademik"
          description="Tambahkan jadwal kuliah rutin, praktikum, atau ujian Anda untuk mendeteksi bentrok dan membantu AI Study Planner."
        />
      ) : viewMode === "calendar" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DAYS.map((day) => {
            const items = schedules.filter((s) =>
              s.is_recurring
                ? s.day_of_week === day.value
                : s.specific_date && new Date(s.specific_date).getDay() === (day.value % 7)
            );
            return (
              <Card key={day.value}>
                <h3 className="mb-3 text-sm font-semibold text-white">{day.label}</h3>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-500">Kosong</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-[#243154] bg-[#080d1d] p-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-100">{item.title}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="text-slate-500 hover:text-violet-300"
                              aria-label="Ubah jadwal"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-500 hover:text-rose-400"
                              aria-label="Hapus jadwal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 font-mono text-violet-300">
                          {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                        </p>
                        <p className="mt-0.5 text-slate-400">
                          {item.course?.name || "Umum"} · {item.location || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {schedules.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{s.title}</span>
                  <Badge tone={s.type === "exam" ? "rose" : "blue"}>{s.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {s.is_recurring
                    ? DAYS.find((d) => d.value === s.day_of_week)?.label
                    : s.specific_date}{" "}
                  · {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)} · {s.location || "Tanpa lokasi"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => startEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
