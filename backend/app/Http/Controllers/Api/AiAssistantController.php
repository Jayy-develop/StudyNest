<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Course;
use App\Models\Material;
use App\Models\Message;
use App\Services\AI\AiManager;
use App\Services\AI\AiServiceException;
use App\Services\RAG\DocumentRetrievalService;
use App\Support\OwnsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    use OwnsResource;

    public function status(AiManager $aiManager): JsonResponse
    {
        return response()->json($aiManager->status());
    }

    public function conversations(Request $request): JsonResponse
    {
        $conversations = Conversation::query()
            ->with('course:id,name,code,color')
            ->where('user_id', $request->user()->id)
            ->latest('updated_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($conversations);
    }

    public function createConversation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:200'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'explanation_mode' => ['nullable', 'in:concise,beginner,deep,examples,exam_prep'],
            'selected_material_ids' => ['nullable', 'array'],
            'selected_material_ids.*' => ['integer', 'exists:materials,id'],
        ]);

        if (! empty($validated['course_id'])) {
            $course = Course::findOrFail($validated['course_id']);
            $this->authorizeOwnership($request, $course);
        }

        $materialIds = $this->filterOwnedMaterials($request->user()->id, $validated['selected_material_ids'] ?? []);

        $conversation = Conversation::create([
            'user_id' => $request->user()->id,
            'course_id' => $validated['course_id'] ?? null,
            'title' => ($validated['title'] ?? null) ?: 'Diskusi Akademik Baru',
            'explanation_mode' => $validated['explanation_mode'] ?? 'concise',
            'selected_material_ids' => $materialIds,
        ]);

        return response()->json([
            'conversation' => $conversation->load('course:id,name,code,color', 'messages'),
        ], 201);
    }

    public function showConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeOwnership($request, $conversation);

        return response()->json([
            'conversation' => $conversation->load('course:id,name,code,color', 'messages'),
        ]);
    }

    public function sendMessage(
        Request $request,
        Conversation $conversation,
        DocumentRetrievalService $retrieval,
        AiManager $aiManager
    ): JsonResponse {
        $this->authorizeOwnership($request, $conversation);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:4000'],
            'explanation_mode' => ['nullable', 'in:concise,beginner,deep,examples,exam_prep'],
            'selected_material_ids' => ['nullable', 'array'],
            'selected_material_ids.*' => ['integer', 'exists:materials,id'],
        ]);

        $mode = $validated['explanation_mode'] ?? $conversation->explanation_mode;
        $materialIds = isset($validated['selected_material_ids'])
            ? $this->filterOwnedMaterials($request->user()->id, $validated['selected_material_ids'])
            : ($conversation->selected_material_ids ?? []);

        $conversation->update([
            'explanation_mode' => $mode,
            'selected_material_ids' => $materialIds,
        ]);

        $retrieved = $retrieval->retrieve(
            userId: $request->user()->id,
            query: $validated['content'],
            materialIds: $materialIds !== [] ? $materialIds : null,
            courseId: $materialIds === [] ? $conversation->course_id : null,
            limit: 6
        );

        $citations = $retrieved->map(function (array $entry) {
            $chunk = $entry['chunk'];

            return [
                'material_id' => $chunk->material_id,
                'material_title' => $chunk->material?->title ?? 'Dokumen',
                'page_number' => $chunk->page_number,
                'section_title' => $chunk->section_title,
                'score' => $entry['score'],
                'excerpt' => mb_substr($chunk->content, 0, 220),
            ];
        })->values()->all();

        $contextBlocks = $retrieved->map(function (array $entry, int $idx) {
            $chunk = $entry['chunk'];
            $title = $chunk->material?->title ?? 'Dokumen';
            $page = $chunk->page_number ? "Hal. {$chunk->page_number}" : 'Bagian '.($chunk->chunk_index + 1);

            return "[Sumber #{$idx}: {$title} | {$page}]\n{$chunk->content}";
        })->implode("\n\n---\n\n");

        $modeGuide = match ($mode) {
            'beginner' => 'Jelaskan bertahap dari dasar untuk pemula.',
            'deep' => 'Jelaskan secara mendalam dan analitis.',
            'examples' => 'Sertakan contoh konkret agar mudah dipahami.',
            'exam_prep' => 'Fokuskan pada konsep yang sering diuji dan poin penting ujian.',
            default => 'Jawab secara ringkas, jelas, dan langsung ke inti.',
        };

        $systemPrompt = implode("\n", [
            'Kamu adalah Hayabusa AI Academic Assistant untuk mahasiswa.',
            "Gaya penjelasan: {$modeGuide}",
            'Aturan ketat sumber dan kejujuran:',
            '1. Prioritaskan informasi dari potongan dokumen pengguna yang tersedia di bawah.',
            '2. Jika informasi berasal dari dokumen, sebutkan rujukan persis seperti [Nama Dokumen, Hal. X].',
            '3. Bedakan dengan jelas bagian "Berdasarkan Dokumen Anda" dan "Pengetahuan Umum Tambahan" (jika dokumen tidak lengkap).',
            '4. JANGAN mengarang kutipan, nomor halaman, atau isi dokumen yang tidak ada.',
            '5. Jika informasi tidak ditemukan di dokumen pengguna, katakan secara eksplisit bahwa tidak ditemukan dalam dokumen.',
        ]);

        $history = $conversation->messages()
            ->latest('id')
            ->limit(6)
            ->get()
            ->reverse()
            ->map(fn (Message $m) => ['role' => $m->role, 'content' => $m->content])
            ->values()
            ->all();

        $promptWithContext = $contextBlocks !== ''
            ? "Konteks Dokumen Mahasiswa:\n{$contextBlocks}\n\nPertanyaan Mahasiswa:\n{$validated['content']}"
            : "Tidak ada potongan dokumen yang cocok/dipilih. Nyatakan dengan jujur jika perlu merujuk dokumen.\n\nPertanyaan Mahasiswa:\n{$validated['content']}";

        try {
            $reply = $aiManager->provider()->generateText(
                $systemPrompt,
                [...$history, ['role' => 'user', 'content' => $promptWithContext]],
                0.25,
                1800
            );
        } catch (AiServiceException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => $e->errorCode,
            ], $e->statusCode);
        }

        $userMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $validated['content'],
        ]);

        $assistantMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $reply,
            'citations' => $citations,
            'metadata' => [
                'used_documents' => $citations !== [],
                'explanation_mode' => $mode,
                'provider' => $aiManager->provider()->name(),
            ],
        ]);

        if ($conversation->title === 'Diskusi Akademik Baru') {
            $conversation->update([
                'title' => mb_substr($validated['content'], 0, 80),
            ]);
        } else {
            $conversation->touch();
        }

        return response()->json([
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
            'conversation' => $conversation->fresh('course:id,name,code,color'),
        ], 201);
    }

    public function deleteConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeOwnership($request, $conversation);
        $conversation->delete();

        return response()->json([
            'message' => 'Percakapan berhasil dihapus.',
        ]);
    }

    /**
     * @param  array<int, int>  $materialIds
     * @return array<int, int>
     */
    private function filterOwnedMaterials(int $userId, array $materialIds): array
    {
        if ($materialIds === []) {
            return [];
        }

        return Material::query()
            ->where('user_id', $userId)
            ->whereIn('id', $materialIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
