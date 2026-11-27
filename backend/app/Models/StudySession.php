<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class StudySession extends Model
{
    use HasFactory;

    protected $fillable = [
        'study_plan_id',
        'user_id',
        'course_id',
        'task_id',
        'material_id',
        'title',
        'topic',
        'session_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'priority',
        'status',
        'rationale',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date:Y-m-d',
            'duration_minutes' => 'integer',
        ];
    }

    public function studyPlan(): BelongsTo
    {
        return $this->belongsTo(StudyPlan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function reminders(): MorphMany
    {
        return $this->morphMany(Reminder::class, 'remindable');
    }
}
