<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Create the default administrator account.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@studynest.dev'],
            [
                'name' => 'Administrator StudyNest',
                'password' => 'StudyNestAdmin123!',
                'role' => UserRole::Admin,
            ]
        );
    }
}
