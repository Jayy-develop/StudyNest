<?php

namespace App\Services\Academic;

use App\Models\Course;
use App\Models\Material;
use App\Models\QuizAttempt;
use App\Models\Schedule;
use App\Models\StudyPlan;
use App\Models\StudySession;
use App\Models\Task;
use App\Models\User;
use App\Services\AI\AiManager;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Throwable;

class StudyPlannerService
{
    public function __construct(
        private readonly ScheduleConflictService $conflictService,
        private readonly AiManager $aiManager,
    ) {}

    /**
     * Generate a draft StudyPlan without modifying or overwriting existing schedules.
     *
     * @param  array<string, mixed>  $options
     */
    public function generatePlan(User $user, array $options): StudyPlan
    {
        $startDate = Carbon::parse((string) $options['start_date'])->startOfDay();
        $endDate = Carbon::parse((string) $options['end_date'])->startOfDay();
        $dailyMinutes = (int) ($options['daily_study_minutes'] ?? $user->daily_study_minutes ?? 120);
        $preferredWindow = (string) ($options['preferred_study_time'] ?? $user->preferred_study_time ?? 'evening');
        $courseIds = $options['course_ids'] ?? null;

        $tasks = Task::query()
            ->with('course:id,name')
            ->where('user_id', $user->id)
            ->where('status', '!=', 'completed')
            ->when(is_array($courseIds) && $courseIds !== [], fn ($q) => $q->whereIn('course_id', $courseIds))
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->get();

        $exams = Schedule::query()
            ->with('course:id,name')
            ->where('user_id', $user->id)
            ->whereIn('type', ['exam', 'lab'])
            ->whereDate('specific_date', '>=', $startDate->toDateString())
            ->when(is_array($courseIds) && $courseIds !== [], fn ($q) => $q->whereIn('course_id', $courseIds))
            ->orderBy('specific_date')
            ->get();

        $courses = Course::query()
            ->where('user_id', $user->id)
            ->when(is_array($courseIds) && $courseIds !== [], fn ($q) => $q->whereIn('id', $courseIds))
            ->get();

        $materials = Material::query()
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->when(is_array($courseIds) && $courseIds !== [], fn ($q) => $q->whereIn('course_id', $courseIds))
            ->latest()
            ->get()
            ->groupBy('course_id');

        $weakTopicsByCourse = $this->collectWeakTopics($user->id);

        $workQueue = $this->buildPrioritizedTopics($tasks, $exams, $courses, $materials, $weakTopicsByCourse);

        $plan = StudyPlan::create([
            'user_id' => $user->id,
            'title' => (string) ($options['title'] ?? 'Rencana Belajar '.$startDate->format('d M').' - '.$endDate->format('d M')),
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'status' => 'draft',
            'goal' => $options['goal'] ?? null,
            'preferences' => [
                'daily_study_minutes' => $dailyMinutes,
                'preferred_study_time' => $preferredWindow,
            ],
            'ai_rationale' => 'Disusun berdasarkan tenggat tugas, jadwal ujian/praktikum, materi aktif, serta ketersediaan slot bebas tanpa menimpa jadwal yang sudah ada.',
        ]);

        if ($workQueue === []) {
            return $plan->load('sessions.course', 'sessions.task', 'sessions.material');
        }

        $windowRange = $this->preferredHourRange($preferredWindow);
        $queueIndex = 0;
        $totalItems = count($workQueue);

        foreach (CarbonPeriod::create($startDate, $endDate) as $day) {
            $remainingToday = $dailyMinutes;
            $slotStartMinutes = $windowRange['start'];
            $maxSlotEnd = $windowRange['end'];

            while ($remainingToday >= 30 && $slotStartMinutes + 30 <= $maxSlotEnd) {
                $sessionDuration = min(60, $remainingToday);
                $slot = $this->findFreeSlot(
                    $user->id,
                    $day->toDateString(),
                    $slotStartMinutes,
                    $sessionDuration,
                    $maxSlotEnd
                );

                if ($slot === null) {
                    break;
                }

                $item = $workQueue[$queueIndex % $totalItems];
                $queueIndex++;

                StudySession::create([
                    'study_plan_id' => $plan->id,
                    'user_id' => $user->id,
                    'course_id' => $item['course_id'],
                    'task_id' => $item['task_id'],
                    'material_id' => $item['material_id'],
                    'title' => $item['title'],
                    'topic' => $item['topic'],
                    'session_date' => $day->toDateString(),
                    'start_time' => $this->formatMinutes($slot['start']),
                    'end_time' => $this->formatMinutes($slot['end']),
                    'duration_minutes' => $slot['end'] - $slot['start'],
                    'priority' => $item['priority'],
                    'status' => 'proposed',
                    'rationale' => $item['rationale'],
                ]);

                $remainingToday -= ($slot['end'] - $slot['start']);
                $slotStartMinutes = $slot['end'] + 15;
            }
        }

        $this->enrichWithAiRationaleIfConfigured($plan);

        return $plan->fresh(['sessions.course', 'sessions.task', 'sessions.material']);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildPrioritizedTopics($tasks, $exams, $courses, $materialsByCourse, array $weakTopics): array
    {
        $items = [];

        foreach ($exams as $exam) {
            $courseMaterials = $materialsByCourse->get($exam->course_id);
            $items[] = [
                'course_id' => $exam->course_id,
                'task_id' => null,
                'material_id' => $courseMaterials?->first()?->id,
                'title' => 'Persiapan '.$exam->title,
                'topic' => $weakTopics[$exam->course_id][0] ?? ($exam->course?->name ?? 'Review Materi Ujian'),
                'priority' => 'high',
                'score' => 100,
                'rationale' => 'Mendekati jadwal '.($exam->type === 'exam' ? 'ujian' : 'praktikum').' pada '.$exam->specific_date?->format('d M Y').'.',
            ];
        }

        foreach ($tasks as $task) {
            $urgency = match ($task->priority) {
                'urgent', 'high' => 90,
                'medium' => 70,
                default => 50,
            };
            if ($task->due_at && $task->due_at->diffInDays(now(), false) >= -3) {
                $urgency += 15;
            }

            $courseMaterials = $task->course_id ? $materialsByCourse->get($task->course_id) : null;
            $items[] = [
                'course_id' => $task->course_id,
                'task_id' => $task->id,
                'material_id' => $courseMaterials?->first()?->id,
                'title' => 'Kerjakan: '.$task->title,
                'topic' => $task->course?->name ?? 'Tugas Akademik',
                'priority' => in_array($task->priority, ['urgent', 'high'], true) ? 'high' : $task->priority,
                'score' => $urgency,
                'rationale' => $task->due_at
                    ? 'Deadline tugas pada '.$task->due_at->format('d M Y H:i').'.'
                    : 'Tugas aktif prioritas '.$task->priority.'.',
            ];
        }

        if ($items === []) {
            foreach ($courses as $course) {
                $courseMaterials = $materialsByCourse->get($course->id);
                $items[] = [
                    'course_id' => $course->id,
                    'task_id' => null,
                    'material_id' => $courseMaterials?->first()?->id,
                    'title' => 'Review Materi: '.$course->name,
                    'topic' => $weakTopics[$course->id][0] ?? 'Penguatan Konsep',
                    'priority' => 'medium',
                    'score' => 40,
                    'rationale' => 'Sesi belajar rutin untuk mata kuliah '.$course->name.'.',
                ];
            }
        }

        usort($items, fn (array $a, array $b) => $b['score'] <=> $a['score']);

        return $items;
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function collectWeakTopics(int $userId): array
    {
        $attempts = QuizAttempt::query()
            ->with('quiz:id,course_id')
            ->where('user_id', $userId)
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->limit(15)
            ->get();

        $byCourse = [];
        foreach ($attempts as $attempt) {
            $courseId = $attempt->quiz?->course_id;
            if (! $courseId || ! is_array($attempt->weak_topics)) {
                continue;
            }
            foreach ($attempt->weak_topics as $topic) {
                $byCourse[$courseId][] = (string) $topic;
            }
        }

        return $byCourse;
    }

    /**
     * @return array{start: int, end: int}|null
     */
    private function findFreeSlot(int $userId, string $date, int $startMin, int $duration, int $maxEnd): ?array
    {
        $cursor = $startMin;
        while ($cursor + $duration <= $maxEnd) {
            $end = $cursor + $duration;
            $conflicts = $this->conflictService->findConflicts($userId, [
                'is_recurring' => false,
                'specific_date' => $date,
                'start_time' => $this->formatMinutes($cursor),
                'end_time' => $this->formatMinutes($end),
            ]);

            if ($conflicts->isEmpty()) {
                return ['start' => $cursor, 'end' => $end];
            }

            $cursor += 30;
        }

        return null;
    }

    public function rescheduleSession(StudySession $session): ?StudySession
    {
        $user = $session->user;
        $plan = $session->studyPlan;
        if (! $user || ! $plan) {
            return null;
        }

        $windowRange = $this->preferredHourRange($user->preferred_study_time ?: 'evening');
        $startDay = Carbon::parse($session->session_date)->addDay();
        $endDay = Carbon::parse($plan->end_date)->max($startDay->copy()->addDays(7));

        foreach (CarbonPeriod::create($startDay, $endDay) as $day) {
            $slot = $this->findFreeSlot(
                $user->id,
                $day->toDateString(),
                $windowRange['start'],
                max(30, $session->duration_minutes),
                $windowRange['end']
            );

            if ($slot !== null) {
                $session->update([
                    'session_date' => $day->toDateString(),
                    'start_time' => $this->formatMinutes($slot['start']),
                    'end_time' => $this->formatMinutes($slot['end']),
                    'status' => 'proposed',
                    'rationale' => 'Dijadwalkan ulang otomatis karena sesi sebelumnya terlewat.',
                ]);

                return $session->fresh(['course:id,name,code,color', 'task:id,title,due_at', 'material:id,title']);
            }
        }

        return null;
    }

    /**
     * @return array{start: int, end: int}
     */
    private function preferredHourRange(string $preference): array
    {
        return match ($preference) {
            'morning' => ['start' => 7 * 60, 'end' => 12 * 60],
            'afternoon' => ['start' => 13 * 60, 'end' => 17 * 60 + 30],
            'night' => ['start' => 20 * 60, 'end' => 23 * 60],
            default => ['start' => 18 * 60 + 30, 'end' => 22 * 60],
        };
    }

    private function formatMinutes(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;

        return sprintf('%02d:%02d:00', $hours, $mins);
    }

    private function enrichWithAiRationaleIfConfigured(StudyPlan $plan): void
    {
        $provider = $this->aiManager->provider();
        if (! $provider->isConfigured()) {
            return;
        }

        try {
            $sessionsSummary = $plan->sessions()
                ->with('course:id,name')
                ->get()
                ->map(fn (StudySession $s) => "- {$s->session_date?->format('Y-m-d')} {$s->start_time}-{$s->end_time}: {$s->title} ({$s->priority})")
                ->implode("\n");

            if ($sessionsSummary === '') {
                return;
            }

            $summary = $provider->generateText(
                'Kamu adalah perencana belajar akademik mahasiswa. Berikan ringkasan strategi belajar singkat (maksimal 3 kalimat bahasa Indonesia) yang realistis dan memotivasi berdasarkan sesi yang dijadwalkan.',
                [['role' => 'user', 'content' => "Rencana belajar:\n{$sessionsSummary}"]],
                0.3,
                300
            );

            $plan->update(['ai_rationale' => $summary]);
        } catch (Throwable) {
            // Keep deterministic rationale if external AI call fails.
        }
    }
}
