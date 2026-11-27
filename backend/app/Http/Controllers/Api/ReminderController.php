<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use App\Support\OwnsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    use OwnsResource;

    public function index(Request $request): JsonResponse
    {
        $reminders = Reminder::query()
            ->where('user_id', $request->user()->id)
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->string('status')))
            ->orderBy('remind_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($reminders);
    }

    public function dismiss(Request $request, Reminder $reminder): JsonResponse
    {
        $this->authorizeOwnership($request, $reminder);

        $reminder->update([
            'status' => 'dismissed',
        ]);

        return response()->json([
            'reminder' => $reminder->fresh(),
        ]);
    }
}
