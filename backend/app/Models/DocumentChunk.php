<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentChunk extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'user_id',
        'course_id',
        'chunk_index',
        'page_number',
        'section_title',
        'content',
        'token_estimate',
        'embedding_json',
        'embedding_model',
    ];

    protected $hidden = [
        'embedding_json',
    ];

    protected function casts(): array
    {
        return [
            'chunk_index' => 'integer',
            'page_number' => 'integer',
            'token_estimate' => 'integer',
            'embedding_json' => 'array',
        ];
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
