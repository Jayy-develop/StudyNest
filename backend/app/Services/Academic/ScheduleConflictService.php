<?php

namespace App\Services\Academic;

use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ScheduleConflictService
{
    /**
     * @param  array<string, mixed>  $candidate
     * @return Collection<int, Schedule>
     */
    public function findConflicts(int $userId, array $candidate, ?int $ignoreScheduleId = null): Collection
    {
        $query = Schedule::query()
            ->with('course:id,name,color')
            ->where('user_id', $userId);

        if ($ignoreScheduleId !== null) {
            $query->where('id', '!=', $ignoreScheduleId);
        }

        $candidateStart = $this->toMinutes((string) $candidate['start_time']);
        $candidateEnd = $this->toMinutes((string) $candidate['end_time']);
        $isRecurring = (bool) ($candidate['is_recurring'] ?? true);
        $candidateDay = isset($candidate['day_of_week']) ? (int) $candidate['day_of_week'] : null;
        $candidateDate = isset($candidate['specific_date']) && $candidate['specific_date']
            ? Carbon::parse((string) $candidate['specific_date'])->toDateString()
            : null;

        if (! $isRecurring && $candidateDate !== null && $candidateDay === null) {
            $candidateDay = Carbon::parse($candidateDate)->dayOfWeekIso;
        }

        return $query->get()->filter(function (Schedule $existing) use (
            $candidateStart,
            $candidateEnd,
            $isRecurring,
            $candidateDay,
            $candidateDate
        ) {
            $existingStart = $this->toMinutes((string) $existing->start_time);
            $existingEnd = $this->toMinutes((string) $existing->end_time);

            if (! ($candidateStart < $existingEnd && $candidateEnd > $existingStart)) {
                return false;
            }

            if ($isRecurring && $existing->is_recurring) {
                return (int) $existing->day_of_week === $candidateDay;
            }

            if (! $isRecurring && ! $existing->is_recurring) {
                return $existing->specific_date?->toDateString() === $candidateDate;
            }

            if ($isRecurring && ! $existing->is_recurring && $existing->specific_date) {
                return $existing->specific_date->dayOfWeekIso === $candidateDay;
            }

            if (! $isRecurring && $existing->is_recurring && $candidateDate !== null) {
                return Carbon::parse($candidateDate)->dayOfWeekIso === (int) $existing->day_of_week;
            }

            return false;
        })->values();
    }

    public function toMinutes(string $time): int
    {
        $parts = explode(':', $time);

        return ((int) ($parts[0] ?? 0) * 60) + (int) ($parts[1] ?? 0);
    }
}
