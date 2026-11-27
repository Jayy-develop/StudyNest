<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('timezone', 64)->default('Asia/Jakarta')->after('password');
            $table->unsignedSmallInteger('daily_study_minutes')->default(120)->after('timezone');
            $table->string('preferred_study_time', 32)->default('evening')->after('daily_study_minutes');
            $table->json('notification_preferences')->nullable()->after('preferred_study_time');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'timezone',
                'daily_study_minutes',
                'preferred_study_time',
                'notification_preferences',
            ]);
        });
    }
};
