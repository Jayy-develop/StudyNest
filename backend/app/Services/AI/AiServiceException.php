<?php

namespace App\Services\AI;

use RuntimeException;

class AiServiceException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $errorCode = 'ai_error',
        public readonly int $statusCode = 503,
    ) {
        parent::__construct($message, $statusCode);
    }
}
