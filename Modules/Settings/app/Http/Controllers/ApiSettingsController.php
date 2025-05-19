<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Settings\Models\ApiSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApiSettingsController extends Controller
{
    public function index()
    {
        $apiSettings = ApiSetting::all();

        return Inertia::render('admin/settings/api-settings', [
            'apiSettings' => $apiSettings,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'apiSettings' => 'required|array',
            'apiSettings.*.name' => 'required|string|max:255',
            'apiSettings.*.type' => 'required|in:payment,ai,email,other',
            'apiSettings.*.api_key' => 'required|string',
            'apiSettings.*.api_secret' => 'nullable|string',
            'apiSettings.*.webhook_url' => 'nullable|string',
            'apiSettings.*.is_active' => 'boolean',
            'apiSettings.*.additional_data' => 'nullable|array',
        ]);

        // Delete existing settings
        ApiSetting::truncate();

        // Create new settings
        foreach ($request->apiSettings as $setting) {
            ApiSetting::create([
                'name' => $setting['name'],
                'type' => $setting['type'],
                'api_key' => $setting['api_key'],
                'api_secret' => $setting['api_secret'] ?? null,
                'webhook_url' => $setting['webhook_url'] ?? null,
                'is_active' => $setting['is_active'] ?? true,
                'additional_data' => $setting['additional_data'] ?? null,
            ]);
        }

        return redirect()->back()->with('success', 'API settings updated successfully.');
    }
}
