<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'material_id',
        'order_index',
        'type',
        'prompt',
        'options',
        'correct_answer',
        'explanation',
        'topic',
        'source_reference',
        'is_ai_generated',
    ];

    protected function casts(): array
    {
        return [
            'order_index' => 'integer',
            'options' => 'array',
            'is_ai_generated' => 'boolean',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
