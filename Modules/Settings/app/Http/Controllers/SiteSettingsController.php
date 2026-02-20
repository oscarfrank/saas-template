<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Settings\Models\SiteSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SiteSettingsController extends Controller
{
    public function index()
    {
        $settings = SiteSettings::getSettings();
        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'homepageThemes' => config('homepage.themes', ['lending' => 'Lending']),
        ]);
    }

    public function update(Request $request)
    {
        $themeKeys = array_keys(config('homepage.themes', ['lending' => 'Lending']));

        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'site_title' => 'required|string|max:255',
            'site_description' => 'nullable|string',
            'site_keywords' => 'nullable|string',
            'site_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'site_favicon' => 'nullable|image|mimes:jpeg,png,jpg,gif,ico|max:1024',
            'company_name' => 'required|string|max:255',
            'company_address' => 'required|string|max:255',
            'company_phone' => 'required|string|max:255',
            'company_email' => 'required|email|max:255',
            'company_website' => 'nullable|url|max:255',
            'facebook_url' => 'nullable|url|max:255',
            'twitter_url' => 'nullable|url|max:255',
            'instagram_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
            'youtube_url' => 'nullable|url|max:255',
            'google_analytics_code' => 'nullable|string',
            'meta_tags' => 'nullable|string',
            'footer_text' => 'nullable|string',
            'maintenance_mode' => 'boolean',
            'homepage_theme' => ['required', 'string', Rule::in($themeKeys)],
            'homepage_redirect_url' => [
                'nullable',
                'string',
                'max:500',
                'required_if:homepage_theme,redirect',
                'url',
            ],
        ]);

        $settings = SiteSettings::getSettings();

        // Store under the public disk (like Script thumbnails) so files are served at /storage/...
        // Previously used default disk (local → storage/app/private), which led to 403 when loading the icon.
        $publicDisk = 'public';
        $settingsDir = 'settings';

        // Handle logo upload
        if ($request->hasFile('site_logo')) {
            if ($settings->site_logo) {
                $oldPath = str_starts_with($settings->site_logo, 'public/') ? substr($settings->site_logo, 7) : $settings->site_logo;
                Storage::disk($publicDisk)->delete($oldPath);
            }
            $validated['site_logo'] = $request->file('site_logo')->store($settingsDir, $publicDisk);
        }

        // Handle favicon upload
        if ($request->hasFile('site_favicon')) {
            if ($settings->site_favicon) {
                $oldPath = str_starts_with($settings->site_favicon, 'public/') ? substr($settings->site_favicon, 7) : $settings->site_favicon;
                Storage::disk($publicDisk)->delete($oldPath);
            }
            $validated['site_favicon'] = $request->file('site_favicon')->store($settingsDir, $publicDisk);
        }

        $settings->update($validated);

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
