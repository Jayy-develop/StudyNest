<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Reminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'remindable_type',
        'remindable_id',
        'title',
        'remind_at',
        'minutes_before',
        'channel',
        'status',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'remind_at' => 'datetime',
            'minutes_before' => 'integer',
            'sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function remindable(): MorphTo
    {
        return $this->morphTo();
    }
}
