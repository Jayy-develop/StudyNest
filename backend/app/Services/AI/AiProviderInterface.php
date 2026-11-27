<?php

namespace App\Services\AI;

interface AiProviderInterface
{
    public function name(): string;

    public function isConfigured(): bool;

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function generateText(string $systemPrompt, array $messages, float $temperature = 0.3, int $maxTokens = 2048): string;

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array<string, mixed>
     */
    public function generateJson(string $systemPrompt, array $messages, float $temperature = 0.2, int $maxTokens = 3072): array;

    /**
     * @return array<int, float>|null
     */
    public function embed(string $text): ?array;
}
