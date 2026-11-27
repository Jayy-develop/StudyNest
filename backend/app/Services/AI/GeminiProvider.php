<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class GeminiProvider implements AiProviderInterface
{
    public function __construct(
        private readonly ?string $apiKey,
        private readonly string $baseUrl,
        private readonly string $model,
        private readonly string $embeddingModel,
        private readonly int $timeout = 60,
    ) {}

    public function name(): string
    {
        return 'gemini';
    }

    public function isConfigured(): bool
    {
        return filled($this->apiKey);
    }

    public function generateText(string $systemPrompt, array $messages, float $temperature = 0.3, int $maxTokens = 2048): string
    {
        return $this->requestContent($systemPrompt, $messages, $temperature, $maxTokens, false);
    }

    public function generateJson(string $systemPrompt, array $messages, float $temperature = 0.2, int $maxTokens = 3072): array
    {
        $raw = $this->requestContent($systemPrompt, $messages, $temperature, $maxTokens, true);
        $decoded = json_decode($this->stripCodeFences($raw), true);

        if (! is_array($decoded)) {
            throw new AiServiceException('Respons AI tidak berbentuk JSON yang valid.', 'ai_invalid_json', 502);
        }

        return $decoded;
    }

    public function embed(string $text): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $endpoint = sprintf(
            '%s/models/%s:embedContent?key=%s',
            rtrim($this->baseUrl, '/'),
            $this->embeddingModel,
            urlencode((string) $this->apiKey)
        );

        $response = Http::timeout($this->timeout)
            ->post($endpoint, [
                'model' => 'models/'.$this->embeddingModel,
                'content' => [
                    'parts' => [['text' => mb_substr($text, 0, 8000)]],
                ],
            ]);

        if (! $response->successful()) {
            return null;
        }

        $values = $response->json('embedding.values');

        return is_array($values) ? array_map('floatval', $values) : null;
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function requestContent(string $systemPrompt, array $messages, float $temperature, int $maxTokens, bool $jsonMode): string
    {
        if (! $this->isConfigured()) {
            throw new AiServiceException(
                'GEMINI_API_KEY belum dikonfigurasi di backend. Tambahkan API key pada backend/.env untuk mengaktifkan fitur AI.',
                'ai_not_configured',
                503
            );
        }

        $contents = array_map(fn (array $message) => [
            'role' => $message['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $message['content']]],
        ], $messages);

        $generationConfig = [
            'temperature' => $temperature,
            'maxOutputTokens' => $maxTokens,
        ];

        if ($jsonMode) {
            $generationConfig['responseMimeType'] = 'application/json';
        }

        $endpoint = sprintf(
            '%s/models/%s:generateContent?key=%s',
            rtrim($this->baseUrl, '/'),
            $this->model,
            urlencode((string) $this->apiKey)
        );

        $response = Http::timeout($this->timeout)->post($endpoint, [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
            'generationConfig' => $generationConfig,
        ]);

        if (! $response->successful()) {
            $errorMessage = $response->json('error.message') ?? 'Permintaan ke Gemini API gagal.';
            throw new AiServiceException($errorMessage, 'ai_provider_error', 502);
        }

        $text = $response->json('candidates.0.content.parts.0.text');

        if (! is_string($text) || trim($text) === '') {
            throw new AiServiceException('Gemini API mengembalikan respons kosong.', 'ai_empty_response', 502);
        }

        return trim($text);
    }

    private function stripCodeFences(string $text): string
    {
        $trimmed = trim($text);
        if (str_starts_with($trimmed, '```')) {
            $trimmed = preg_replace('/^```(?:json)?\s*|\s*```$/', '', $trimmed) ?? $trimmed;
        }

        return trim($trimmed);
    }
}
