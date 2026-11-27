<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Course;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\Schedule;
use App\Models\StudyPlan;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    /**
     * Ringkasan statistik platform untuk panel admin.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'users' => User::count(),
            'courses' => Course::count(),
            'materials' => Material::count(),
            'quizzes' => Quiz::count(),
            'conversations' => Conversation::count(),
            'schedules' => Schedule::count(),
            'tasks' => Task::count(),
            'study_plans' => StudyPlan::count(),
        ]);
    }
}
