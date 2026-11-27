"use client";

import React, { useEffect, useState } from "react";
import { Bot, BookOpen, MessageSquarePlus, Send, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { ChatMessage, Conversation, Course, Material } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingSkeleton,
  Select,
  Textarea,
} from "@/components/ui";

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [aiStatus, setAiStatus] = useState<{ provider: string; configured: boolean } | null>(null);

  const [courseId, setCourseId] = useState("");
  const [mode, setMode] = useState<Conversation["explanation_mode"]>("concise");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [prompt, setPrompt] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ data: Conversation[] }>("/conversations"),
      apiFetch<{ data: Course[] }>("/courses?per_page=100"),
      apiFetch<{ data: Material[] }>("/materials?status=completed&per_page=100"),
      apiFetch<{ provider: string; configured: boolean }>("/ai/status"),
    ])
      .then(async ([convRes, courseRes, matRes, statusRes]) => {
        if (!active) return;
        const list = convRes.data || [];
        setConversations(list);
        setCourses(courseRes.data || []);
        setMaterials(matRes.data || []);
        setAiStatus(statusRes);

        if (list.length > 0) {
          const detail = await apiFetch<{ conversation: Conversation }>(`/conversations/${list[0].id}`);
          if (active) {
            setActiveConv(detail.conversation);
            setSelectedMaterialIds(detail.conversation.selected_material_ids || []);
            setMode(detail.conversation.explanation_mode);
          }
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Gagal memuat AI Assistant.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectConversation = async (id: number) => {
    try {
      const detail = await apiFetch<{ conversation: Conversation }>(`/conversations/${id}`);
      setActiveConv(detail.conversation);
      setSelectedMaterialIds(detail.conversation.selected_material_ids || []);
      setMode(detail.conversation.explanation_mode);
      setCourseId(detail.conversation.course_id ? String(detail.conversation.course_id) : "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuka percakapan.");
    }
  };

  const createNewConversation = async () => {
    setError(null);
    try {
      const res = await apiFetch<{ conversation: Conversation }>("/conversations", {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId ? Number(courseId) : null,
          explanation_mode: mode,
          selected_material_ids: selectedMaterialIds,
        }),
      });
      setActiveConv(res.conversation);
      setConversations((prev) => [res.conversation, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat percakapan baru.");
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await apiFetch(`/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConv?.id === id) {
        setActiveConv(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus percakapan.");
    }
  };

  const toggleMaterial = (id: number) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setSending(true);
    setError(null);

    try {
      let targetConv = activeConv;
      if (!targetConv) {
        const created = await apiFetch<{ conversation: Conversation }>("/conversations", {
          method: "POST",
          body: JSON.stringify({
            course_id: courseId ? Number(courseId) : null,
            explanation_mode: mode,
            selected_material_ids: selectedMaterialIds,
          }),
        });
        targetConv = created.conversation;
      }

      const res = await apiFetch<{
        user_message: ChatMessage;
        assistant_message: ChatMessage;
        conversation: Conversation;
      }>(`/conversations/${targetConv.id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: prompt.trim(),
          explanation_mode: mode,
          selected_material_ids: selectedMaterialIds,
        }),
      });

      const nextMessages = [
        ...(targetConv.messages || []),
        res.user_message,
        res.assistant_message,
      ];
      setActiveConv({ ...res.conversation, messages: nextMessages });
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== res.conversation.id);
        return [res.conversation, ...filtered];
      });
      setPrompt("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim pesan ke AI.");
    } finally {
      setSending(false);
    }
  };

  const filteredMaterials = courseId
    ? materials.filter((m) => String(m.course_id) === courseId)
    : materials;

  return (
    <AppShell
      title="AI Academic Assistant"
      subtitle="Diskusi dan bedah materi kuliah berbasis dokumen Anda dengan sitasi sumber."
      actions={
        <Button size="sm" onClick={createNewConversation}>
          <MessageSquarePlus className="h-4 w-4" />
          Percakapan Baru
        </Button>
      }
    >
      {aiStatus && !aiStatus.configured && (
        <div className="mb-4">
          <AlertBanner
            tone="info"
            message={`AI Provider (${aiStatus.provider.toUpperCase()}) belum memiliki API key di backend/.env. Tambahkan GEMINI_API_KEY atau OPENAI_API_KEY agar asisten dapat menjawab secara langsung.`}
          />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left Panel: Conversations & Context */}
          <div className="space-y-4 lg:col-span-4">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-white">Konteks Materi & Mode</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Filter Mata Kuliah</label>
                  <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    <option value="">Semua Mata Kuliah</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">Mode Penjelasan</label>
                  <Select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as Conversation["explanation_mode"])}
                  >
                    <option value="concise">Ringkas</option>
                    <option value="beginner">Bertahap untuk Pemula</option>
                    <option value="deep">Mendalam</option>
                    <option value="examples">Dengan Contoh</option>
                    <option value="exam_prep">Persiapan Ujian</option>
                  </Select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">
                    Dokumen Sumber ({selectedMaterialIds.length} dipilih)
                  </label>
                  {filteredMaterials.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Belum ada materi berstatus completed.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                      {filteredMaterials.map((mat) => (
                        <label
                          key={mat.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#1e2948] bg-[#080d1d] px-2.5 py-1.5 text-xs text-slate-200 hover:border-violet-500/40"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMaterialIds.includes(mat.id)}
                            onChange={() => toggleMaterial(mat.id)}
                            className="rounded border-slate-600 accent-violet-600"
                          />
                          <span className="truncate">{mat.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-white">Riwayat Percakapan</h2>
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada riwayat diskusi.</p>
              ) : (
                <div className="max-h-72 space-y-1.5 overflow-y-auto">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                        activeConv?.id === conv.id
                          ? "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/40"
                          : "bg-[#080d1d] text-slate-300 hover:bg-[#131d3b]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectConversation(conv.id)}
                        className="min-w-0 flex-1 truncate text-left font-medium"
                      >
                        {conv.title}
                      </button>
                      <button
                        type="button"
                        aria-label="Hapus percakapan"
                        onClick={() => handleDeleteConversation(conv.id)}
                        className="ml-2 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel: Chat */}
          <Card className="flex h-[680px] flex-col lg:col-span-8">
            <div className="mb-3 flex items-center justify-between border-b border-[#1c2747] pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">
                  {activeConv?.title || "Diskusi Akademik"}
                </span>
              </div>
              <Badge tone="blue">{mode}</Badge>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {!activeConv?.messages?.length ? (
                <EmptyState
                  icon={<BookOpen className="h-6 w-6" />}
                  title="Mulai tanya jawab berbasis materi"
                  description="Pilih dokumen kuliah di panel kiri lalu tanyakan konsep, ringkasan, atau latihan soal."
                />
              ) : (
                activeConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-4 text-sm ${
                      msg.role === "user"
                        ? "ml-8 border border-violet-500/30 bg-violet-600/15 text-slate-100"
                        : "mr-4 border border-[#243154] bg-[#080d1d] text-slate-200"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {msg.role === "user" ? "Anda" : "StudyNest"}
                      </span>
                      {msg.metadata?.used_documents && (
                        <Badge tone="emerald">Berbasis Dokumen</Badge>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 border-t border-[#1d2847] pt-2.5">
                        <p className="mb-1.5 text-xs font-semibold text-blue-300">
                          Sumber Dokumen Terkait:
                        </p>
                        <div className="space-y-1.5">
                          {msg.citations.map((cit, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-[#1f2c50] bg-[#0d1428] px-2.5 py-1.5 text-xs"
                            >
                              <span className="font-medium text-violet-300">
                                {cit.material_title}
                                {cit.page_number ? ` · Hal. ${cit.page_number}` : ""}
                              </span>
                              <p className="mt-0.5 text-slate-400 line-clamp-2">{cit.excerpt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-[#1c2747] pt-3">
              <Textarea
                rows={2}
                placeholder="Tanyakan materi kuliah atau minta penjelasan konsep..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend(e);
                  }
                }}
              />
              <Button type="submit" disabled={sending || !prompt.trim()} className="self-end">
                <Send className="h-4 w-4" />
                {sending ? "..." : "Kirim"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
