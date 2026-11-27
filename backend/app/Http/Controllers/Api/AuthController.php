<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:180', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'timezone' => ['nullable', 'timezone', 'max:64'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => UserRole::Student,
            'password' => $validated['password'],
            'timezone' => $validated['timezone'] ?? 'Asia/Jakarta',
            'daily_study_minutes' => 120,
            'preferred_study_time' => 'evening',
            'notification_preferences' => [
                'schedule_reminder' => true,
                'task_reminder' => true,
                'exam_reminder' => true,
                'study_session_reminder' => true,
                'minutes_before' => 30,
            ],
        ]);

        $token = $user->createToken('studynest-web')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau kata sandi tidak valid.',
            ], 401);
        }

        $token = $user->createToken('studynest-web')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'timezone' => ['sometimes', 'timezone', 'max:64'],
            'daily_study_minutes' => ['sometimes', 'integer', 'min:30', 'max:720'],
            'preferred_study_time' => ['sometimes', 'in:morning,afternoon,evening,night'],
            'notification_preferences' => ['sometimes', 'array'],
            'notification_preferences.schedule_reminder' => ['sometimes', 'boolean'],
            'notification_preferences.task_reminder' => ['sometimes', 'boolean'],
            'notification_preferences.exam_reminder' => ['sometimes', 'boolean'],
            'notification_preferences.study_session_reminder' => ['sometimes', 'boolean'],
            'notification_preferences.minutes_before' => ['sometimes', 'integer', 'min:5', 'max:1440'],
        ]);

        $user->fill($validated);
        $user->save();

        return response()->json([
            'user' => $user->fresh(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Berhasil keluar.',
        ]);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        foreach ($user->materials as $material) {
            \Illuminate\Support\Facades\Storage::disk($material->storage_disk)->delete($material->storage_path);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'Akun dan seluruh data akademik berhasil dihapus.',
        ]);
    }
}
