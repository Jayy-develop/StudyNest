<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Material;
use App\Models\QuizAttempt;
use App\Models\Reminder;
use App\Models\Schedule;
use App\Models\StudySession;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tz = $user->timezone ?: 'Asia/Jakarta';
        $now = Carbon::now($tz);
        $todayIso = $now->dayOfWeekIso;
        $todayDate = $now->toDateString();

        $todaySchedules = Schedule::query()
            ->with('course:id,name,code,color')
            ->where('user_id', $user->id)
            ->where(function ($q) use ($todayIso, $todayDate) {
                $q->where(fn ($sub) => $sub->where('is_recurring', true)->where('day_of_week', $todayIso))
                    ->orWhere(fn ($sub) => $sub->where('is_recurring', false)->whereDate('specific_date', $todayDate));
            })
            ->orderBy('start_time')
            ->get();

        $upcomingTasks = Task::query()
            ->with('course:id,name,code,color')
            ->where('user_id', $user->id)
            ->where('status', '!=', 'completed')
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->limit(6)
            ->get();

        $upcomingAssessments = Schedule::query()
            ->with('course:id,name,code,color')
            ->where('user_id', $user->id)
            ->whereIn('type', ['exam', 'lab'])
            ->where(function ($q) use ($todayDate) {
                $q->where('is_recurring', true)
                    ->orWhereDate('specific_date', '>=', $todayDate);
            })
            ->orderBy('specific_date')
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        $totalCourses = Course::where('user_id', $user->id)->count();
        $totalMaterials = Material::where('user_id', $user->id)->count();
        $completedMaterials = Material::where('user_id', $user->id)->where('status', 'completed')->count();
        $totalTasks = Task::where('user_id', $user->id)->count();
        $completedTasks = Task::where('user_id', $user->id)->where('status', 'completed')->count();
        $completedSessions = StudySession::where('user_id', $user->id)->where('status', 'completed')->count();
        $approvedSessions = StudySession::where('user_id', $user->id)->whereIn('status', ['approved', 'completed'])->count();
        $averageQuizScore = QuizAttempt::where('user_id', $user->id)->whereNotNull('submitted_at')->avg('score');

        $recentMaterials = Material::with('course:id,name,color')
            ->where('user_id', $user->id)
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn (Material $m) => [
                'type' => 'material',
                'title' => "Materi: {$m->title}",
                'subtitle' => ($m->course?->name ?? 'Tanpa mata kuliah')." · {$m->status}",
                'timestamp' => $m->created_at?->toIso8601String(),
            ]);

        $recentAttempts = QuizAttempt::with('quiz:id,title')
            ->where('user_id', $user->id)
            ->latest('submitted_at')
            ->limit(3)
            ->get()
            ->map(fn (QuizAttempt $a) => [
                'type' => 'quiz_attempt',
                'title' => 'Kuis: '.($a->quiz?->title ?? 'Latihan'),
                'subtitle' => "Skor {$a->score}% ({$a->correct_count}/{$a->total_questions} benar)",
                'timestamp' => $a->submitted_at?->toIso8601String(),
            ]);

        $recentActivity = $recentMaterials
            ->concat($recentAttempts)
            ->sortByDesc('timestamp')
            ->take(6)
            ->values();

        $courses = Course::query()
            ->where('user_id', $user->id)
            ->select('id', 'name', 'code', 'color')
            ->latest()
            ->limit(8)
            ->get();

        $weekDays = collect(range(6, 0))->map(fn (int $offset) => $now->copy()->subDays($offset)->startOfDay());
        $weeklyMatrix = $courses->take(5)->map(function (Course $course) use ($weekDays, $user) {
            $cells = $weekDays->map(function (Carbon $day) use ($course, $user) {
                $dateStr = $day->toDateString();
                $iso = $day->dayOfWeekIso;

                $schedCount = Schedule::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->where(fn ($q) => $q
                        ->where(fn ($s) => $s->where('is_recurring', true)->where('day_of_week', $iso))
                        ->orWhere(fn ($s) => $s->where('is_recurring', false)->whereDate('specific_date', $dateStr)))
                    ->count();

                $taskCount = Task::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->whereDate('due_at', $dateStr)
                    ->count();

                $sessionCount = StudySession::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->whereDate('session_date', $dateStr)
                    ->whereIn('status', ['approved', 'completed'])
                    ->count();

                $intensity = min(3, $schedCount + $taskCount + $sessionCount);

                return [
                    'date' => $dateStr,
                    'day_label' => $day->format('d'),
                    'intensity' => $intensity,
                ];
            })->values();

            return [
                'course_id' => $course->id,
                'label' => $course->code ?: mb_substr($course->name, 0, 5),
                'course_name' => $course->name,
                'cells' => $cells,
            ];
        })->values();

        $pendingReminders = Reminder::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('remind_at', '<=', $now->copy()->addDays(2))
            ->orderBy('remind_at')
            ->limit(5)
            ->get();

        $recommendations = $this->buildRecommendations(
            $totalCourses,
            $completedMaterials,
            $upcomingTasks->count(),
            $upcomingAssessments->count(),
            $approvedSessions,
            $upcomingTasks->first(),
            $upcomingAssessments->first()
        );

        return response()->json([
            'greeting' => $this->greetingForHour($now->hour).', '.$user->name,
            'today_date' => $todayDate,
            'courses' => $courses,
            'weekly_matrix' => $weeklyMatrix,
            'today_schedules' => $todaySchedules,
            'upcoming_tasks' => $upcomingTasks,
            'upcoming_assessments' => $upcomingAssessments,
            'pending_reminders' => $pendingReminders,
            'progress' => [
                'courses_count' => $totalCourses,
                'materials_count' => $totalMaterials,
                'completed_materials_count' => $completedMaterials,
                'tasks_total' => $totalTasks,
                'tasks_completed' => $completedTasks,
                'study_sessions_total' => $approvedSessions,
                'study_sessions_completed' => $completedSessions,
                'average_quiz_score' => $averageQuizScore !== null ? round((float) $averageQuizScore, 1) : null,
            ],
            'recent_activity' => $recentActivity,
            'recommendations' => $recommendations,
        ]);
    }

    private function greetingForHour(int $hour): string
    {
        return match (true) {
            $hour < 11 => 'Selamat pagi',
            $hour < 15 => 'Selamat siang',
            $hour < 18 => 'Selamat sore',
            default => 'Selamat malam',
        };
    }

    /**
     * @return array<int, array{title: string, description: string, action_href: string, action_label: string}>
     */
    private function buildRecommendations(
        int $coursesCount,
        int $completedMaterials,
        int $openTasksCount,
        int $assessmentsCount,
        int $approvedSessions,
        ?Task $nextTask,
        ?Schedule $nextAssessment
    ): array {
        $items = [];

        if ($coursesCount === 0) {
            $items[] = [
                'title' => 'Tambahkan mata kuliah pertama Anda',
                'description' => 'Mata kuliah menjadi pusat integrasi untuk materi, jadwal, tugas, kuis, dan rencana belajar.',
                'action_href' => '/courses',
                'action_label' => 'Buka My Courses',
            ];
        }

        if ($coursesCount > 0 && $completedMaterials === 0) {
            $items[] = [
                'title' => 'Unggah modul atau slide kuliah',
                'description' => 'Upload PDF, DOCX, atau PPTX agar AI Academic Assistant dan AI Quiz dapat membantu belajar dari sumber asli.',
                'action_href' => '/materials',
                'action_label' => 'Upload Materi',
            ];
        }

        if ($nextTask !== null) {
            $dueLabel = $nextTask->due_at ? ' (deadline '.$nextTask->due_at->format('d M H:i').')' : '';
            $items[] = [
                'title' => 'Prioritaskan tugas: '.$nextTask->title,
                'description' => 'Anda memiliki '.$openTasksCount.' tugas aktif'.$dueLabel.'. Pecah menjadi sesi fokus di Study Planner.',
                'action_href' => '/tasks',
                'action_label' => 'Lihat Tugas',
            ];
        }

        if ($nextAssessment !== null && $approvedSessions === 0) {
            $items[] = [
                'title' => 'Buat rencana belajar untuk '.$nextAssessment->title,
                'description' => 'Ada '.$assessmentsCount.' agenda ujian/praktikum mendatang. Susun sesi belajar otomatis tanpa bentrok jadwal.',
                'action_href' => '/planner',
                'action_label' => 'Buka Study Planner',
            ];
        }

        if ($completedMaterials > 0 && $items === []) {
            $items[] = [
                'title' => 'Uji pemahaman dengan AI Quiz',
                'description' => 'Materi Anda sudah siap dipelajari. Buat latihan soal pilihan ganda atau esai untuk mengecek penguasaan konsep.',
                'action_href' => '/quiz',
                'action_label' => 'Buat Kuis',
            ];
        }

        return $items;
    }
}
