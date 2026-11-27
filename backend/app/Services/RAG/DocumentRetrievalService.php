<?php

namespace App\Services\RAG;

use App\Models\DocumentChunk;
use App\Services\AI\AiManager;
use Illuminate\Support\Collection;

class DocumentRetrievalService
{
    public function __construct(
        private readonly AiManager $aiManager,
    ) {}

    /**
     * @param  array<int, int>|null  $materialIds
     * @return Collection<int, array{chunk: DocumentChunk, score: float}>
     */
    public function retrieve(
        int $userId,
        string $query,
        ?array $materialIds = null,
        ?int $courseId = null,
        int $limit = 6
    ): Collection {
        $chunksQuery = DocumentChunk::query()
            ->with('material:id,title,original_filename,course_id')
            ->where('user_id', $userId);

        if ($materialIds !== null && $materialIds !== []) {
            $chunksQuery->whereIn('material_id', $materialIds);
        }

        if ($courseId !== null) {
            $chunksQuery->where('course_id', $courseId);
        }

        $chunks = $chunksQuery->limit(400)->get();

        if ($chunks->isEmpty()) {
            return collect();
        }

        $queryEmbedding = $this->aiManager->provider()->embed($query);
        $keywords = $this->extractKeywords($query);

        return $chunks
            ->map(function (DocumentChunk $chunk) use ($queryEmbedding, $keywords) {
                $lexical = $this->lexicalScore($chunk->content, $keywords);
                $semantic = ($queryEmbedding !== null && is_array($chunk->embedding_json))
                    ? $this->cosineSimilarity($queryEmbedding, $chunk->embedding_json)
                    : 0.0;

                $combined = $queryEmbedding !== null
                    ? ($semantic * 0.72) + ($lexical * 0.28)
                    : $lexical;

                return [
                    'chunk' => $chunk,
                    'score' => round($combined, 4),
                ];
            })
            ->sortByDesc('score')
            ->take($limit)
            ->values();
    }

    /**
     * @return array<int, string>
     */
    private function extractKeywords(string $text): array
    {
        $normalized = mb_strtolower($text);
        $tokens = preg_split('/[^\p{L}\p{N}]+/u', $normalized) ?: [];

        return array_values(array_unique(array_filter(
            $tokens,
            fn (string $token) => mb_strlen($token) >= 2
        )));
    }

    /**
     * @param  array<int, string>  $keywords
     */
    private function lexicalScore(string $content, array $keywords): float
    {
        if ($keywords === []) {
            return 0.1;
        }

        $haystack = mb_strtolower($content);
        $hits = 0;

        foreach ($keywords as $keyword) {
            if (str_contains($haystack, $keyword)) {
                $hits++;
            }
        }

        return $hits / count($keywords);
    }

    /**
     * @param  array<int, float>  $a
     * @param  array<int, float>  $b
     */
    private function cosineSimilarity(array $a, array $b): float
    {
        $len = min(count($a), count($b));
        if ($len === 0) {
            return 0.0;
        }

        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        for ($i = 0; $i < $len; $i++) {
            $va = (float) $a[$i];
            $vb = (float) $b[$i];
            $dot += $va * $vb;
            $normA += $va * $va;
            $normB += $vb * $vb;
        }

        if ($normA <= 0.0 || $normB <= 0.0) {
            return 0.0;
        }

        return max(0.0, $dot / (sqrt($normA) * sqrt($normB)));
    }
}
