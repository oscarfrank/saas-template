<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Tenant;
use Illuminate\Support\Str;

use Modules\User\Models\UserPreference;
use Modules\Settings\Models\OrganizationInvite;
use Illuminate\Support\Facades\Mail;
use Modules\Settings\Mail\OrganizationInvite as OrganizationInviteMail;

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
        // Get current tenant ID from session or user preferences
        $tenant = tenant();

        // Get the current user's role in the tenant
        $userRole = $tenant->users()
            ->where('users.id', auth()->id())
            ->first()
            ->pivot
            ->role;

        $members = $tenant->users()->with('roles')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'email' => $user->email,
                'role' => $user->pivot->role,
                'avatar' => $user->avatar ?? '👤',
                'joinedAt' => $user->pivot->created_at->format('M j, Y'),
            ];
        });

        $invites = OrganizationInvite::where('tenant_id', $tenant->id)
            ->where('status', 'pending')
            ->with('invitedBy')
            ->get()
            ->map(function ($invite) {
                return [
                    'id' => $invite->id,
                    'email' => $invite->email,
                    'role' => $invite->role,
                    'invitedBy' => $invite->invitedBy->first_name . ' ' . $invite->invitedBy->last_name,
                    'invitedAt' => $invite->created_at->diffForHumans(),
                    'status' => $invite->status,
                ];
            });

        \Log::info('OrganizationPeople data retrieved', [
            'tenant_id' => $tenant->id,
            'members_count' => $members->count(),
            'invites_count' => $invites->count()
        ]);

        return Inertia::render('settings/organization/people', [
            'members' => $members,
            'invites' => $invites,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Send an organization invite.
     */
    public function sendInvite(Request $request)
    {

        $tenant = tenant();
        
        if (!$tenant) {
            return redirect()->route('profile.edit')
                ->with('error', 'You must be part of an organization to send invites.');
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:admin,member',
        ]);

        // Check if user is already a member
        if ($tenant->users()->where('email', $validated['email'])->exists()) {
            return back()->with('error', 'This user is already a member of your organization.');
        }

        // Check if there's already a pending invite
        if (OrganizationInvite::where('tenant_id', $tenant->id)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->exists()) {
            return back()->with('error', 'An invite has already been sent to this email.');
        }


        $invite = OrganizationInvite::create([
            'tenant_id' => $tenant->id,
            'email' => $validated['email'],
            'role' => $validated['role'],
            'invited_by' => auth()->id(),
            'status' => 'pending',
            'token' => \Str::random(32),
            'expires_at' => now()->addDays(7),
        ]);

        
        // Log the invite URL for debugging
        \Log::info('Organization invite URL: ' . $invite->getInviteUrl());

        // Send the invite email
        // Mail::to($validated['email'])->send(new OrganizationInviteMail($invite));

        return back()->with('success', 'Invite sent successfully.');
    }

    /**
     * Cancel an organization invite.
     */
    public function cancelInvite(Request $request, OrganizationInvite $invite)
    {
        $tenant = tenant();

        if($invite->tenant_id != $tenant->id){
            return back()->with('error', 'You do not have permission to cancel this invite.');
        }
        
        $invite->delete();

        return back()->with('success', 'Invite cancelled successfully.');
    }

    /**
     * Resend an organization invite.
     */
    public function resendInvite(Request $request, OrganizationInvite $invite)
    {
        $tenant = auth()->user()->tenant;
        
        if (!$tenant || $invite->tenant_id !== $tenant->id) {
            return back()->with('error', 'You do not have permission to resend this invite.');
        }

        $token = $invite->generateToken();
        
        // Log the invite URL for debugging
        \Log::info('Organization invite URL (resend): ' . $invite->getInviteUrl());

        // Send the invite email
        Mail::to($invite->email)->send(new OrganizationInviteMail($invite));

        return back()->with('success', 'Invite resent successfully.');
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

    /**
     * Accept an organization invite.
     */
    public function acceptInvite(string $token)
    {
        $invite = OrganizationInvite::where('token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$invite) {
            return redirect()->route('login')
                ->with('error', 'Invalid or expired invitation.');
        }

        if ($invite->isExpired()) {
            $invite->update(['status' => 'expired']);
            return redirect()->route('login')
                ->with('error', 'This invitation has expired.');
        }

        // If user is not logged in, store the invite token in session and redirect to login
        if (!auth()->check()) {
            session(['organization_invite_token' => $token]);
            return redirect()->route('login');
        }

        // Check if user is already a member of the organization
        if ($invite->tenant->users()->where('email', auth()->user()->email)->exists()) {
            // $invite->update(['status' => 'accepted']);
            $invite->delete();
            return redirect()->route('dashboard')
                ->with('error', 'You are already a member of this organization.');
        }

        // Add user to the organization
        $invite->tenant->users()->attach(auth()->id(), [
            'role' => $invite->role
        ]);

        // Mark invite as accepted
        // $invite->update(['status' => 'accepted']);
        $invite->delete();

        return redirect()->route('dashboard')
            ->with('success', 'You have successfully joined ' . $invite->tenant->name);
    }


    public function updateMemberRole(Request $request, $memberId)
    {
        $request->validate([
            'role' => ['required', 'string', 'in:admin,member,owner'],
        ]);

        $tenant = tenant();
        if (!$tenant) {
            return back()->withErrors(['role' => 'No organization found']);
        }

        $member = $tenant->users()->findOrFail($memberId);

        // Prevent changing owner's role
        if ($member->pivot->role === 'owner') {
            return back()->withErrors(['role' => 'Cannot change owner\'s role']);
        }

        // Prevent changing your own role
        if ($member->id === $request->user()->id) {
            return back()->withErrors(['role' => 'Cannot change your own role']);
        }

        $member->pivot->update([
            'role' => $request->role
        ]);

        return back();
    }

    public function removeMember(Request $request, $memberId)
    {
        $tenant = tenant();
        if (!$tenant) {
            return back()->withErrors(['member' => 'No organization found']);
        }

        $member = $tenant->users()->findOrFail($memberId);

        // Prevent removing owner
        if ($member->pivot->role === 'owner') {
            return back()->withErrors(['member' => 'Cannot remove the organization owner']);
        }

        // Prevent removing yourself
        if ($member->id === $request->user()->id) {
            return back()->withErrors(['member' => 'Cannot remove yourself from the organization']);
        }

        // Detach the member from the tenant
        $tenant->users()->detach($member->id);

        return back()->with('success', 'Member removed successfully');
    }
}
