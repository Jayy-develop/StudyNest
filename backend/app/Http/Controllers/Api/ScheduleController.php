<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Reminder;
use App\Models\Schedule;
use App\Services\Academic\ScheduleConflictService;
use App\Support\OwnsResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    use OwnsResource;

    public function index(Request $request): JsonResponse
    {
        $schedules = Schedule::query()
            ->with('course:id,name,code,color')
            ->where('user_id', $request->user()->id)
            ->when($request->filled('course_id'), fn ($q) => $q->where('course_id', $request->integer('course_id')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', (string) $request->string('type')))
            ->orderByDesc('is_recurring')
            ->orderBy('day_of_week')
            ->orderBy('specific_date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'data' => $schedules,
        ]);
    }

    public function store(Request $request, ScheduleConflictService $conflictService): JsonResponse
    {
        $validated = $this->validateSchedule($request);

        if (! empty($validated['course_id'])) {
            $course = Course::findOrFail($validated['course_id']);
            $this->authorizeOwnership($request, $course);
        }

        $conflicts = $conflictService->findConflicts($request->user()->id, $validated);
        if ($conflicts->isNotEmpty() && ! $request->boolean('allow_conflict')) {
            return response()->json([
                'message' => 'Jadwal bentrok dengan agenda yang sudah ada.',
                'conflicts' => $conflicts,
            ], 422);
        }

        $schedule = Schedule::create([
            'user_id' => $request->user()->id,
            'course_id' => $validated['course_id'] ?? null,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'is_recurring' => (bool) ($validated['is_recurring'] ?? true),
            'day_of_week' => $validated['day_of_week'] ?? null,
            'specific_date' => $validated['specific_date'] ?? null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'location' => $validated['location'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->syncReminder($request->user()->id, $schedule, $validated['reminder_minutes_before'] ?? null);

        return response()->json([
            'schedule' => $schedule->load('course:id,name,code,color'),
            'conflicts' => $conflicts,
        ], 201);
    }

    public function update(Request $request, Schedule $schedule, ScheduleConflictService $conflictService): JsonResponse
    {
        $this->authorizeOwnership($request, $schedule);

        $validated = $this->validateSchedule($request, true);
        if (! empty($validated['course_id'])) {
            $course = Course::findOrFail($validated['course_id']);
            $this->authorizeOwnership($request, $course);
        }

        $merged = array_merge($schedule->toArray(), $validated);
        $conflicts = $conflictService->findConflicts($request->user()->id, $merged, $schedule->id);
        if ($conflicts->isNotEmpty() && ! $request->boolean('allow_conflict')) {
            return response()->json([
                'message' => 'Perubahan jadwal bentrok dengan agenda lain.',
                'conflicts' => $conflicts,
            ], 422);
        }

        $schedule->update(collect($validated)->except(['reminder_minutes_before', 'allow_conflict'])->all());

        if (array_key_exists('reminder_minutes_before', $validated)) {
            $this->syncReminder($request->user()->id, $schedule, $validated['reminder_minutes_before']);
        }

        return response()->json([
            'schedule' => $schedule->fresh('course:id,name,code,color'),
        ]);
    }

    public function destroy(Request $request, Schedule $schedule): JsonResponse
    {
        $this->authorizeOwnership($request, $schedule);
        $schedule->reminders()->delete();
        $schedule->delete();

        return response()->json([
            'message' => 'Jadwal berhasil dihapus.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateSchedule(Request $request, bool $isUpdate = false): array
    {
        $req = $isUpdate ? 'sometimes' : 'required';

        return $request->validate([
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'title' => [$req, 'string', 'max:200'],
            'type' => [$req, 'in:lecture,lab,exam,activity'],
            'is_recurring' => ['sometimes', 'boolean'],
            'day_of_week' => ['nullable', 'integer', 'min:1', 'max:7', 'required_if:is_recurring,true'],
            'specific_date' => ['nullable', 'date', 'required_if:is_recurring,false'],
            'start_time' => [$req, 'date_format:H:i'],
            'end_time' => [$req, 'date_format:H:i', 'after:start_time'],
            'location' => ['nullable', 'string', 'max:160'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'reminder_minutes_before' => ['nullable', 'integer', 'min:5', 'max:1440'],
            'allow_conflict' => ['sometimes', 'boolean'],
        ]);
    }

    private function syncReminder(int $userId, Schedule $schedule, ?int $minutesBefore): void
    {
        $schedule->reminders()->delete();

        if ($minutesBefore === null || $schedule->is_recurring || ! $schedule->specific_date) {
            return;
        }

        $eventTime = Carbon::parse($schedule->specific_date->toDateString().' '.$schedule->start_time);
        $remindAt = $eventTime->copy()->subMinutes($minutesBefore);

        if ($remindAt->isFuture()) {
            Reminder::create([
                'user_id' => $userId,
                'remindable_type' => Schedule::class,
                'remindable_id' => $schedule->id,
                'title' => "Pengingat {$schedule->type}: {$schedule->title}",
                'remind_at' => $remindAt,
                'minutes_before' => $minutesBefore,
                'channel' => 'in_app',
                'status' => 'pending',
            ]);
        }
    }
}
