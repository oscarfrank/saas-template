<?php

namespace Modules\User\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class UserPreference extends Model
{
    use CentralConnection;
    protected $fillable = [
        'user_id',
        'preferences',
    ];

    protected $casts = [
        'preferences' => 'array',
    ];

    /**
     * Default preferences structure
     */
    protected $defaultPreferences = [
        'language' => 'en',
        'timezone' => 'UTC',
        'date_format' => 'MM/DD/YYYY',
        'time_format' => '12h',
        'email_notifications' => true,
        'marketing_emails' => false,
        'activity_visibility' => 'connections',
        'last_visited_page' => null,
        'last_tenant_id' => null,
        /** 'organization_default' = use org default landing; 'last_visited' = go to last page before logout */
        'landing_behavior' => 'organization_default',
    ];

    /**
     * Get the user that owns the preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\Models\User::class);
    }

    /**
     * Get or create preferences for a user.
     */
    public static function getForUser(int $userId): self
    {
        \Log::info('Getting preferences for user', [
            'user_id' => $userId
        ]);

        $preferences = static::firstOrCreate(
            ['user_id' => $userId],
            [
                'preferences' => (new static)->defaultPreferences,
            ]
        );

        \Log::info('User preferences retrieved/created', [
            'user_id' => $userId,
            'preferences' => $preferences->preferences,
            'was_created' => $preferences->wasRecentlyCreated
        ]);

        return $preferences;
    }

    /**
     * Get a specific preference value.
     */
    public function get(string $key, $default = null)
    {
        return $this->preferences[$key] ?? $default;
    }

    /**
     * Set a specific preference value.
     */
    public function set(string $key, $value): self
    {

        $preferences = $this->preferences;
        $preferences[$key] = $value;
        $this->preferences = $preferences;

        return $this;
    }

    /**
     * Update multiple preferences at once.
     */
    public function updatePreferences(array $preferences): self
    {
        $this->preferences = array_merge($this->preferences, $preferences);
        return $this;
    }

    /**
     * Check if a preference exists.
     */
    public function has(string $key): bool
    {
        return isset($this->preferences[$key]);
    }

    /**
     * Remove a preference.
     */
    public function remove(string $key): self
    {
        $preferences = $this->preferences;
        unset($preferences[$key]);
        $this->preferences = $preferences;
        return $this;
    }

    /**
     * Update the last visited page.
     */
    public function updateLastVisitedPage(string $path): self
    {
        return $this->set('last_visited_page', $path);
    }

    /**
     * Update the last tenant ID.
     */
    public function updateLastTenantId(?string $tenantId): self
    {
        return $this->set('last_tenant_id', $tenantId);
    }

    /**
     * Get the last visited page.
     */
    public function getLastVisitedPage(): ?string
    {
        return $this->get('last_visited_page');
    }

    /**
     * Get the last tenant ID.
     */
    public function getLastTenantId(): ?string
    {
        return $this->get('last_tenant_id');
    }

    /**
     * Get landing behavior: 'organization_default' or 'last_visited'.
     */
    public function getLandingBehavior(): string
    {
        return $this->get('landing_behavior', 'organization_default');
    }

    /**
     * Set landing behavior.
     */
    public function setLandingBehavior(string $value): self
    {
        return $this->set('landing_behavior', $value);
    }

    /**
     * Save the model to the database.
     */
    public function save(array $options = []): bool
    {
        \Log::info('Saving preferences', [
            'preferences' => $this->preferences,
            'preferences_type' => gettype($this->preferences),
            'dirty' => $this->getDirty(),
            'original' => $this->getOriginal(),
            'is_dirty' => $this->isDirty(),
            'attributes' => $this->getAttributes()
        ]);

        $result = parent::save($options);

        \Log::info('Preferences saved', [
            'success' => $result,
            'preferences' => $this->preferences,
            'preferences_type' => gettype($this->preferences),
            'attributes' => $this->getAttributes()
        ]);

        return $result;
    }
} 