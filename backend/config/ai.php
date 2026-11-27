<?php

return [
    'default' => env('AI_PROVIDER', 'gemini'),

    'rate_limit_per_minute' => (int) env('AI_RATE_LIMIT_PER_MINUTE', 30),

    'max_upload_mb' => (int) env('MATERIAL_MAX_UPLOAD_MB', 20),

    'providers' => [
        'gemini' => [
            'api_key' => env('GEMINI_API_KEY'),
            'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
            'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
            'embedding_model' => env('GEMINI_EMBEDDING_MODEL', 'text-embedding-004'),
            'timeout' => (int) env('AI_REQUEST_TIMEOUT', 60),
        ],

        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
            'timeout' => (int) env('AI_REQUEST_TIMEOUT', 60),
        ],
    ],
];
