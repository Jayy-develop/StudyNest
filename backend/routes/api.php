<?php

use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\StudyPlannerController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::delete('/auth/account', [AuthController::class, 'deleteAccount']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('courses', CourseController::class);

    Route::get('/materials', [MaterialController::class, 'index']);
    Route::post('/materials', [MaterialController::class, 'store']);
    Route::get('/materials/{material}', [MaterialController::class, 'show']);
    Route::get('/materials/{material}/download', [MaterialController::class, 'download']);
    Route::post('/materials/{material}/retry', [MaterialController::class, 'retry']);
    Route::post('/materials/{material}/summarize', [MaterialController::class, 'summarize'])->middleware('throttle:30,1');
    Route::delete('/materials/{material}', [MaterialController::class, 'destroy']);

    Route::get('/ai/status', [AiAssistantController::class, 'status']);
    Route::get('/conversations', [AiAssistantController::class, 'conversations']);
    Route::post('/conversations', [AiAssistantController::class, 'createConversation']);
    Route::get('/conversations/{conversation}', [AiAssistantController::class, 'showConversation']);
    Route::post('/conversations/{conversation}/messages', [AiAssistantController::class, 'sendMessage'])->middleware('throttle:30,1');
    Route::delete('/conversations/{conversation}', [AiAssistantController::class, 'deleteConversation']);

    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::post('/quizzes/generate', [QuizController::class, 'generate'])->middleware('throttle:20,1');
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::post('/quizzes/{quiz}/attempts', [QuizController::class, 'submitAttempt']);
    Route::post('/quizzes/{quiz}/questions/{question}/regenerate', [QuizController::class, 'regenerateQuestion'])->middleware('throttle:20,1');
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy']);

    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::patch('/schedules/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('/schedules/{schedule}', [ScheduleController::class, 'destroy']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    Route::get('/reminders', [ReminderController::class, 'index']);
    Route::post('/reminders/{reminder}/dismiss', [ReminderController::class, 'dismiss']);

    Route::get('/study-plans', [StudyPlannerController::class, 'index']);
    Route::post('/study-plans/generate', [StudyPlannerController::class, 'generate']);
    Route::get('/study-plans/{studyPlan}', [StudyPlannerController::class, 'show']);
    Route::post('/study-plans/{studyPlan}/approve', [StudyPlannerController::class, 'approvePlan']);
    Route::patch('/study-sessions/{studySession}', [StudyPlannerController::class, 'updateSession']);
    Route::post('/study-sessions/{studySession}/reschedule', [StudyPlannerController::class, 'rescheduleSession']);
    Route::delete('/study-plans/{studyPlan}', [StudyPlannerController::class, 'destroy']);
});
