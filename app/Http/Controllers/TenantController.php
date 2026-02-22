<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::latest()->paginate(10);
        
        return Inertia::render('tenants/index', [
            'tenants' => $tenants->items(),
            'pagination' => [
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ],
        ]);
    }

    public function dashboard()
    {
        $tenant = tenant();
        return Inertia::render('tenants/dashboard', [
            'tenant' => $tenant
        ]);
    }

    public function create()
    {
        // Get pending invites for the current user
        $pendingInvites = \Modules\Settings\Models\OrganizationInvite::where('email', auth()->user()->email)
            ->where('status', 'pending')
            ->with('tenant')
            ->get()
            ->map(function ($invite) {
                return [
                    'id' => $invite->id,
                    'organization' => $invite->tenant->name,
                    'role' => $invite->role,
                    'invited_at' => $invite->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('tenants/create', [
            'pendingInvites' => $pendingInvites
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'required|string|max:255|unique:tenants,slug',
                'invites' => 'required|json',
            ]);

            // Decode the invites JSON
            $invites = json_decode($validated['invites'], true);
            
            // Validate the decoded invites array
            if (!is_array($invites)) {
                return back()->withErrors(['invites' => 'The invites must be an array.'])->withInput();
            }

            // Validate each invite
            foreach ($invites as $invite) {
                if (!isset($invite['email']) || !filter_var($invite['email'], FILTER_VALIDATE_EMAIL)) {
                    return back()->withErrors(['invites' => 'Invalid email in invites.'])->withInput();
                }
                if (!isset($invite['role']) || !in_array($invite['role'], ['admin', 'member'])) {
                    return back()->withErrors(['invites' => 'Invalid role in invites.'])->withInput();
                }
            }

            $tenant = Tenant::create([
                'id' => $validated['slug'],
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'created_by' => auth()->user()->id,
            ]);

            // Store organization logo on central public disk so it is served at /storage/... (not tenant-prefixed)
            if ($request->hasFile('logo')) {
                $request->validate(['logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048']);
                $path = $request->file('logo')->store('organization-logos/'.$tenant->id, 'public_central');
                $tenant->data = array_merge($tenant->data ?? [], ['logo' => $path]);
                $tenant->save();
            }

            // Initialize the tenant
            $tenant->createDomain(['domain' => $tenant->slug]);

            // Associate the creating user with the tenant
            $request->user()->tenants()->attach($tenant->id, ['role' => 'owner']);

            // Process invites if any
            if (!empty($invites)) {
                foreach ($invites as $inviteData) {
                    // Check if user is already a member
                    if ($tenant->users()->where('email', $inviteData['email'])->exists()) {
                        continue;
                    }

                    // Create the invite
                    $invite = \Modules\Settings\Models\OrganizationInvite::create([
                        'tenant_id' => $tenant->id,
                        'email' => $inviteData['email'],
                        'role' => $inviteData['role'],
                        'invited_by' => auth()->id(),
                        'status' => 'pending',
                        'token' => \Str::random(32),
                        'expires_at' => now()->addDays(7),
                    ]);

                    // Send the invite email
                    // \Illuminate\Support\Facades\Mail::to($inviteData['email'])
                    //     ->send(new \Modules\Settings\Mail\OrganizationInvite($invite));
                }
            }

            return redirect()->route('dashboard', $tenant->slug)
                ->with('success', 'Organization created successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        }
    }

    public function edit(Tenant $tenant)
    {
        return Inertia::render('tenants/edit', [
            'tenant' => $tenant
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'required|string|max:255|unique:tenants,slug,' . $tenant->id,
            ]);

            $tenant->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
            ]);

            return redirect()->route('tenants.index')
                ->with('success', 'Organization updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        }
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();
        return redirect()->route('tenants.index')
            ->with('success', 'Organization deleted successfully.');
    }

    public function acceptInvite(string $inviteId)
    {
        try {
            $invite = \Modules\Settings\Models\OrganizationInvite::where('id', $inviteId)
                ->where('email', auth()->user()->email)
                ->where('status', 'pending')
                ->first();

            if (!$invite) {
                return back()->with('error', 'Invalid or expired invitation.');
            }

            if ($invite->isExpired()) {
                $invite->update(['status' => 'expired']);
                return back()->with('error', 'This invitation has expired.');
            }

            // Add user to the organization
            $invite->tenant->users()->attach(auth()->id(), [
                'role' => $invite->role
            ]);

            // Mark invite as accepted
            $invite->delete();

            return redirect()->route('dashboard', $invite->tenant->slug)->with('success', 'You have successfully joined ' . $invite->tenant->name);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to accept invitation.');
        }
    }

    public function invites()
    {
        $pendingInvites = \Modules\Settings\Models\OrganizationInvite::where('email', auth()->user()->email)
            ->where('status', 'pending')
            ->with('tenant')
            ->get()
            ->map(function ($invite) {
                return [
                    'id' => $invite->id,
                    'organization' => $invite->tenant->name,
                    'role' => $invite->role,
                    'invited_at' => $invite->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('tenants/invites', [
            'pendingInvites' => $pendingInvites
        ]);
    }

    public function declineInvite(string $inviteId)
    {
        try {
            $invite = \Modules\Settings\Models\OrganizationInvite::where('id', $inviteId)
                ->where('email', auth()->user()->email)
                ->where('status', 'pending')
                ->first();

            if (!$invite) {
                return back()->with('error', 'Invalid or expired invitation.');
            }

            // Mark invite as declined by deleting it
            $invite->delete();

            return back()->with('success', 'Invitation declined successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to decline invitation.');
        }
    }

} 