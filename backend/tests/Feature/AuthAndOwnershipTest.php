<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Schedule;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_login_update_profile_and_logout(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'name' => 'Siti Aulia',
            'email' => 'siti@kampus.ac.id',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'timezone' => 'Asia/Jakarta',
        ]);

        $register->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'siti@kampus.ac.id',
            'password' => 'Password123!',
        ]);

        $login->assertOk()->assertJsonStructure(['token', 'user']);
        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'siti@kampus.ac.id');

        $this->withToken($token)
            ->patchJson('/api/auth/profile', [
                'daily_study_minutes' => 180,
                'preferred_study_time' => 'morning',
            ])
            ->assertOk()
            ->assertJsonPath('user.daily_study_minutes', 180);

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $freshLogin = $this->postJson('/api/auth/login', [
            'email' => 'siti@kampus.ac.id',
            'password' => 'Password123!',
        ]);
        $freshToken = $freshLogin->json('token');

        $this->withToken($freshToken)
            ->deleteJson('/api/auth/account')
            ->assertOk();

        $this->assertDatabaseMissing('users', ['email' => 'siti@kampus.ac.id']);
    }

    public function test_user_cannot_access_or_modify_another_users_academic_resources(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $course = Course::create([
            'user_id' => $owner->id,
            'name' => 'Keamanan Jaringan',
            'code' => 'IF401',
        ]);

        $task = Task::create([
            'user_id' => $owner->id,
            'course_id' => $course->id,
            'title' => 'Laporan Praktikum Firewall',
            'priority' => 'high',
            'status' => 'todo',
        ]);

        $schedule = Schedule::create([
            'user_id' => $owner->id,
            'course_id' => $course->id,
            'title' => 'Kuliah Keamanan Jaringan',
            'type' => 'lecture',
            'is_recurring' => true,
            'day_of_week' => 2,
            'start_time' => '09:00',
            'end_time' => '11:00',
        ]);

        $this->actingAs($intruder, 'sanctum')
            ->getJson("/api/courses/{$course->id}")
            ->assertForbidden();

        $this->actingAs($intruder, 'sanctum')
            ->deleteJson("/api/courses/{$course->id}")
            ->assertForbidden();

        $this->actingAs($intruder, 'sanctum')
            ->patchJson("/api/tasks/{$task->id}", ['status' => 'completed'])
            ->assertForbidden();

        $this->actingAs($intruder, 'sanctum')
            ->deleteJson("/api/schedules/{$schedule->id}")
            ->assertForbidden();
    }
}
