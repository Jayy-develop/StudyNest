<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Support\OwnsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    use OwnsResource;

    public function index(Request $request): JsonResponse
    {
        $courses = Course::query()
            ->where('user_id', $request->user()->id)
            ->withCount([
                'materials',
                'schedules',
                'quizzes',
                'tasks as open_tasks_count' => fn ($q) => $q->where('status', '!=', 'completed'),
                'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'completed'),
            ])
            ->latest()
            ->paginate($request->integer('per_page', 24));

        return response()->json($courses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'code' => ['nullable', 'string', 'max:32'],
            'credits' => ['nullable', 'integer', 'min:1', 'max:12'],
            'lecturer' => ['nullable', 'string', 'max:120'],
            'semester' => ['nullable', 'string', 'max:40'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $course = Course::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'color' => $validated['color'] ?? '#6366f1',
        ]);

        return response()->json([
            'course' => $course,
        ], 201);
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        $this->authorizeOwnership($request, $course);

        $course->load([
            'materials' => fn ($q) => $q->latest(),
            'schedules' => fn ($q) => $q->orderBy('day_of_week')->orderBy('start_time'),
            'tasks' => fn ($q) => $q->orderBy('due_at'),
            'quizzes' => fn ($q) => $q->withCount('questions', 'attempts')->latest(),
            'studySessions' => fn ($q) => $q->orderBy('session_date')->orderBy('start_time'),
        ]);

        return response()->json([
            'course' => $course,
        ]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $this->authorizeOwnership($request, $course);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'code' => ['nullable', 'string', 'max:32'],
            'credits' => ['nullable', 'integer', 'min:1', 'max:12'],
            'lecturer' => ['nullable', 'string', 'max:120'],
            'semester' => ['nullable', 'string', 'max:40'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $course->update($validated);

        return response()->json([
            'course' => $course->fresh(),
        ]);
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        $this->authorizeOwnership($request, $course);
        $course->delete();

        return response()->json([
            'message' => 'Mata kuliah berhasil dihapus.',
        ]);
    }
}
