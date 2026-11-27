<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Reminder;
use App\Models\Task;
use App\Support\OwnsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    use OwnsResource;

    public function index(Request $request): JsonResponse
    {
        $query = Task::query()
            ->with('course:id,name,code,color')
            ->where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->integer('course_id'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', (string) $request->string('priority'));
        }

        if ($request->filled('search')) {
            $search = '%'.mb_strtolower((string) $request->string('search')).'%';
            $query->whereRaw('LOWER(title) LIKE ?', [$search]);
        }

        $sort = (string) $request->string('sort', 'deadline');
        if ($sort === 'priority') {
            $query->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
                ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
                ->orderBy('due_at');
        } else {
            $query->orderByRaw("CASE status WHEN 'completed' THEN 1 ELSE 0 END")
                ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
                ->orderBy('due_at');
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 30))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'due_at' => ['nullable', 'date'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'status' => ['nullable', 'in:todo,in_progress,completed'],
            'estimated_minutes' => ['nullable', 'integer', 'min:5', 'max:1440'],
            'reminder_minutes_before' => ['nullable', 'integer', 'min:5', 'max:2880'],
        ]);

        if (! empty($validated['course_id'])) {
            $course = Course::findOrFail($validated['course_id']);
            $this->authorizeOwnership($request, $course);
        }

        $status = $validated['status'] ?? 'todo';
        $task = Task::create([
            'user_id' => $request->user()->id,
            'course_id' => $validated['course_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_at' => $validated['due_at'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'status' => $status,
            'estimated_minutes' => $validated['estimated_minutes'] ?? null,
            'completed_at' => $status === 'completed' ? now() : null,
        ]);

        $this->syncReminder($request->user()->id, $task, $validated['reminder_minutes_before'] ?? 60);

        return response()->json([
            'task' => $task->load('course:id,name,code,color'),
        ], 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorizeOwnership($request, $task);

        $validated = $request->validate([
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'due_at' => ['nullable', 'date'],
            'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            'status' => ['sometimes', 'in:todo,in_progress,completed'],
            'estimated_minutes' => ['nullable', 'integer', 'min:5', 'max:1440'],
            'reminder_minutes_before' => ['nullable', 'integer', 'min:5', 'max:2880'],
        ]);

        if (! empty($validated['course_id'])) {
            $course = Course::findOrFail($validated['course_id']);
            $this->authorizeOwnership($request, $course);
        }

        if (isset($validated['status'])) {
            $validated['completed_at'] = $validated['status'] === 'completed' ? now() : null;
        }

        $task->update(collect($validated)->except(['reminder_minutes_before'])->all());

        if (array_key_exists('due_at', $validated) || array_key_exists('status', $validated) || array_key_exists('reminder_minutes_before', $validated)) {
            $this->syncReminder($request->user()->id, $task->fresh(), $validated['reminder_minutes_before'] ?? 60);
        }

        return response()->json([
            'task' => $task->fresh('course:id,name,code,color'),
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeOwnership($request, $task);
        $task->reminders()->delete();
        $task->delete();

        return response()->json([
            'message' => 'Tugas berhasil dihapus.',
        ]);
    }

    private function syncReminder(int $userId, Task $task, ?int $minutesBefore): void
    {
        $task->reminders()->delete();

        if ($minutesBefore === null || ! $task->due_at || $task->status === 'completed') {
            return;
        }

        $remindAt = $task->due_at->copy()->subMinutes($minutesBefore);
        if ($remindAt->isFuture()) {
            Reminder::create([
                'user_id' => $userId,
                'remindable_type' => Task::class,
                'remindable_id' => $task->id,
                'title' => "Deadline Tugas: {$task->title}",
                'remind_at' => $remindAt,
                'minutes_before' => $minutesBefore,
                'channel' => 'in_app',
                'status' => 'pending',
            ]);
        }
    }
}
