<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 24)->default('draft');
            $table->text('goal')->nullable();
            $table->json('preferences')->nullable();
            $table->text('ai_rationale')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('study_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('study_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('task_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('material_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 200);
            $table->string('topic', 200)->nullable();
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('duration_minutes');
            $table->string('priority', 24)->default('medium');
            $table->string('status', 24)->default('proposed');
            $table->text('rationale')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'session_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_sessions');
        Schema::dropIfExists('study_plans');
    }
};
