"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { AlertBanner, Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      loginWithToken(res.token, res.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk ke akun.");
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
            <h1 className="text-xl font-bold text-white">Masuk ke StudyNest</h1>
            <p className="text-xs text-slate-400">Your Academic Life, Smarter with AI.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
              Email Mahasiswa
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@kampus.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-300">
              Kata Sandi
            </label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300">
            Daftar sekarang
          </Link>
        </p>
      </Card>
    </div>
  );
}
