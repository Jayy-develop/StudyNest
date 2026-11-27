<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\StudyPlan;
use App\Models\StudySession;
use App\Services\Academic\ScheduleConflictService;
use App\Services\Academic\StudyPlannerService;
use App\Support\OwnsResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyPlannerController extends Controller
{
    use OwnsResource;

    public function index(Request $request): JsonResponse
    {
        $plans = StudyPlan::query()
            ->with(['sessions.course:id,name,code,color', 'sessions.task:id,title,due_at', 'sessions.material:id,title'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return response()->json($plans);
    }

    public function generate(Request $request, StudyPlannerService $planner): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:200'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'daily_study_minutes' => ['nullable', 'integer', 'min:30', 'max:480'],
            'preferred_study_time' => ['nullable', 'in:morning,afternoon,evening,night'],
            'goal' => ['nullable', 'string', 'max:500'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['integer', 'exists:courses,id'],
        ]);

        if (! empty($validated['course_ids'])) {
            $ownedCount = Course::where('user_id', $request->user()->id)
                ->whereIn('id', $validated['course_ids'])
                ->count();
            if ($ownedCount !== count(array_unique($validated['course_ids']))) {
                abort(403, 'Sebagian mata kuliah yang dipilih bukan milik Anda.');
            }
        }

        if (Carbon::parse($validated['start_date'])->diffInDays(Carbon::parse($validated['end_date'])) > 30) {
            return response()->json([
                'message' => 'Rentang rencana belajar maksimal 30 hari per rencana.',
            ], 422);
        }

        $plan = $planner->generatePlan($request->user(), $validated);

        return response()->json([
            'plan' => $plan,
        ], 201);
    }

    public function show(Request $request, StudyPlan $studyPlan): JsonResponse
    {
        $this->authorizeOwnership($request, $studyPlan);

        return response()->json([
            'plan' => $studyPlan->load(['sessions.course:id,name,code,color', 'sessions.task:id,title,due_at', 'sessions.material:id,title']),
        ]);
    }

    public function approvePlan(Request $request, StudyPlan $studyPlan): JsonResponse
    {
        $this->authorizeOwnership($request, $studyPlan);

        $studyPlan->update(['status' => 'approved']);
        $studyPlan->sessions()
            ->where('status', 'proposed')
            ->update(['status' => 'approved']);

        return response()->json([
            'plan' => $studyPlan->fresh(['sessions.course:id,name,code,color', 'sessions.task:id,title,due_at', 'sessions.material:id,title']),
        ]);
    }

    public function updateSession(
        Request $request,
        StudySession $studySession,
        ScheduleConflictService $conflictService
    ): JsonResponse {
        $this->authorizeOwnership($request, $studySession);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'topic' => ['nullable', 'string', 'max:200'],
            'session_date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'status' => ['sometimes', 'in:proposed,approved,rejected,completed,skipped'],
        ]);

        if (isset($validated['session_date']) || isset($validated['start_time']) || isset($validated['end_time'])) {
            $date = $validated['session_date'] ?? $studySession->session_date?->toDateString();
            $start = $validated['start_time'] ?? substr((string) $studySession->start_time, 0, 5);
            $end = $validated['end_time'] ?? substr((string) $studySession->end_time, 0, 5);

            $conflicts = $conflictService->findConflicts($request->user()->id, [
                'is_recurring' => false,
                'specific_date' => $date,
                'start_time' => $start,
                'end_time' => $end,
            ]);

            if ($conflicts->isNotEmpty()) {
                return response()->json([
                    'message' => 'Waktu sesi belajar bentrok dengan jadwal akademik Anda.',
                    'conflicts' => $conflicts,
                ], 422);
            }

            $validated['duration_minutes'] = max(15, $conflictService->toMinutes($end) - $conflictService->toMinutes($start));
        }

        $studySession->update($validated);

        if ($studySession->studyPlan && $studySession->status === 'approved' && $studySession->studyPlan->status === 'draft') {
            $studySession->studyPlan->update(['status' => 'active']);
        }

        return response()->json([
            'session' => $studySession->fresh(['course:id,name,code,color', 'task:id,title,due_at', 'material:id,title']),
        ]);
    }

    public function rescheduleSession(
        Request $request,
        StudySession $studySession,
        StudyPlannerService $planner
    ): JsonResponse {
        $this->authorizeOwnership($request, $studySession);

        $updated = $planner->rescheduleSession($studySession);
        if (! $updated) {
            return response()->json([
                'message' => 'Tidak ditemukan slot kosong dalam 7 hari ke depan untuk menjadwalkan ulang sesi ini.',
            ], 422);
        }

        return response()->json([
            'session' => $updated,
        ]);
    }

    public function destroy(Request $request, StudyPlan $studyPlan): JsonResponse
    {
        $this->authorizeOwnership($request, $studyPlan);
        $studyPlan->delete();

        return response()->json([
            'message' => 'Rencana belajar berhasil dihapus.',
        ]);
    }
}
