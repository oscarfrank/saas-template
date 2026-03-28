<?php

namespace Modules\Settings\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSettings extends Model
{
    use HasFactory;

    protected $attributes = [
        'homepage_theme' => 'lending',
    ];

    protected $fillable = [
        'site_name',
        'site_title',
        'site_description',
        'site_keywords',
        'site_logo',
        'site_favicon',
        'company_name',
        'company_address',
        'company_phone',
        'company_email',
        'company_website',
        'facebook_url',
        'twitter_url',
        'instagram_url',
        'linkedin_url',
        'youtube_url',
        'google_analytics_code',
        'meta_tags',
        'footer_text',
        'maintenance_mode',
        'homepage_theme',
        'homepage_redirect_url',
        'allowed_org_default_landing_paths',
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
        'allowed_org_default_landing_paths' => 'array',
    ];

    public static function getSettings()
    {
        return self::first() ?? new self;
    }

    /**
     * Paths org owners may set as default landing (Settings → Organization).
     * Null or empty stored value means all paths from config are allowed.
     *
     * @return list<string>
     */
    public function getAllowedOrgDefaultLandingPaths(): array
    {
        $all = array_keys(config('homepage.org_default_landing_paths', []));
        $stored = $this->allowed_org_default_landing_paths;
        if (! is_array($stored) || $stored === []) {
            return $all;
        }
        $intersect = array_values(array_intersect($all, $stored));

        return $intersect !== [] ? $intersect : $all;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function orgDefaultLandingOptionsForSelect(): array
    {
        $labels = config('homepage.org_default_landing_paths', []);
        $allowed = self::getSettings()->getAllowedOrgDefaultLandingPaths();
        $out = [];
        foreach ($allowed as $path) {
            if (isset($labels[$path])) {
                $out[] = ['value' => $path, 'label' => $labels[$path]];
            }
        }

        return $out;
    }
}
