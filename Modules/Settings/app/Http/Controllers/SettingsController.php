<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Tenant;
use Illuminate\Support\Str;

use Modules\User\Models\UserPreference;

class SettingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('settings::index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('settings::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {}

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        return view('settings::show');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('settings::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id) {}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {}

    /**
     * Display user preferences settings.
     */
    public function preferences()
    {
        $preferences = UserPreference::getForUser(auth()->id());
        
        return Inertia::render('settings/preferences', [
            'preferences' => $preferences->preferences,
        ]);
    }

    /**
     * Update user preferences.
     */
    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'language' => ['required', 'string', 'in:en,es,fr,de'],
            'timezone' => ['required', 'string'],
            'date_format' => ['required', 'string', 'in:MM/DD/YYYY,DD/MM/YYYY,YYYY-MM-DD'],
            'time_format' => ['required', 'string', 'in:12h,24h'],
            'email_notifications' => ['required', 'boolean'],
            'marketing_emails' => ['required', 'boolean'],
            'activity_visibility' => ['required', 'string', 'in:public,private,connections'],
        ]);

        $preferences = UserPreference::getForUser(auth()->id());
        $preferences->updatePreferences($validated);
        $preferences->save();

        return back()->with('success', 'Preferences updated successfully.');
    }

    /**
     * Display user connections settings.
     */
    public function connections()
    {
        return Inertia::render('settings/connections');
    }

    /**
     * Display user connections settings.
     */
    public function appearance()
    {
        return Inertia::render('settings/appearance');
    }

    /**
     * Display organization general settings.
     */
    public function organizationGeneral()
    {
        $user = auth()->user();
        
        // Get all tenants the user belongs to
        $allTenants = $user->tenants;

        try {
            $userRoles = $user->getRoleNames();
            $userPermissions = $user->getAllPermissions()->pluck('name');
        } catch (\Exception $e) {
            \Log::error('Error getting user roles and permissions: ' . $e->getMessage());
            $userRoles = [];
            $userPermissions = [];
        }

        return Inertia::render('settings/organization/general', [
            'user' => [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'email' => $user->email,
            ],
            'all_tenants' => $allTenants->map(function($tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'role' => $tenant->pivot->role,
                ];
            }),
            'user_roles' => $userRoles,
            'user_permissions' => $userPermissions,
            'industries' => [
                'Technology',
                'Healthcare',
                'Finance',
                'Education',
                'Manufacturing',
                'Retail',
                'Other',
            ],
            'organizationSizes' => [
                '1-10',
                '11-50',
                '51-200',
                '201-500',
                '501-1000',
                '1000+',
            ],
        ]);
    }

    /**
     * Display organization people settings.
     */
    public function organizationPeople()
    {
        return Inertia::render('settings/organization/people');
    }

    /**
     * Display organization teamspaces settings.
     */
    public function organizationTeamspaces()
    {
        return Inertia::render('settings/organization/teamspaces');
    }

    /**
     * Display API keys settings.
     */
    public function apiKeys()
    {
        return Inertia::render('settings/api-keys');
    }

    /**
     * Display webhooks settings.
     */
    public function webhooks()
    {
        return Inertia::render('settings/webhooks');
    }

    /**
     * Display audit logs.
     */
    public function auditLogs()
    {
        return Inertia::render('settings/audit-logs');
    }

    /**
     * Update organization settings.
     */
    public function updateOrganization(Request $request)
    {
        $tenant = auth()->user()->tenant;
        
        if (!$tenant) {
            return redirect()->route('profile.edit')
                ->with('error', 'You must be part of an organization to update these settings.');
        }

        // Check if user has permission to update tenant
        if (!$tenant->isOwnedBy(auth()->user())) {
            return back()->with('error', 'You do not have permission to update organization settings.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug,' . $tenant->id,
            'description' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'industry' => 'required|string|max:255',
            'size' => 'required|string|max:255',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $tenant->update($validated);

        return back()->with('success', 'Organization settings updated successfully.');
    }

    /**
     * Create new API key.
     */
    public function createApiKey(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'required|array',
            'expires_at' => 'nullable|date',
        ]);

        // Create API key logic here

        return back()->with('success', 'API key created successfully.');
    }

    /**
     * Create new webhook.
     */
    public function createWebhook(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:255',
            'events' => 'required|array',
        ]);

        // Create webhook logic here

        return back()->with('success', 'Webhook created successfully.');
    }
}
