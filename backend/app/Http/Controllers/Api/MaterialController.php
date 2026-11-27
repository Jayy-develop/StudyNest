<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessMaterialJob;
use App\Models\Course;
use App\Models\Material;
use App\Services\AI\AiManager;
use App\Services\AI\AiServiceException;
use App\Support\OwnsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MaterialController extends Controller
{
    use OwnsResource;

    public function index(Request $request): JsonResponse
    {
        $query = Material::query()
            ->with('course:id,name,code,color')
            ->withCount('chunks')
            ->where('user_id', $request->user()->id);

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->integer('course_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = '%'.mb_strtolower((string) $request->string('search')).'%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(original_filename) LIKE ?', [$search]);
            });
        }

        return response()->json(
            $query->latest()->paginate($request->integer('per_page', 20))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $maxKb = ((int) config('ai.max_upload_mb', 20)) * 1024;

        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'title' => ['nullable', 'string', 'max:200'],
            'file' => ['required', 'file', 'mimes:pdf,docx,pptx,txt,md', "max:{$maxKb}"],
        ]);

        $course = Course::findOrFail($validated['course_id']);
        $this->authorizeOwnership($request, $course, 'Anda tidak dapat mengunggah materi ke mata kuliah pengguna lain.');

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $originalName = $file->getClientOriginalName();
        $safeFilename = Str::uuid().'.'.$extension;
        $disk = 'local';
        $storagePath = $file->storeAs("users/{$request->user()->id}/materials", $safeFilename, $disk);

        $material = Material::create([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'title' => ($validated['title'] ?? null) ?: pathinfo($originalName, PATHINFO_FILENAME),
            'original_filename' => $originalName,
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'file_extension' => $extension,
            'file_size' => $file->getSize() ?: 0,
            'storage_disk' => $disk,
            'storage_path' => $storagePath,
            'status' => 'queued',
        ]);

        ProcessMaterialJob::dispatch($material->id);

        return response()->json([
            'material' => $material->fresh(['course:id,name,code,color'])->loadCount('chunks'),
        ], 201);
    }

    public function show(Request $request, Material $material): JsonResponse
    {
        $this->authorizeOwnership($request, $material);

        $material->load([
            'course:id,name,code,color',
            'chunks' => fn ($q) => $q->select('id', 'material_id', 'chunk_index', 'page_number', 'section_title', 'content', 'token_estimate')->limit(20),
        ])->loadCount('chunks');

        return response()->json([
            'material' => $material,
        ]);
    }

    public function download(Request $request, Material $material): StreamedResponse
    {
        $this->authorizeOwnership($request, $material);

        $disk = Storage::disk($material->storage_disk);
        if (! $disk->exists($material->storage_path)) {
            abort(404, 'File materi tidak ditemukan.');
        }

        return $disk->download($material->storage_path, $material->original_filename);
    }

    public function retry(Request $request, Material $material): JsonResponse
    {
        $this->authorizeOwnership($request, $material);

        $material->update([
            'status' => 'queued',
            'error_message' => null,
        ]);

        ProcessMaterialJob::dispatch($material->id);

        return response()->json([
            'material' => $material->fresh(['course:id,name,code,color'])->loadCount('chunks'),
        ]);
    }

    public function summarize(Request $request, Material $material, AiManager $aiManager): JsonResponse
    {
        $this->authorizeOwnership($request, $material);

        $validated = $request->validate([
            'mode' => ['nullable', 'in:concise,beginner,deep,exam_prep'],
        ]);

        if ($material->status !== 'completed') {
            return response()->json([
                'message' => 'Dokumen belum selesai diproses. Tunggu hingga status selesai.',
            ], 422);
        }

        $chunks = $material->chunks()->limit(18)->get();
        if ($chunks->isEmpty()) {
            return response()->json([
                'message' => 'Dokumen tidak memiliki teks yang dapat dirangkum.',
            ], 422);
        }

        $modeInstruction = match ($validated['mode'] ?? 'concise') {
            'beginner' => 'Jelaskan secara bertahap dengan bahasa sederhana untuk pemula.',
            'deep' => 'Berikan ringkasan mendalam mencakup definisi, konsep inti, dan keterkaitan antar bagian.',
            'exam_prep' => 'Fokuskan ringkasan pada poin kunci, rumus/definisi penting, dan hal yang sering keluar di ujian.',
            default => 'Buat ringkasan padat, terstruktur dengan poin-poin utama.',
        };

        $contextText = $chunks->map(function ($chunk) {
            $ref = $chunk->page_number ? "Hal. {$chunk->page_number}" : 'Bagian '.($chunk->chunk_index + 1);

            return "[{$ref}]\n{$chunk->content}";
        })->implode("\n\n---\n\n");

        try {
            $summary = $aiManager->provider()->generateText(
                "Kamu adalah asisten akademik mahasiswa. {$modeInstruction} Hanya gunakan fakta dari potongan dokumen yang diberikan dan sertakan rujukan [Hal. X] bila tersedia. Jangan mengarang isi di luar dokumen.",
                [[
                    'role' => 'user',
                    'content' => "Judul dokumen: {$material->title}\n\nPotongan isi:\n{$contextText}\n\nBuat rangkuman terstruktur dalam bahasa Indonesia.",
                ]],
                0.25,
                1600
            );
        } catch (AiServiceException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => $e->errorCode,
            ], $e->statusCode);
        }

        $material->update(['summary' => $summary]);

        return response()->json([
            'summary' => $summary,
            'material' => $material->fresh(['course:id,name,code,color'])->loadCount('chunks'),
        ]);
    }

    public function destroy(Request $request, Material $material): JsonResponse
    {
        $this->authorizeOwnership($request, $material);

        $disk = Storage::disk($material->storage_disk);
        if ($disk->exists($material->storage_path)) {
            $disk->delete($material->storage_path);
        }

        $material->delete();

        return response()->json([
            'message' => 'Materi berhasil dihapus.',
        ]);
    }
}
