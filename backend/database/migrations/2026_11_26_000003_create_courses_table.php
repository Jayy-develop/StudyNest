<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 160);
            $table->string('code', 32)->nullable();
            $table->unsignedTinyInteger('credits')->nullable();
            $table->string('lecturer', 120)->nullable();
            $table->string('semester', 40)->nullable();
            $table->string('color', 24)->default('#6366f1');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
