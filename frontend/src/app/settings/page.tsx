"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { apiFetch, ApiError, setAuthToken } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { AlertBanner, Badge, Button, Card, Input, Select } from "@/components/ui";

function SettingsForm({
  user,
  refreshUser,
}: {
  user: User;
  refreshUser: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [timezone, setTimezone] = useState(user.timezone || "Asia/Jakarta");
  const [dailyMinutes, setDailyMinutes] = useState(String(user.daily_study_minutes || 120));
  const [preferredTime, setPreferredTime] = useState<string>(user.preferred_study_time || "evening");
  const [minutesBefore, setMinutesBefore] = useState(
    String(user.notification_preferences?.minutes_before ?? 30)
  );
  const [scheduleReminder, setScheduleReminder] = useState(
    user.notification_preferences?.schedule_reminder ?? true
  );
  const [taskReminder, setTaskReminder] = useState(
    user.notification_preferences?.task_reminder ?? true
  );
  const [examReminder, setExamReminder] = useState(
    user.notification_preferences?.exam_reminder ?? true
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch<{ user: User }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          timezone,
          daily_study_minutes: Number(dailyMinutes),
          preferred_study_time: preferredTime,
          notification_preferences: {
            schedule_reminder: scheduleReminder,
            task_reminder: taskReminder,
            exam_reminder: examReminder,
            minutes_before: Number(minutesBefore),
          },
        }),
      });
      await refreshUser();
      setSuccess("Preferensi profil dan pengingat berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <Settings className="h-4 w-4 text-violet-400" />
        <h2 className="text-base font-semibold text-white">Preferensi Akademik</h2>
      </div>

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

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-300">Nama Lengkap</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300">Zona Waktu</label>
            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
              <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
              <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300">Target Belajar Harian (menit)</label>
            <Input
              type="number"
              min={30}
              max={720}
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300">Waktu Belajar Favorit</label>
            <Select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
              <option value="morning">Pagi</option>
              <option value="afternoon">Siang</option>
              <option value="evening">Sore / Malam</option>
              <option value="night">Larut Malam</option>
            </Select>
          </div>
        </div>

        <div className="border-t border-[#1e2948] pt-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Pengingat & Notifikasi</h3>
          <div className="space-y-2.5 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scheduleReminder}
                onChange={(e) => setScheduleReminder(e.target.checked)}
                className="accent-violet-600"
              />
              <span>Pengingat jadwal kuliah & praktikum</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={examReminder}
                onChange={(e) => setExamReminder(e.target.checked)}
                className="accent-violet-600"
              />
              <span>Pengingat jadwal ujian</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={taskReminder}
                onChange={(e) => setTaskReminder(e.target.checked)}
                className="accent-violet-600"
              />
              <span>Pengingat deadline tugas</span>
            </label>
            <div className="max-w-xs pt-2">
              <label className="mb-1 block text-xs text-slate-400">
                Waktu pengingat sebelum acara (menit)
              </label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={minutesBefore}
                onChange={(e) => setMinutesBefore(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [aiStatus, setAiStatus] = useState<{ provider: string; configured: boolean } | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Hapus akun dan seluruh mata kuliah, materi, kuis, jadwal, dan tugas Anda secara permanen?"
      )
    ) {
      return;
    }

    setDeletingAccount(true);
    try {
      await apiFetch("/auth/account", { method: "DELETE" });
      setAuthToken(null);
      await logout();
      router.replace("/register");
    } finally {
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    let active = true;
    apiFetch<{ provider: string; configured: boolean }>("/ai/status")
      .then((res) => {
        if (active) setAiStatus(res);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell
      title="Settings & Profile"
      subtitle="Atur profil akademik, zona waktu, target belajar, dan preferensi pengingat."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {user && <SettingsForm key={user.id} user={user} refreshUser={refreshUser} />}

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-base font-semibold text-white">Status AI Provider</h2>
            {aiStatus ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Provider Aktif</span>
                  <Badge tone="violet">{aiStatus.provider.toUpperCase()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Konfigurasi Key</span>
                  <Badge tone={aiStatus.configured ? "emerald" : "amber"}>
                    {aiStatus.configured ? "Siap" : "Belum Diisi"}
                  </Badge>
                </div>
                <p className="pt-2 text-xs leading-relaxed text-slate-400">
                  API key disimpan secara aman di environment backend (`backend/.env`) dan tidak pernah
                  diekspos ke browser.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Memeriksa status provider...</p>
            )}
          </Card>

          <Card className="border-rose-500/30">
            <h2 className="mb-2 text-base font-semibold text-rose-300">Zona Berbahaya</h2>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              Menghapus akun akan menghapus permanen seluruh dokumen materi, kuis, jadwal, tugas,
              dan riwayat percakapan Anda.
            </p>
            <Button
              variant="danger"
              size="sm"
              disabled={deletingAccount}
              onClick={handleDeleteAccount}
            >
              {deletingAccount ? "Menghapus..." : "Hapus Akun & Data"}
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
