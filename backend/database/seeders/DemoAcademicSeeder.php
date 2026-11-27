<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\DocumentChunk;
use App\Models\Material;
use App\Models\Schedule;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoAcademicSeeder extends Seeder
{
    /**
     * Development-only sample workspace for quick local exploration.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'mahasiswa@studynest.dev'],
            [
                'name' => 'Raka Pratama',
                'password' => 'StudyNestDemo123!',
                'timezone' => 'Asia/Jakarta',
                'daily_study_minutes' => 120,
                'preferred_study_time' => 'evening',
                'notification_preferences' => [
                    'schedule_reminder' => true,
                    'task_reminder' => true,
                    'exam_reminder' => true,
                    'study_session_reminder' => true,
                    'minutes_before' => 30,
                ],
            ]
        );

        if ($user->courses()->exists()) {
            return;
        }

        $algo = Course::create([
            'user_id' => $user->id,
            'name' => 'Struktur Data & Algoritma',
            'code' => 'IF204',
            'credits' => 3,
            'lecturer' => 'Dr. Nadia Kusuma',
            'semester' => 'Semester 3',
            'color' => '#6366f1',
            'description' => 'Pembahasan tree, graph, dynamic programming, dan kompleksitas algoritma.',
        ]);

        $bd = Course::create([
            'user_id' => $user->id,
            'name' => 'Basis Data Lanjut',
            'code' => 'IF302',
            'credits' => 3,
            'lecturer' => 'Budi Santoso, M.Kom.',
            'semester' => 'Semester 3',
            'color' => '#3b82f6',
            'description' => 'Normalisasi, indexing B-Tree, transaksi ACID, dan query optimization.',
        ]);

        $material = Material::create([
            'user_id' => $user->id,
            'course_id' => $algo->id,
            'title' => 'Ringkasan Graph & BFS/DFS (Dev Sample)',
            'original_filename' => 'graph-bfs-dfs.md',
            'mime_type' => 'text/markdown',
            'file_extension' => 'md',
            'file_size' => 540,
            'storage_disk' => 'local',
            'storage_path' => 'seed/graph-bfs-dfs.md',
            'status' => 'completed',
            'page_count' => 1,
            'processed_at' => now(),
        ]);

        DocumentChunk::create([
            'material_id' => $material->id,
            'user_id' => $user->id,
            'course_id' => $algo->id,
            'chunk_index' => 0,
            'page_number' => 1,
            'section_title' => 'Pengantar Graph Traversal',
            'content' => 'Breadth-First Search (BFS) menelusuri graph lapis demi lapis menggunakan Queue sehingga cocok mencari jalur terpendek pada graph tak berbobot (O(V+E)). Depth-First Search (DFS) menelusuri cabang sedalam mungkin menggunakan Stack atau rekursi untuk deteksi siklus dan topological sort.',
            'token_estimate' => 65,
        ]);

        Schedule::create([
            'user_id' => $user->id,
            'course_id' => $algo->id,
            'title' => 'Kuliah Struktur Data & Algoritma',
            'type' => 'lecture',
            'is_recurring' => true,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '10:30',
            'location' => 'Gedung Lab Informatika R.301',
        ]);

        Schedule::create([
            'user_id' => $user->id,
            'course_id' => $bd->id,
            'title' => 'UTS Basis Data Lanjut',
            'type' => 'exam',
            'is_recurring' => false,
            'specific_date' => now()->addDays(5)->toDateString(),
            'start_time' => '09:00',
            'end_time' => '11:00',
            'location' => 'Aula Gedung C',
        ]);

        Task::create([
            'user_id' => $user->id,
            'course_id' => $algo->id,
            'title' => 'Implementasi Shortest Path BFS di Graf Kampus',
            'description' => 'Selesaikan modul graf dan uji kasus graf berarah serta tak berarah.',
            'due_at' => now()->addDays(2)->setTime(23, 59),
            'priority' => 'high',
            'status' => 'in_progress',
            'estimated_minutes' => 90,
        ]);

        Task::create([
            'user_id' => $user->id,
            'course_id' => $bd->id,
            'title' => 'Latihan Normalisasi BCNF & Query Plan',
            'description' => 'Kerjakan studi kasus indeks PostgreSQL.',
            'due_at' => now()->addDays(4)->setTime(17, 0),
            'priority' => 'medium',
            'status' => 'todo',
            'estimated_minutes' => 60,
        ]);
    }
}
