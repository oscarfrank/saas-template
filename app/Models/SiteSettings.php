<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSettings extends Model
{
    use HasFactory;

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
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
    ];

    public static function getSettings()
    {
        return self::first() ?? new self();
    }
}
