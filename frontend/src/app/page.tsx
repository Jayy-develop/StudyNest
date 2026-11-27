"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Bot, CalendarDays, GraduationCap, ListChecks, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Card } from "@/components/ui";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0c12] text-slate-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />

      <header className="relative z-10 border-b border-[#25273b] bg-[#0b0c12]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-white">Hayabusa AI</span>
              <span className="block text-[11px] text-slate-400">Academic Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              All-in-One Student Assistant
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Your Academic Life,{" "}
              <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Smarter with AI.
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              Satukan mata kuliah, materi PDF/PPTX/DOCX, asisten AI berbasis dokumen dengan sitasi,
              kuis latihan otomatis, jadwal kuliah anti-bentrok, manajemen tugas, dan rencana belajar
              dalam satu ruang kerja mahasiswa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button>
                  Mulai Workspace Akademik
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Masuk ke Akun</Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="relative overflow-hidden border-[#25273b] bg-[#13141f] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Preview Bento Workspace</span>
                <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                  RAG + Planner
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#25273b] bg-[#1a1c2b] p-3.5">
                  <p className="text-xs text-slate-400">Mata Kuliah</p>
                  <p className="mt-1 text-2xl font-bold text-white">6 Aktif</p>
                  <p className="mt-1 text-[11px] text-emerald-400">Tersinkron jadwal</p>
                </div>
                <div className="rounded-xl border border-[#25273b] bg-[#1a1c2b] p-3.5">
                  <p className="text-xs text-slate-400">Kesiapan Materi</p>
                  <p className="mt-1 text-2xl font-bold text-white">92%</p>
                  <p className="mt-1 text-[11px] text-violet-300">Siap ditanya AI</p>
                </div>
              </div>
              <div className="mt-3 flex h-12 items-end gap-1.5 rounded-xl border border-[#25273b] bg-[#0f1019] p-2.5">
                <div className="bg-hatched h-full flex-1 rounded-md" />
                <div className="bg-hatched-violet h-full w-14 rounded-md" />
                <div className="h-full w-8 rounded-md bg-violet-500/80" />
                <div className="bg-hatched h-full w-10 rounded-md" />
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#25273b] bg-[#13141f]">
            <Bot className="h-5 w-5 text-violet-400" />
            <h2 className="mt-3 font-semibold text-white">AI Academic Assistant</h2>
            <p className="mt-1 text-sm text-slate-400">
              Tanya jawab dan ringkas modul PDF, DOCX, atau PPTX Anda dengan rujukan halaman yang jelas.
            </p>
          </Card>
          <Card className="border-[#25273b] bg-[#13141f]">
            <ListChecks className="h-5 w-5 text-blue-400" />
            <h2 className="mt-3 font-semibold text-white">AI Quiz Generator</h2>
            <p className="mt-1 text-sm text-slate-400">
              Buat latihan soal pilihan ganda dan esai langsung dari materi kuliah lengkap dengan pembahasan.
            </p>
          </Card>
          <Card className="border-[#25273b] bg-[#13141f]">
            <CalendarDays className="h-5 w-5 text-violet-400" />
            <h2 className="mt-3 font-semibold text-white">Smart Schedule & Tasks</h2>
            <p className="mt-1 text-sm text-slate-400">
              Kelola jadwal kuliah, praktikum, ujian, deteksi bentrok otomatis, dan deadline tugas.
            </p>
          </Card>
          <Card className="border-[#25273b] bg-[#13141f]">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <h2 className="mt-3 font-semibold text-white">AI Study Planner</h2>
            <p className="mt-1 text-sm text-slate-400">
              Rekomendasi sesi belajar realistis tanpa menimpa jadwal kuliah yang sudah ada.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
