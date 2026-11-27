<?php

namespace App\Jobs;

use App\Models\DocumentChunk;
use App\Models\Material;
use App\Services\AI\AiManager;
use App\Services\Documents\DocumentChunkerService;
use App\Services\Documents\DocumentExtractorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessMaterialJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function __construct(
        public readonly int $materialId,
    ) {}

    public function handle(
        DocumentExtractorService $extractor,
        DocumentChunkerService $chunker,
        AiManager $aiManager,
    ): void {
        $material = Material::find($this->materialId);
        if (! $material) {
            return;
        }

        $material->update([
            'status' => 'processing',
            'error_message' => null,
        ]);

        try {
            $disk = Storage::disk($material->storage_disk);
            if (! $disk->exists($material->storage_path)) {
                throw new \RuntimeException('File materi tidak ditemukan di penyimpanan.');
            }

            $absolutePath = $disk->path($material->storage_path);
            $pages = $extractor->extract($absolutePath, $material->file_extension);

            if ($pages === []) {
                throw new \RuntimeException('Tidak ada teks yang dapat diekstrak dari dokumen ini.');
            }

            $chunks = $chunker->chunk($pages);
            $provider = $aiManager->provider();
            $canEmbed = $provider->isConfigured();

            DocumentChunk::where('material_id', $material->id)->delete();

            foreach ($chunks as $chunkData) {
                $embedding = $canEmbed ? $provider->embed($chunkData['content']) : null;

                DocumentChunk::create([
                    'material_id' => $material->id,
                    'user_id' => $material->user_id,
                    'course_id' => $material->course_id,
                    'chunk_index' => $chunkData['chunk_index'],
                    'page_number' => $chunkData['page_number'],
                    'section_title' => $chunkData['section_title'],
                    'content' => $chunkData['content'],
                    'token_estimate' => $chunkData['token_estimate'],
                    'embedding_json' => $embedding,
                    'embedding_model' => $embedding ? $provider->name() : null,
                ]);
            }

            $material->update([
                'status' => 'completed',
                'page_count' => count($pages),
                'processed_at' => now(),
                'error_message' => null,
            ]);
        } catch (Throwable $e) {
            $material->update([
                'status' => 'failed',
                'error_message' => mb_substr($e->getMessage(), 0, 1000),
            ]);
        }
    }
}
