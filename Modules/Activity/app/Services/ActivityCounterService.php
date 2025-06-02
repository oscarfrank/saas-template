<?php

namespace Modules\Activity\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Activity\Models\ActivityCounter;

class ActivityCounterService
{
    public function incrementCounter($tenantId, $userId)
    {
        $counter = ActivityCounter::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->first();

        if ($counter) {
            $counter->increment('unread_count');
            Log::info('Incremented existing counter', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'new_count' => $counter->unread_count
            ]);
        } else {
            $counter = ActivityCounter::create([
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'unread_count' => 1
            ]);
            Log::info('Created new counter', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'count' => 1
            ]);
        }

        return $counter->unread_count;
    }
    
    public function decrementCounter($tenantId, $userId, $amount = 1)
    {
        $counter = ActivityCounter::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->first();

        if ($counter) {
            $newCount = max($counter->unread_count - $amount, 0);
            $counter->update(['unread_count' => $newCount]);
            Log::info('Decremented counter', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'old_count' => $counter->unread_count,
                'new_count' => $newCount,
                'amount' => $amount
            ]);
        }

        return $counter ? $counter->unread_count : 0;
    }
    
    public function getUnreadCount($tenantId, $userId)
    {
        Log::info('ActivityCounterService::getUnreadCount called', [
            'tenant_id' => $tenantId,
            'user_id' => $userId
        ]);

        try {
            $count = ActivityCounter::where('tenant_id', $tenantId)
                ->where('user_id', $userId)
                ->value('unread_count') ?? 0;

            Log::info('Retrieved unread count', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'count' => $count,
                'query_executed' => true
            ]);

            return $count;
        } catch (\Exception $e) {
            Log::error('Error in getUnreadCount', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'tenant_id' => $tenantId,
                'user_id' => $userId
            ]);
            return 0;
        }
    }
    
    public function resetCounter($tenantId, $userId)
    {
        $counter = ActivityCounter::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->first();

        if ($counter) {
            $oldCount = $counter->unread_count;
            $counter->update(['unread_count' => 0]);
            Log::info('Reset counter', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'old_count' => $oldCount,
                'new_count' => 0
            ]);
        }

        return 0;
    }
} 