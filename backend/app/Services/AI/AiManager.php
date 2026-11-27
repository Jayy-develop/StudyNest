<?php

namespace App\Services\AI;

class AiManager
{
    public function provider(?string $name = null): AiProviderInterface
    {
        $selected = $name ?: (string) config('ai.default', 'gemini');

        return match ($selected) {
            'openai' => new OpenAiProvider(
                apiKey: config('ai.providers.openai.api_key'),
                baseUrl: (string) config('ai.providers.openai.base_url'),
                model: (string) config('ai.providers.openai.model'),
                embeddingModel: (string) config('ai.providers.openai.embedding_model'),
                timeout: (int) config('ai.providers.openai.timeout', 60),
            ),
            default => new GeminiProvider(
                apiKey: config('ai.providers.gemini.api_key'),
                baseUrl: (string) config('ai.providers.gemini.base_url'),
                model: (string) config('ai.providers.gemini.model'),
                embeddingModel: (string) config('ai.providers.gemini.embedding_model'),
                timeout: (int) config('ai.providers.gemini.timeout', 60),
            ),
        };
    }

    public function status(): array
    {
        $active = $this->provider();

        return [
            'provider' => $active->name(),
            'configured' => $active->isConfigured(),
        ];
    }
}
