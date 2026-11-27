"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, FileText, RefreshCw, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { apiFetch, ApiError, downloadMaterialFile } from "@/lib/api";
import type { Course, Material } from "@/lib/types";
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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [summarizingId, setSummarizingId] = useState<number | null>(null);
  const [summaryMode, setSummaryMode] = useState("concise");
  const [activeSummary, setActiveSummary] = useState<Material | null>(null);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCourse) params.set("course_id", filterCourse);
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("search", search);

      const [matRes, courseRes] = await Promise.all([
        apiFetch<{ data: Material[] }>(`/materials?${params.toString()}`),
        apiFetch<{ data: Course[] }>("/courses?per_page=100"),
      ]);
      setMaterials(matRes.data || []);
      const courseList = courseRes.data || [];
      setCourses(courseList);
      if (!courseId && courseList.length > 0) {
        setCourseId(String(courseList[0].id));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat daftar materi.");
    } finally {
      setLoading(false);
    }
  }, [filterCourse, filterStatus, search, courseId]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (filterCourse) params.set("course_id", filterCourse);
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);

    Promise.all([
      apiFetch<{ data: Material[] }>(`/materials?${params.toString()}`),
      apiFetch<{ data: Course[] }>("/courses?per_page=100"),
    ])
      .then(([matRes, courseRes]) => {
        if (!active) return;
        setMaterials(matRes.data || []);
        const courseList = courseRes.data || [];
        setCourses(courseList);
        if (!courseId && courseList.length > 0) {
          setCourseId(String(courseList[0].id));
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Gagal memuat daftar materi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filterCourse, filterStatus, search, courseId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !courseId) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("course_id", courseId);
      if (title.trim()) formData.append("title", title.trim());
      formData.append("file", file);

      await apiFetch("/materials", {
        method: "POST",
        body: formData,
      });

      setTitle("");
      setFile(null);
      setSuccess("Materi berhasil diunggah dan masuk antrean pemrosesan.");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah materi.");
    } finally {
      setUploading(false);
    }
  };

  const handleSummarize = async (material: Material) => {
    setSummarizingId(material.id);
    setError(null);
    try {
      const res = await apiFetch<{ material: Material }>(`/materials/${material.id}/summarize`, {
        method: "POST",
        body: JSON.stringify({ mode: summaryMode }),
      });
      setActiveSummary(res.material);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal merangkum dokumen.");
    } finally {
      setSummarizingId(null);
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await apiFetch(`/materials/${id}/retry`, { method: "POST" });
      setSuccess("Pemrosesan ulang materi dijalankan.");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memproses ulang materi.");
    }
  };

  const handleDelete = async (material: Material) => {
    if (!window.confirm(`Hapus materi "${material.title}"?`)) return;
    try {
      await apiFetch(`/materials/${material.id}`, { method: "DELETE" });
      if (activeSummary?.id === material.id) setActiveSummary(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus materi.");
    }
  };

  const statusTone = (status: Material["status"]) => {
    if (status === "completed") return "emerald";
    if (status === "failed") return "rose";
    if (status === "processing") return "blue";
    return "amber";
  };

  return (
    <AppShell
      title="My Materials"
      subtitle="Unggah modul kuliah (PDF, DOCX, PPTX, TXT, MD), pantau ekstraksi teks, dan buat ringkasan AI."
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

      {/* Upload Form */}
      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Upload className="h-4 w-4 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Unggah Materi Baru</h2>
        </div>

        {courses.length === 0 ? (
          <p className="text-sm text-slate-400">
            Buat minimal satu mata kuliah di menu My Courses sebelum mengunggah materi.
          </p>
        ) : (
          <form onSubmit={handleUpload} className="grid gap-3 md:grid-cols-4">
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Judul materi (opsional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              type="file"
              accept=".pdf,.docx,.pptx,.txt,.md"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? "Mengunggah..." : "Upload & Proses"}
            </Button>
          </form>
        )}
      </Card>

      {/* Filters */}
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            className="pl-9"
            placeholder="Cari judul atau nama file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
          <option value="">Semua Mata Kuliah</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </Select>
      </div>

      {/* Summary Viewer */}
      {activeSummary?.summary && (
        <Card className="mb-6 border-violet-500/40 bg-[#121a36]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-white">Ringkasan AI: {activeSummary.title}</h3>
            <Button size="sm" variant="ghost" onClick={() => setActiveSummary(null)}>
              Tutup
            </Button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
            {activeSummary.summary}
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Belum ada materi kuliah"
          description="Unggah dokumen PDF, DOCX, PPTX, atau Markdown untuk mulai merangkum, berdiskusi dengan AI, dan membuat kuis."
        />
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <Card key={m.id} className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white">{m.title}</h3>
                  <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                  <Badge tone="slate">{m.file_extension.toUpperCase()}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {m.course?.name || "Mata Kuliah"} · {m.original_filename} ·{" "}
                  {(m.file_size / 1024).toFixed(1)} KB
                  {m.page_count ? ` · ${m.page_count} hal/slide` : ""}
                  {typeof m.chunks_count === "number" ? ` · ${m.chunks_count} chunks` : ""}
                </p>
                {m.error_message && (
                  <p className="mt-1 text-xs text-rose-400">Error: {m.error_message}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {m.status === "completed" && (
                  <>
                    <Select
                      className="w-36 py-1.5 text-xs"
                      value={summaryMode}
                      onChange={(e) => setSummaryMode(e.target.value)}
                      aria-label="Mode ringkasan"
                    >
                      <option value="concise">Ringkas</option>
                      <option value="beginner">Pemula</option>
                      <option value="deep">Mendalam</option>
                      <option value="exam_prep">Persiapan Ujian</option>
                    </Select>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={summarizingId === m.id}
                      onClick={() => handleSummarize(m)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {summarizingId === m.id ? "Merangkum..." : "Ringkas AI"}
                    </Button>
                    {m.summary && (
                      <Button size="sm" variant="ghost" onClick={() => setActiveSummary(m)}>
                        Lihat Ringkasan
                      </Button>
                    )}
                  </>
                )}

                {m.status === "failed" && (
                  <Button size="sm" variant="secondary" onClick={() => handleRetry(m.id)}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Coba Lagi
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadMaterialFile(m.id, m.original_filename)}
                  title="Unduh file asli"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(m)}
                  title="Hapus materi"
                >
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
