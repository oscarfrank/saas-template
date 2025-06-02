<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
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
        return Inertia::render('tenants/create');
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'required|string|max:255|unique:tenants,slug',
            ]);

            $tenant = Tenant::create([
                'id' => $validated['slug'],
                'name' => $validated['name'],
                'slug' => $validated['slug'],
            ]);

            // Initialize the tenant
            $tenant->createDomain(['domain' => $tenant->slug]);

            // Associate the creating user with the tenant
            $request->user()->tenants()->attach($tenant->id);

            return redirect()->route('tenants.index')
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
} 