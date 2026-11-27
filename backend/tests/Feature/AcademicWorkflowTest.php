<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AcademicWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_student_workflow_from_course_to_rag_quiz_schedule_task_and_planner(): void
    {
        Storage::fake('local');
        config()->set('ai.default', 'gemini');
        config()->set('ai.providers.gemini.api_key', 'test-gemini-key');

        Http::fake([
            '*embedContent*' => Http::response([
                'embedding' => ['values' => [0.25, 0.5, 0.75]],
            ], 200),
            '*generateContent*' => function ($request) {
                $payload = $request->data();
                $isJson = ($payload['generationConfig']['responseMimeType'] ?? null) === 'application/json';

                if ($isJson) {
                    return Http::response([
                        'candidates' => [[
                            'content' => [
                                'parts' => [[
                                    'text' => json_encode([
                                        'questions' => [[
                                            'type' => 'multiple_choice',
                                            'prompt' => 'Struktur data apa yang digunakan algoritma BFS?',
                                            'options' => ['A. Stack', 'B. Queue', 'C. Heap', 'D. Tree'],
                                            'correct_answer' => 'B. Queue',
                                            'explanation' => 'BFS menggunakan Queue untuk menelusuri simpul lapis demi lapis.',
                                            'topic' => 'Graph Traversal',
                                            'source_reference' => 'Modul Graph, Hal. 1',
                                        ]],
                                    ]),
                                ]],
                            ],
                        ]],
                    ], 200);
                }

                return Http::response([
                    'candidates' => [[
                        'content' => [
                            'parts' => [[
                                'text' => 'Berdasarkan Dokumen Anda [Modul Graph, Hal. 1]: BFS menggunakan Queue.',
                            ]],
                        ],
                    ]],
                ], 200);
            },
        ]);

        $user = User::factory()->create([
            'timezone' => 'Asia/Jakarta',
            'daily_study_minutes' => 120,
            'preferred_study_time' => 'evening',
        ]);

        // 1. Create Course
        $courseRes = $this->actingAs($user, 'sanctum')->postJson('/api/courses', [
            'name' => 'Struktur Data',
            'code' => 'IF204',
            'credits' => 3,
        ]);
        $courseRes->assertCreated();
        $courseId = $courseRes->json('course.id');

        // 2. Upload Material & verify processing
        $file = UploadedFile::fake()->createWithContent(
            'modul-graph.md',
            "# Modul Graph\nBreadth-First Search (BFS) menelusuri graph menggunakan Queue."
        );

        $materialRes = $this->actingAs($user, 'sanctum')->post('/api/materials', [
            'course_id' => $courseId,
            'title' => 'Modul Graph',
            'file' => $file,
        ], ['Accept' => 'application/json']);

        $materialRes->assertCreated();
        $materialId = $materialRes->json('material.id');

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/materials/{$materialId}")
            ->assertOk()
            ->assertJsonPath('material.status', 'completed');

        // 3. AI Academic Assistant with RAG citation
        $convRes = $this->actingAs($user, 'sanctum')->postJson('/api/conversations', [
            'course_id' => $courseId,
            'explanation_mode' => 'concise',
            'selected_material_ids' => [$materialId],
        ]);
        $convRes->assertCreated();
        $convId = $convRes->json('conversation.id');

        $msgRes = $this->actingAs($user, 'sanctum')->postJson("/api/conversations/{$convId}/messages", [
            'content' => 'Struktur data apa yang dipakai BFS?',
        ]);
        $msgRes->assertCreated()
            ->assertJsonPath('assistant_message.metadata.used_documents', true)
            ->assertJsonPath('assistant_message.citations.0.material_id', $materialId);

        // 4. AI Quiz generate & submit
        $quizRes = $this->actingAs($user, 'sanctum')->postJson('/api/quizzes/generate', [
            'course_id' => $courseId,
            'material_ids' => [$materialId],
            'question_type' => 'multiple_choice',
            'difficulty' => 'medium',
            'question_count' => 1,
        ]);
        $quizRes->assertCreated();
        $quizId = $quizRes->json('quiz.id');
        $questionId = $quizRes->json('quiz.questions.0.id');

        $attemptRes = $this->actingAs($user, 'sanctum')->postJson("/api/quizzes/{$quizId}/attempts", [
            'answers' => [[
                'question_id' => $questionId,
                'user_answer' => 'B. Queue',
            ]],
        ]);
        $attemptRes->assertCreated()
            ->assertJsonPath('attempt.correct_count', 1)
            ->assertJsonPath('attempt.score', 100);

        // 5. Smart Schedule conflict detection
        $this->actingAs($user, 'sanctum')->postJson('/api/schedules', [
            'course_id' => $courseId,
            'title' => 'Kuliah Struktur Data',
            'type' => 'lecture',
            'is_recurring' => true,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ])->assertCreated();

        $this->actingAs($user, 'sanctum')->postJson('/api/schedules', [
            'course_id' => $courseId,
            'title' => 'Praktikum Bentrok',
            'type' => 'lab',
            'is_recurring' => true,
            'day_of_week' => 1,
            'start_time' => '09:00',
            'end_time' => '11:00',
        ])->assertStatus(422);

        // 6. Task Manager & AI Study Planner (no schedule overwrite)
        $this->actingAs($user, 'sanctum')->postJson('/api/tasks', [
            'course_id' => $courseId,
            'title' => 'Tugas Implementasi BFS',
            'priority' => 'high',
            'due_at' => now()->addDays(2)->toIso8601String(),
        ])->assertCreated();

        $planRes = $this->actingAs($user, 'sanctum')->postJson('/api/study-plans/generate', [
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ]);
        $planRes->assertCreated()
            ->assertJsonPath('plan.status', 'draft');

        $planId = $planRes->json('plan.id');
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/study-plans/{$planId}/approve")
            ->assertOk()
            ->assertJsonPath('plan.status', 'approved');

        $firstSessionId = $planRes->json('plan.sessions.0.id');
        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/study-sessions/{$firstSessionId}", ['status' => 'skipped'])
            ->assertOk()
            ->assertJsonPath('session.status', 'skipped');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/study-sessions/{$firstSessionId}/reschedule")
            ->assertOk()
            ->assertJsonPath('session.status', 'proposed');

        // 7. Dashboard reflects real data
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('progress.courses_count', 1)
            ->assertJsonPath('progress.completed_materials_count', 1)
            ->assertJsonPath('progress.tasks_total', 1);
    }
}
