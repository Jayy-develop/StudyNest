"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, CheckCircle2, Sparkles, Trash2, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Course, StudyPlan, StudySession } from "@/lib/types";
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

export default function PlannerPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("120");
  const [preferredTime, setPreferredTime] = useState("evening");
  const [goal, setGoal] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [planRes, courseRes] = await Promise.all([
        apiFetch<{ data: StudyPlan[] }>("/study-plans"),
        apiFetch<{ data: Course[] }>("/courses?per_page=100"),
      ]);
      setPlans(planRes.data || []);
      setCourses(courseRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat Study Planner.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ data: StudyPlan[] }>("/study-plans"),
      apiFetch<{ data: Course[] }>("/courses?per_page=100"),
    ])
      .then(([planRes, courseRes]) => {
        if (!active) return;
        setPlans(planRes.data || []);
        setCourses(courseRes.data || []);
        setStartDate((prev) => prev || new Date().toISOString().slice(0, 10));
        setEndDate((prev) => prev || new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10));
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Gagal memuat Study Planner.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch("/study-plans/generate", {
        method: "POST",
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          daily_study_minutes: Number(dailyMinutes),
          preferred_study_time: preferredTime,
          goal: goal || null,
        }),
      });
      setGoal("");
      setSuccess(
        "Draf rencana belajar berhasil dibuat tanpa menimpa jadwal yang ada. Tinjau dan setujui sesi yang sesuai."
      );
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyusun rencana belajar.");
    } finally {
      setGenerating(false);
    }
  };

  const approveAll = async (planId: number) => {
    try {
      await apiFetch(`/study-plans/${planId}/approve`, { method: "POST" });
      setSuccess("Seluruh sesi usulan pada rencana ini telah disetujui.");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyetujui rencana.");
    }
  };

  const updateSessionStatus = async (sessionId: number, status: StudySession["status"]) => {
    setError(null);
    try {
      await apiFetch(`/study-sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui sesi belajar.");
    }
  };

  const saveSessionEdit = async (sessionId: number) => {
    setError(null);
    try {
      await apiFetch(`/study-sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          session_date: editDate,
          start_time: editStart,
          end_time: editEnd,
        }),
      });
      setEditingSessionId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Waktu baru bentrok atau tidak valid.");
    }
  };

  const rescheduleSession = async (sessionId: number) => {
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/study-sessions/${sessionId}/reschedule`, { method: "POST" });
      setSuccess("Sesi terlewat berhasil dijadwalkan ulang pada slot kosong berikutnya. Silakan tinjau dan setujui.");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menjadwalkan ulang sesi.");
    }
  };

  const deletePlan = async (planId: number) => {
    try {
      await apiFetch(`/study-plans/${planId}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus rencana.");
    }
  };

  const sessionTone = (status: StudySession["status"]) => {
    if (status === "completed") return "emerald";
    if (status === "approved") return "blue";
    if (status === "rejected" || status === "skipped") return "rose";
    return "amber";
  };

  return (
    <AppShell
      title="AI Study Planner"
      subtitle="Rekomendasi jadwal belajar realistis berdasarkan tugas, ujian, dan slot bebas tanpa menimpa jadwal kuliah."
    >
      {error && (
        <div className="mb-4">
          <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <AlertBanner tone="success" message={success} onClose={() => setSuccess(null)} />
        </div>
      )}

      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Susun Rencana Belajar Baru</h2>
        </div>

        <form onSubmit={handleGenerate} className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Mulai</label>
            <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Sampai</label>
            <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Target Menit/Hari</label>
            <Input
              type="number"
              min={30}
              max={480}
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Waktu Favorit</label>
            <Select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
              <option value="morning">Pagi (07:00 - 12:00)</option>
              <option value="afternoon">Siang (13:00 - 17:30)</option>
              <option value="evening">Sore/Malam (18:30 - 22:00)</option>
              <option value="night">Malam (20:00 - 23:00)</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={generating || courses.length === 0}>
              {generating ? "Menyusun..." : "Buat Rencana"}
            </Button>
          </div>
          <div className="md:col-span-5">
            <Input
              placeholder="Fokus atau target belajar (opsional, mis. Persiapan UTS Basis Data)"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Belum ada rencana belajar"
          description="Buat rencana belajar agar StudyNest memetakan sesi belajar di jam kosong Anda."
        />
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#1c2747] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{plan.title}</h3>
                    <Badge tone={plan.status === "approved" ? "emerald" : "amber"}>{plan.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {plan.start_date} s.d. {plan.end_date}
                    {plan.goal ? ` · Target: ${plan.goal}` : ""}
                  </p>
                  {plan.ai_rationale && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{plan.ai_rationale}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {plan.status === "draft" && (
                    <Button size="sm" onClick={() => approveAll(plan.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Setujui Semua
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => deletePlan(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {plan.sessions.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Tidak ada slot kosong atau item tugas/ujian pada rentang tanggal ini.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {plan.sessions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-[#1f2c50] bg-[#080d1d] p-3 text-xs"
                    >
                      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-white">{s.title}</span>
                            <Badge tone={sessionTone(s.status)}>{s.status}</Badge>
                          </div>
                          <p className="mt-1 text-slate-400">
                            {s.session_date} · {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)} (
                            {s.duration_minutes} mnt) · {s.course?.name || "Umum"}
                          </p>
                          {s.rationale && <p className="mt-1 text-slate-500">{s.rationale}</p>}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {s.status === "proposed" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateSessionStatus(s.id, "approved")}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSessionId(s.id);
                                  setEditDate(s.session_date);
                                  setEditStart(s.start_time.slice(0, 5));
                                  setEditEnd(s.end_time.slice(0, 5));
                                }}
                              >
                                Ubah Jam
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => updateSessionStatus(s.id, "rejected")}
                              >
                                <X className="h-3.5 w-3.5" />
                                Tolak
                              </Button>
                            </>
                          )}
                          {s.status === "approved" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateSessionStatus(s.id, "completed")}
                              >
                                Tandai Selesai
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateSessionStatus(s.id, "skipped")}
                              >
                                Lewati
                              </Button>
                            </>
                          )}
                          {s.status === "skipped" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => rescheduleSession(s.id)}
                            >
                              Jadwalkan Ulang Otomatis
                            </Button>
                          )}
                        </div>
                      </div>

                      {editingSessionId === s.id && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1e2948] pt-3">
                          <Input
                            type="date"
                            className="w-40 py-1 text-xs"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                          />
                          <Input
                            type="time"
                            className="w-28 py-1 text-xs"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                          />
                          <Input
                            type="time"
                            className="w-28 py-1 text-xs"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                          />
                          <Button size="sm" onClick={() => saveSessionEdit(s.id)}>
                            Simpan Jam
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSessionId(null)}
                          >
                            Batal
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
