"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ListChecks, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Course, Material, Quiz, QuizAttempt } from "@/lib/types";
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

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  const [courseId, setCourseId] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [questionType, setQuestionType] = useState<"multiple_choice" | "essay" | "mixed">("multiple_choice");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [quizRes, courseRes, matRes] = await Promise.all([
        apiFetch<{ data: Quiz[] }>("/quizzes"),
        apiFetch<{ data: Course[] }>("/courses?per_page=100"),
        apiFetch<{ data: Material[] }>("/materials?status=completed&per_page=100"),
      ]);
      setQuizzes(quizRes.data || []);
      const courseList = courseRes.data || [];
      setCourses(courseList);
      setMaterials(matRes.data || []);
      if (!courseId && courseList.length > 0) {
        setCourseId(String(courseList[0].id));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat AI Quiz.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ data: Quiz[] }>("/quizzes"),
      apiFetch<{ data: Course[] }>("/courses?per_page=100"),
      apiFetch<{ data: Material[] }>("/materials?status=completed&per_page=100"),
    ])
      .then(([quizRes, courseRes, matRes]) => {
        if (!active) return;
        setQuizzes(quizRes.data || []);
        const courseList = courseRes.data || [];
        setCourses(courseList);
        setMaterials(matRes.data || []);
        if (courseList.length > 0) {
          setCourseId((prev) => prev || String(courseList[0].id));
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Gagal memuat AI Quiz.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openQuiz = async (id: number) => {
    setError(null);
    setLastAttempt(null);
    setAnswers({});
    try {
      const res = await apiFetch<{ quiz: Quiz }>(`/quizzes/${id}`);
      setActiveQuiz(res.quiz);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuka kuis.");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || selectedMaterials.length === 0) {
      setError("Pilih mata kuliah dan minimal satu materi yang sudah selesai diproses.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await apiFetch<{ quiz: Quiz }>("/quizzes/generate", {
        method: "POST",
        body: JSON.stringify({
          course_id: Number(courseId),
          material_ids: selectedMaterials,
          title: title || null,
          question_type: questionType,
          difficulty,
          question_count: Number(questionCount),
        }),
      });
      setActiveQuiz(res.quiz);
      setLastAttempt(null);
      setAnswers({});
      setTitle("");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat kuis AI.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz?.questions) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = activeQuiz.questions.map((q) => ({
        question_id: q.id,
        user_answer: answers[q.id] || "",
      }));

      const res = await apiFetch<{ attempt: QuizAttempt }>(`/quizzes/${activeQuiz.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      setLastAttempt(res.attempt);
      await openQuiz(activeQuiz.id);
      setLastAttempt(res.attempt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim jawaban kuis.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateQuestion = async (questionId: number) => {
    if (!activeQuiz) return;
    setRegeneratingId(questionId);
    setError(null);

    try {
      await apiFetch(`/quizzes/${activeQuiz.id}/questions/${questionId}/regenerate`, {
        method: "POST",
      });
      await openQuiz(activeQuiz.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal meregenerasi soal.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    try {
      await apiFetch(`/quizzes/${id}`, { method: "DELETE" });
      if (activeQuiz?.id === id) setActiveQuiz(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus kuis.");
    }
  };

  const courseMaterials = materials.filter((m) => String(m.course_id) === courseId);

  return (
    <AppShell
      title="AI Quiz"
      subtitle="Generate latihan soal pilihan ganda dan esai langsung dari materi kuliah Anda."
    >
      {error && (
        <div className="mb-4">
          <AlertBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Generator + Quiz List */}
        <div className="space-y-5 lg:col-span-4">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <h2 className="text-base font-semibold text-white">Buat Kuis Baru</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Mata Kuliah</label>
                <Select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setSelectedMaterials([]);
                  }}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">Materi Sumber</label>
                {courseMaterials.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada materi selesai di mata kuliah ini.</p>
                ) : (
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {courseMaterials.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          checked={selectedMaterials.includes(m.id)}
                          onChange={() =>
                            setSelectedMaterials((prev) =>
                              prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                            )
                          }
                          className="accent-violet-600"
                        />
                        <span className="truncate">{m.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Input
                placeholder="Judul kuis (opsional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={questionType}
                  onChange={(e) =>
                    setQuestionType(e.target.value as "multiple_choice" | "essay" | "mixed")
                  }
                >
                  <option value="multiple_choice">PG</option>
                  <option value="essay">Essay</option>
                  <option value="mixed">Campuran</option>
                </Select>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </Select>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={generating}>
                {generating ? "Menyusun soal..." : "Generate Kuis AI"}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-white">Daftar Kuis</h2>
            {loading ? (
              <LoadingSkeleton rows={3} />
            ) : quizzes.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada kuis dibuat.</p>
            ) : (
              <div className="space-y-2">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                      activeQuiz?.id === q.id
                        ? "border-violet-500/50 bg-violet-600/15"
                        : "border-[#1f2c50] bg-[#080d1d]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openQuiz(q.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate font-semibold text-slate-100">{q.title}</p>
                      <p className="text-slate-400">
                        {q.questions_count ?? 0} soal · {q.difficulty}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus kuis"
                      onClick={() => handleDeleteQuiz(q.id)}
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

        {/* Quiz Player & Evaluation */}
        <div className="lg:col-span-8">
          {!activeQuiz ? (
            <EmptyState
              icon={<ListChecks className="h-6 w-6" />}
              title="Pilih atau buat kuis untuk mulai latihan"
              description="Setiap soal ditandai sumber materinya dan dilengkapi pembahasan setelah dikerjakan."
            />
          ) : (
            <Card>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#1c2747] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{activeQuiz.title}</h2>
                    {activeQuiz.is_ai_generated && <Badge tone="violet">AI Generated</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeQuiz.course?.name} · Kesulitan: {activeQuiz.difficulty}
                  </p>
                </div>
                {lastAttempt && (
                  <Badge tone="emerald">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Skor: {lastAttempt.score}% ({lastAttempt.correct_count}/{lastAttempt.total_questions})
                  </Badge>
                )}
              </div>

              {lastAttempt && lastAttempt.weak_topics && lastAttempt.weak_topics.length > 0 && (
                <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <strong>Topik yang perlu diperkuat:</strong> {lastAttempt.weak_topics.join(", ")}
                </div>
              )}

              <form onSubmit={handleSubmitAttempt} className="space-y-5">
                {activeQuiz.questions?.map((q, idx) => {
                  const graded = lastAttempt?.answers?.find((a) => a.question_id === q.id);

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-[#243154] bg-[#080d1d] p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-violet-300">
                          Soal #{idx + 1} · {q.topic || "Konsep"}
                        </span>
                        <div className="flex items-center gap-2">
                          {q.source_reference && (
                            <Badge tone="blue">{q.source_reference}</Badge>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={regeneratingId === q.id}
                            onClick={() => handleRegenerateQuestion(q.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {regeneratingId === q.id ? "..." : "Regenerasi"}
                          </Button>
                        </div>
                      </div>

                      <p className="mb-3 text-sm font-medium text-white">{q.prompt}</p>

                      {q.type === "multiple_choice" && q.options ? (
                        <div className="space-y-2">
                          {q.options.map((opt) => (
                            <label
                              key={opt}
                              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#1f2c50] bg-[#0e1529] px-3 py-2 text-sm text-slate-200 hover:border-violet-500/50"
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                className="accent-violet-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Textarea
                          rows={3}
                          placeholder="Tulis jawaban esai Anda di sini..."
                          value={answers[q.id] || ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                        />
                      )}

                      {graded && (
                        <div
                          className={`mt-3 rounded-lg border p-3 text-xs ${
                            graded.is_correct
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                          }`}
                        >
                          <p className="font-semibold">
                            {graded.is_correct ? "Benar" : `Kurang tepat · Kunci: ${q.correct_answer}`}
                          </p>
                          {graded.ai_feedback && <p className="mt-1 whitespace-pre-wrap">{graded.ai_feedback}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Menilai..." : "Kirim & Nilai Jawaban"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
