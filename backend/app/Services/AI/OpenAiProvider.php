<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class OpenAiProvider implements AiProviderInterface
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
        return 'openai';
    }

    public function isConfigured(): bool
    {
        return filled($this->apiKey);
    }

    public function generateText(string $systemPrompt, array $messages, float $temperature = 0.3, int $maxTokens = 2048): string
    {
        return $this->requestChat($systemPrompt, $messages, $temperature, $maxTokens, false);
    }

    public function generateJson(string $systemPrompt, array $messages, float $temperature = 0.2, int $maxTokens = 3072): array
    {
        $raw = $this->requestChat($systemPrompt, $messages, $temperature, $maxTokens, true);
        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            throw new AiServiceException('Respons OpenAI tidak berbentuk JSON yang valid.', 'ai_invalid_json', 502);
        }

        return $decoded;
    }

    public function embed(string $text): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $response = Http::withToken((string) $this->apiKey)
            ->timeout($this->timeout)
            ->post(rtrim($this->baseUrl, '/').'/embeddings', [
                'model' => $this->embeddingModel,
                'input' => mb_substr($text, 0, 8000),
            ]);

        if (! $response->successful()) {
            return null;
        }

        $values = $response->json('data.0.embedding');

        return is_array($values) ? array_map('floatval', $values) : null;
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function requestChat(string $systemPrompt, array $messages, float $temperature, int $maxTokens, bool $jsonMode): string
    {
        if (! $this->isConfigured()) {
            throw new AiServiceException(
                'OPENAI_API_KEY belum dikonfigurasi di backend. Tambahkan API key pada backend/.env untuk mengaktifkan fitur AI.',
                'ai_not_configured',
                503
            );
        }

        $payloadMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $messages
        );

        $payload = [
            'model' => $this->model,
            'messages' => $payloadMessages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        if ($jsonMode) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $response = Http::withToken((string) $this->apiKey)
            ->timeout($this->timeout)
            ->post(rtrim($this->baseUrl, '/').'/chat/completions', $payload);

        if (! $response->successful()) {
            $errorMessage = $response->json('error.message') ?? 'Permintaan ke OpenAI API gagal.';
            throw new AiServiceException($errorMessage, 'ai_provider_error', 502);
        }

        $text = $response->json('choices.0.message.content');

        if (! is_string($text) || trim($text) === '') {
            throw new AiServiceException('OpenAI API mengembalikan respons kosong.', 'ai_empty_response', 502);
        }

        return trim($text);
    }
}
