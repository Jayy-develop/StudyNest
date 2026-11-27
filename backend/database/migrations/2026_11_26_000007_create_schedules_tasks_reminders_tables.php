<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 200);
            $table->string('type', 32)->default('lecture');
            $table->boolean('is_recurring')->default(true);
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->date('specific_date')->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location', 160)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'day_of_week']);
            $table->index(['user_id', 'specific_date']);
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->string('priority', 24)->default('medium');
            $table->string('status', 24)->default('todo');
            $table->unsignedSmallInteger('estimated_minutes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'due_at']);
        });

        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('remindable_type', 120);
            $table->unsignedBigInteger('remindable_id');
            $table->string('title', 200);
            $table->timestamp('remind_at');
            $table->unsignedSmallInteger('minutes_before')->default(30);
            $table->string('channel', 32)->default('in_app');
            $table->string('status', 24)->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'remind_at']);
            $table->index(['remindable_type', 'remindable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('schedules');
    }
};
