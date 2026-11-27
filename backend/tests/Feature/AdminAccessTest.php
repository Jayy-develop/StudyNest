<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/stats')
            ->assertUnauthorized();
    }

    public function test_student_cannot_access_admin_endpoints(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/admin/stats')
            ->assertForbidden();
    }

    public function test_admin_can_access_admin_stats(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonStructure([
                'users',
                'courses',
                'materials',
                'quizzes',
                'conversations',
                'schedules',
                'tasks',
                'study_plans',
            ]);
    }
}
