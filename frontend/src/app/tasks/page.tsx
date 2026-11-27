"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckSquare, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Course, TaskItem } from "@/lib/types";
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
  Textarea,
} from "@/components/ui";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<TaskItem["priority"]>("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterCourse) params.set("course_id", filterCourse);
      if (filterPriority) params.set("priority", filterPriority);
      if (search) params.set("search", search);
      params.set("sort", sortBy);

      const [taskRes, courseRes] = await Promise.all([
        apiFetch<{ data: TaskItem[] }>(`/tasks?${params.toString()}`),
        apiFetch<{ data: Course[] }>("/courses?per_page=100"),
      ]);
      setTasks(taskRes.data || []);
      setCourses(courseRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat daftar tugas.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCourse, filterPriority, sortBy, search]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterCourse) params.set("course_id", filterCourse);
    if (filterPriority) params.set("priority", filterPriority);
    if (search) params.set("search", search);
    params.set("sort", sortBy);

    Promise.all([
      apiFetch<{ data: TaskItem[] }>(`/tasks?${params.toString()}`),
      apiFetch<{ data: Course[] }>("/courses?per_page=100"),
    ])
      .then(([taskRes, courseRes]) => {
        if (!active) return;
        setTasks(taskRes.data || []);
        setCourses(courseRes.data || []);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Gagal memuat daftar tugas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filterStatus, filterCourse, filterPriority, sortBy, search]);

  const startEdit = (task: TaskItem) => {
    setEditingId(task.id);
    setTitle(task.title);
    setCourseId(task.course_id ? String(task.course_id) : "");
    setDueAt(task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : "");
    setPriority(task.priority);
    setEstimatedMinutes(task.estimated_minutes ? String(task.estimated_minutes) : "60");
    setDescription(task.description || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueAt("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        course_id: courseId ? Number(courseId) : null,
        due_at: dueAt || null,
        priority,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        description: description || null,
      };
      if (editingId !== null) {
        await apiFetch(`/tasks/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan tugas.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task: TaskItem, status: TaskItem["status"]) => {
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui status tugas.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus tugas.");
    }
  };

  const priorityTone = (p: TaskItem["priority"]) => {
    if (p === "urgent" || p === "high") return "rose";
    if (p === "medium") return "amber";
    return "slate";
  };

  return (
    <AppShell
      title="Task Manager"
      subtitle="Kelola tugas per mata kuliah, urutkan berdasarkan deadline atau prioritas, dan simpan riwayat selesai."
    >
      {error && (
        <div className="mb-4">
          <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Plus className="h-4 w-4 text-violet-400" />
            {editingId !== null ? "Ubah Tugas" : "Tugas Baru"}
          </h2>
          {editingId !== null && (
            <Button size="sm" variant="ghost" onClick={resetForm}>
              Batal Ubah
            </Button>
          )}
        </div>
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-4">
          <Input
            required
            placeholder="Judul tugas"
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
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <div className="flex gap-2">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskItem["priority"])}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Input
              type="number"
              min={5}
              placeholder="Menit"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <Textarea
              rows={1}
              placeholder="Deskripsi atau catatan tugas (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : editingId !== null ? "Simpan Perubahan" : "Tambah Tugas"}
          </Button>
        </form>
      </Card>

      {/* Filter & Sort */}
      <div className="mb-5 grid gap-3 md:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            className="pl-9"
            placeholder="Cari tugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="todo">Belum Dimulai</option>
          <option value="in_progress">Sedang Dikerjakan</option>
          <option value="completed">Selesai</option>
        </Select>
        <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
          <option value="">Semua Mata Kuliah</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">Semua Prioritas</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="deadline">Urutkan: Deadline</option>
          <option value="priority">Urutkan: Prioritas</option>
        </Select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="Belum ada tugas"
          description="Catat tugas kuliah beserta deadline untuk mengaktifkan pengingat dan integrasi ke Study Planner."
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`font-semibold ${
                      task.status === "completed" ? "line-through text-slate-400" : "text-white"
                    }`}
                  >
                    {task.title}
                  </h3>
                  <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                  <Badge tone={task.status === "completed" ? "emerald" : "blue"}>
                    {task.status === "todo"
                      ? "Belum Dimulai"
                      : task.status === "in_progress"
                        ? "Dikerjakan"
                        : "Selesai"}
                  </Badge>
                </div>
                {task.description && (
                  <p className="mt-1 text-xs text-slate-400">{task.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {task.course?.name || "Umum"} ·{" "}
                  {task.due_at
                    ? `Deadline: ${new Date(task.due_at).toLocaleString("id-ID")}`
                    : "Tanpa deadline"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  className="w-40 py-1.5 text-xs"
                  value={task.status}
                  onChange={(e) => updateStatus(task, e.target.value as TaskItem["status"])}
                  aria-label="Ubah status tugas"
                >
                  <option value="todo">Belum Dimulai</option>
                  <option value="in_progress">Sedang Dikerjakan</option>
                  <option value="completed">Selesai</option>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => startEdit(task)} aria-label="Ubah tugas">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(task.id)}>
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
