<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->string('question_type', 24)->default('multiple_choice');
            $table->string('difficulty', 24)->default('medium');
            $table->unsignedTinyInteger('question_count')->default(5);
            $table->json('source_material_ids')->nullable();
            $table->boolean('is_ai_generated')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'course_id']);
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('material_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('order_index');
            $table->string('type', 24)->default('multiple_choice');
            $table->text('prompt');
            $table->json('options')->nullable();
            $table->text('correct_answer');
            $table->text('explanation')->nullable();
            $table->string('topic', 140)->nullable();
            $table->string('source_reference', 200)->nullable();
            $table->boolean('is_ai_generated')->default(true);
            $table->timestamps();

            $table->index(['quiz_id', 'order_index']);
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 5, 2)->default(0);
            $table->unsignedInteger('correct_count')->default(0);
            $table->unsignedInteger('total_questions')->default(0);
            $table->json('weak_topics')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'quiz_id']);
        });

        Schema::create('quiz_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->text('user_answer')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->decimal('earned_points', 5, 2)->default(0);
            $table->text('ai_feedback')->nullable();
            $table->timestamps();

            $table->unique(['quiz_attempt_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_answers');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('quizzes');
    }
};
