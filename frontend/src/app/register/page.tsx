"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { AlertBanner, Button, Card, Input, Select } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch<{ user: User; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
          timezone,
        }),
      });
      loginWithToken(res.token, res.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat akun.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0c12] px-4 py-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[340px] w-[540px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[110px]" />
      <Card className="relative z-10 w-full max-w-md border-[#25273b] bg-[#13141f] p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/25">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Daftar Akun Hayabusa AI</h1>
            <p className="text-xs text-slate-400">Buat ruang kerja akademik pribadi Anda.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-300">
              Nama Lengkap
            </label>
            <Input
              id="name"
              required
              placeholder="Raka Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              placeholder="nama@kampus.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="timezone" className="mb-1.5 block text-xs font-medium text-slate-300">
              Zona Waktu
            </label>
            <Select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
              <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
              <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
            </Select>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-300">
              Kata Sandi (minimal 8 karakter)
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password_confirmation"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Konfirmasi Kata Sandi
            </label>
            <Input
              id="password_confirmation"
              type="password"
              required
              minLength={8}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Membuat akun..." : "Daftar"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Masuk di sini
          </Link>
        </p>
      </Card>
    </div>
  );
}
