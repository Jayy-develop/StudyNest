<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->string('original_filename', 255);
            $table->string('mime_type', 128);
            $table->string('file_extension', 16);
            $table->unsignedBigInteger('file_size');
            $table->string('storage_disk', 32)->default('local');
            $table->string('storage_path', 500);
            $table->string('status', 24)->default('queued');
            $table->text('error_message')->nullable();
            $table->unsignedInteger('page_count')->nullable();
            $table->longText('summary')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'course_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('document_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('chunk_index');
            $table->unsignedInteger('page_number')->nullable();
            $table->string('section_title', 200)->nullable();
            $table->longText('content');
            $table->unsignedInteger('token_estimate')->default(0);
            $table->json('embedding_json')->nullable();
            $table->string('embedding_model', 80)->nullable();
            $table->timestamps();

            $table->index(['material_id', 'chunk_index']);
            $table->index(['user_id', 'course_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            $hasPgVector = DB::selectOne("SELECT 1 AS available FROM pg_available_extensions WHERE name = 'vector'");
            if ($hasPgVector) {
                DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
                DB::statement('ALTER TABLE document_chunks ADD COLUMN embedding vector(768)');
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('document_chunks');
        Schema::dropIfExists('materials');
    }
};
