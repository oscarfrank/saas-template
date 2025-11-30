<?php

namespace Modules\Activity\Http\Controllers;

use Modules\User\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

use Modules\Activity\Models\Activity;

use App\Http\Controllers\Controller;
use Modules\Activity\Services\ActivityCounterService; 

class ActivityController extends Controller
{
    public const PER_PAGE = 10;

    // ADMIN ACTIVITY

    public function index(Request $request)
    {
        $activities = Activity::with(['causer' => function($query) {
                $query->select('id', 'first_name', 'last_name', 'email');
            }])
            ->latest()
            ->paginate(self::PER_PAGE);

        return Inertia::render('activity/admin/index', [
            'activities' => $activities,
        ]);
    }

    public function loadMore(Request $request)
    {
        $page = $request->input('page', 1);
        
        $activities = Activity::with(['causer' => function($query) {
                $query->select('id', 'first_name', 'last_name', 'email');
            }])
            ->latest()
            ->paginate(self::PER_PAGE, ['*'], 'page', $page);

        return Inertia::render('activity/admin/index', [
            'activities' => $activities,
        ]);
    }

    public function getLoadMore(Request $request)
    {
        return Inertia::render('activity/admin/index', [
            'activities' => Activity::with(['causer' => function($query) {
                $query->select('id', 'first_name', 'last_name', 'email');
            }])
            ->latest()
            ->paginate(self::PER_PAGE)
        ]);
    }


    // USER ACTIVITY

    public function user()
    {
        $user = auth()->user();

        
        $activities = Activity::where(function($query) use ($user) {
            $query->where('causer_id', $user->id)
                  ->orWhere('subject_id', $user->id)
                  ->orWhere(function($q) use ($user) {
                      $q->where('subject_type', 'App\\Models\\User')
                        ->where('subject_id', $user->id);
                  })
                  ->orWhere('properties->affected_user_id', (string) $user->id );
        })
        ->with('causer:id,first_name,last_name,email')
        ->latest()
        ->paginate(self::PER_PAGE);

        return Inertia::render('activity/user/index', [
            'activities' => $activities
        ]);
    }

    

    public function userLoadMore(Request $request)
    {
        $user = auth()->user();
        $page = $request->input('page', 1);
        
        $activities = Activity::where(function($query) use ($user) {
            $query->where('causer_id', $user->id)
                  ->orWhere('subject_id', $user->id)
                  ->orWhere(function($q) use ($user) {
                      $q->where('subject_type', 'App\\Models\\User')
                        ->where('subject_id', $user->id);
                  })
                  ->orWhere('properties->affected_user_id', (string) $user->id );
        })
        ->with('causer:id,first_name,last_name,email')
        ->latest()
        ->paginate(self::PER_PAGE, ['*'], 'page', $page);

        return Inertia::render('activity/user/index', [
            'activities' => $activities
        ]);
    }

    public function getUserLoadMore(Request $request)
    {
        $user = auth()->user();
        $page = $request->input('page', 1);
        
        $activities = Activity::where(function($query) use ($user) {
            $query->where('causer_id', $user->id)
                  ->orWhere('subject_id', $user->id)
                  ->orWhere(function($q) use ($user) {
                      $q->where('subject_type', 'App\\Models\\User')
                        ->where('subject_id', $user->id);
                  })
                  ->orWhere('properties->affected_user_id', (string) $user->id );
        })
        ->with('causer:id,first_name,last_name,email')
        ->latest()
        ->paginate(self::PER_PAGE, ['*'], 'page', $page);

        return Inertia::render('activity/user/index', [
            'activities' => $activities
        ]);
    }


    public function getNotifications(Request $request)
    {
        $user = auth()->user();
        $page = $request->input('page', 1);
        
        $activities = Activity::where(function($query) use ($user) {
            $query->where('causer_id', $user->id)
                  ->orWhere('subject_id', $user->id)
                  ->orWhere(function($q) use ($user) {
                      $q->where('subject_type', 'App\\Models\\User')
                        ->where('subject_id', $user->id);
                  })
                  ->orWhere('properties->affected_user_id', (string) $user->id );
        })
        ->with('causer:id,first_name,last_name,email')
        ->latest()
        ->paginate(self::PER_PAGE, ['*'], 'page', $page);

        $unreadCount = app(ActivityCounterService::class)->getUnreadCount(tenant()->id, $user->id);

        if ($request->wantsJson()) {
            return response()->json([
                'activities' => $activities,
                'unread_count' => $unreadCount
            ]);
        }

        return back();
    }

    public function resetCounter(Request $request)
    {
        $user = auth()->user();
        
        app(ActivityCounterService::class)->resetCounter(tenant()->id, $user->id);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }


    

    
} 