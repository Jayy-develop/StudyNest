<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\DocumentChunk;
use App\Models\Material;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Services\AI\AiManager;
use App\Services\AI\AiServiceException;
use App\Support\OwnsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    use OwnsResource;

    public function index(Request $request): JsonResponse
    {
        $quizzes = Quiz::query()
            ->with('course:id,name,code,color')
            ->withCount('questions', 'attempts')
            ->where('user_id', $request->user()->id)
            ->when($request->filled('course_id'), fn ($q) => $q->where('course_id', $request->integer('course_id')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($quizzes);
    }

    public function generate(Request $request, AiManager $aiManager): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'material_ids' => ['required', 'array', 'min:1'],
            'material_ids.*' => ['integer', 'exists:materials,id'],
            'title' => ['nullable', 'string', 'max:200'],
            'question_type' => ['required', 'in:multiple_choice,essay,mixed'],
            'difficulty' => ['required', 'in:easy,medium,hard'],
            'question_count' => ['required', 'integer', 'min:1', 'max:15'],
        ]);

        $course = Course::findOrFail($validated['course_id']);
        $this->authorizeOwnership($request, $course);

        $materials = Material::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('id', $validated['material_ids'])
            ->where('status', 'completed')
            ->get();

        if ($materials->isEmpty()) {
            return response()->json([
                'message' => 'Pilih minimal satu materi milik Anda yang sudah selesai diproses.',
            ], 422);
        }

        $chunks = DocumentChunk::query()
            ->with('material:id,title')
            ->where('user_id', $request->user()->id)
            ->whereIn('material_id', $materials->pluck('id'))
            ->orderBy('chunk_index')
            ->limit(18)
            ->get();

        if ($chunks->isEmpty()) {
            return response()->json([
                'message' => 'Materi terpilih tidak memiliki konten teks yang cukup untuk dibuat kuis.',
            ], 422);
        }

        $contextText = $chunks->map(function (DocumentChunk $chunk) {
            $title = $chunk->material?->title ?? 'Dokumen';
            $page = $chunk->page_number ? "Hal. {$chunk->page_number}" : 'Bagian '.($chunk->chunk_index + 1);

            return "[Material ID {$chunk->material_id}: {$title} | {$page}]\n{$chunk->content}";
        })->implode("\n\n---\n\n");

        $systemPrompt = implode("\n", [
            'Kamu adalah pembuat soal ujian akademik untuk mahasiswa dalam bahasa Indonesia.',
            'Buat soal HANYA berdasarkan materi sumber yang diberikan.',
            'Kembalikan JSON valid dengan format persis:',
            '{"questions":[{"type":"multiple_choice|essay","prompt":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct_answer":"...","explanation":"...","topic":"...","material_id":1,"source_reference":"Nama Dokumen, Hal. X"}]}',
            'Untuk soal essay, isi "options" dengan null dan "correct_answer" dengan kunci jawaban ringkas.',
            'Untuk multiple_choice, isi "options" dengan 4 opsi dan "correct_answer" harus sama persis dengan salah satu teks opsi.',
        ]);

        try {
            $result = $aiManager->provider()->generateJson(
                $systemPrompt,
                [[
                    'role' => 'user',
                    'content' => "Mata Kuliah: {$course->name}\nTipe Soal: {$validated['question_type']}\nTingkat Kesulitan: {$validated['difficulty']}\nJumlah Soal: {$validated['question_count']}\n\nMateri Sumber:\n{$contextText}",
                ]],
                0.3,
                3500
            );
        } catch (AiServiceException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => $e->errorCode,
            ], $e->statusCode);
        }

        $generatedQuestions = $result['questions'] ?? [];
        if (! is_array($generatedQuestions) || $generatedQuestions === []) {
            return response()->json([
                'message' => 'AI gagal menghasilkan daftar soal yang valid.',
            ], 502);
        }

        $quiz = Quiz::create([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'title' => ($validated['title'] ?? null) ?: 'Kuis '.$course->name.' ('.ucfirst($validated['difficulty']).')',
            'question_type' => $validated['question_type'],
            'difficulty' => $validated['difficulty'],
            'question_count' => count($generatedQuestions),
            'source_material_ids' => $materials->pluck('id')->values()->all(),
            'is_ai_generated' => true,
        ]);

        foreach (array_values($generatedQuestions) as $idx => $item) {
            $materialId = isset($item['material_id']) && $materials->contains('id', (int) $item['material_id'])
                ? (int) $item['material_id']
                : $materials->first()->id;

            Question::create([
                'quiz_id' => $quiz->id,
                'material_id' => $materialId,
                'order_index' => $idx + 1,
                'type' => ($item['type'] ?? 'multiple_choice') === 'essay' ? 'essay' : 'multiple_choice',
                'prompt' => (string) ($item['prompt'] ?? 'Pertanyaan '.($idx + 1)),
                'options' => is_array($item['options'] ?? null) ? array_values($item['options']) : null,
                'correct_answer' => (string) ($item['correct_answer'] ?? ''),
                'explanation' => (string) ($item['explanation'] ?? ''),
                'topic' => (string) ($item['topic'] ?? $course->name),
                'source_reference' => (string) ($item['source_reference'] ?? $materials->first()->title),
                'is_ai_generated' => true,
            ]);
        }

        return response()->json([
            'quiz' => $quiz->load('course:id,name,code,color', 'questions', 'attempts'),
        ], 201);
    }

    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorizeOwnership($request, $quiz);

        return response()->json([
            'quiz' => $quiz->load([
                'course:id,name,code,color',
                'questions',
                'attempts.answers',
            ]),
        ]);
    }

    public function submitAttempt(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorizeOwnership($request, $quiz);

        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.user_answer' => ['nullable', 'string', 'max:4000'],
        ]);

        $quiz->load('questions');
        $questionsById = $quiz->questions->keyBy('id');

        if ($questionsById->isEmpty()) {
            return response()->json(['message' => 'Kuis tidak memiliki soal.'], 422);
        }

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $request->user()->id,
            'total_questions' => $questionsById->count(),
            'started_at' => now(),
            'submitted_at' => now(),
        ]);

        $submittedMap = collect($validated['answers'])->keyBy('question_id');
        $correctCount = 0;
        $earnedTotal = 0.0;
        $weakTopics = [];

        foreach ($questionsById as $question) {
            $rawAnswer = trim((string) ($submittedMap->get($question->id)['user_answer'] ?? ''));
            $isCorrect = false;
            $points = 0.0;
            $feedback = $question->explanation;

            if ($question->type === 'multiple_choice') {
                $isCorrect = mb_strtolower($rawAnswer) === mb_strtolower(trim($question->correct_answer));
                $points = $isCorrect ? 1.0 : 0.0;
            } else {
                $points = $this->scoreEssayOverlap($rawAnswer, $question->correct_answer);
                $isCorrect = $points >= 0.6;
                $feedback = 'Kunci jawaban acuan: '.$question->correct_answer.($question->explanation ? "\n".$question->explanation : '');
            }

            if ($isCorrect) {
                $correctCount++;
            } elseif ($question->topic) {
                $weakTopics[] = $question->topic;
            }

            $earnedTotal += $points;

            QuizAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'question_id' => $question->id,
                'user_answer' => $rawAnswer,
                'is_correct' => $isCorrect,
                'earned_points' => $points,
                'ai_feedback' => $feedback,
            ]);
        }

        $percentage = round(($earnedTotal / max(1, $questionsById->count())) * 100, 2);

        $attempt->update([
            'score' => $percentage,
            'correct_count' => $correctCount,
            'weak_topics' => array_values(array_unique($weakTopics)),
        ]);

        return response()->json([
            'attempt' => $attempt->fresh(['answers.question']),
        ], 201);
    }

    public function regenerateQuestion(Request $request, Quiz $quiz, Question $question, AiManager $aiManager): JsonResponse
    {
        $this->authorizeOwnership($request, $quiz);

        if ((int) $question->quiz_id !== (int) $quiz->id) {
            abort(404, 'Soal tidak ditemukan pada kuis ini.');
        }

        $chunks = DocumentChunk::query()
            ->with('material:id,title')
            ->where('user_id', $request->user()->id)
            ->whereIn('material_id', $quiz->source_material_ids ?: [$question->material_id])
            ->inRandomOrder()
            ->limit(6)
            ->get();

        $contextText = $chunks->map(fn (DocumentChunk $c) => $c->content)->implode("\n\n");

        try {
            $result = $aiManager->provider()->generateJson(
                'Buat 1 soal pengganti yang berbeda dari soal sebelumnya berdasarkan materi. Kembalikan JSON: {"prompt":"...","options":["A. ...","B. ...","C. ...","D. ..."]|null,"correct_answer":"...","explanation":"...","topic":"...","source_reference":"..."}',
                [[
                    'role' => 'user',
                    'content' => "Tipe: {$question->type}\nKesulitan: {$quiz->difficulty}\nSoal lama: {$question->prompt}\n\nMateri:\n{$contextText}",
                ]],
                0.45,
                1000
            );
        } catch (AiServiceException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => $e->errorCode,
            ], $e->statusCode);
        }

        $question->update([
            'prompt' => (string) ($result['prompt'] ?? $question->prompt),
            'options' => is_array($result['options'] ?? null) ? array_values($result['options']) : ($question->type === 'essay' ? null : $question->options),
            'correct_answer' => (string) ($result['correct_answer'] ?? $question->correct_answer),
            'explanation' => (string) ($result['explanation'] ?? $question->explanation),
            'topic' => (string) ($result['topic'] ?? $question->topic),
            'source_reference' => (string) ($result['source_reference'] ?? $question->source_reference),
            'is_ai_generated' => true,
        ]);

        return response()->json([
            'question' => $question->fresh(),
        ]);
    }

    public function destroy(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorizeOwnership($request, $quiz);
        $quiz->delete();

        return response()->json([
            'message' => 'Kuis berhasil dihapus.',
        ]);
    }

    private function scoreEssayOverlap(string $answer, string $reference): float
    {
        if ($answer === '' || $reference === '') {
            return 0.0;
        }

        $refTokens = array_unique(array_filter(
            preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($reference)) ?: [],
            fn (string $t) => mb_strlen($t) >= 3
        ));

        if ($refTokens === []) {
            return mb_strlen($answer) >= 10 ? 0.7 : 0.0;
        }

        $answerLower = mb_strtolower($answer);
        $matched = 0;
        foreach ($refTokens as $token) {
            if (str_contains($answerLower, $token)) {
                $matched++;
            }
        }

        return round(min(1.0, $matched / max(1, count($refTokens) * 0.6)), 2);
    }
}
