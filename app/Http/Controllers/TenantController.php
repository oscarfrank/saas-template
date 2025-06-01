<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function create()
    {
        return Inertia::render('tenants/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug',
        ]);

        $tenant = Tenant::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['slug']),
        ]);

        // Initialize the tenant
        $tenant->createDomain(['domain' => $tenant->slug]);

        return redirect()->route('tenant.dashboard', ['tenant' => $tenant->slug]);
    }
} 