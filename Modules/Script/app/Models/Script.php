<?php

namespace Modules\Script\Models;

use App\Models\TenantScriptRole;
use App\Traits\TenantAwareModelBinding;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Modules\User\Models\User;

class Script extends Model
{
    use BelongsToTenant, TenantAwareModelBinding, SoftDeletes;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'script_type_id',
        'created_by',
        'updated_by',
        'title',
        'thumbnail_text',
        'content',
        'description',
        'meta_tags',
        'live_video_url',
        'status',
        'production_status',
        'visibility',
        'share_token',
        'custom_attributes',
        'published_at',
        'scheduled_at',
    ];

    protected $casts = [
        'content' => 'array',
        'custom_attributes' => 'array',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
    ];

    public function scriptType(): BelongsTo
    {
        return $this->belongsTo(ScriptType::class, 'script_type_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function titleOptions(): HasMany
    {
        return $this->hasMany(ScriptTitleOption::class)->orderBy('sort_order');
    }

    public function thumbnails(): HasMany
    {
        return $this->hasMany(ScriptThumbnail::class)->orderBy('sort_order');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ScriptVersion::class);
    }

    public function collaborators(): HasMany
    {
        return $this->hasMany(ScriptCollaborator::class)->orderBy('role');
    }

    public function accessDenied(): HasMany
    {
        return $this->hasMany(ScriptAccessDenied::class);
    }

    public function coAuthors(): HasMany
    {
        return $this->hasMany(ScriptCoAuthor::class)->orderBy('sort_order');
    }

    protected static function booted(): void
    {
        static::creating(function (Script $script) {
            if (empty($script->uuid)) {
                $script->uuid = \Illuminate\Support\Str::uuid()->toString();
            }
        });

        static::deleting(function (Script $script) {
            // Only cascade when permanently deleting. Soft delete = recycle bin; children stay so we can restore.
            if (! $script->isForceDeleting()) {
                return;
            }
            $script->titleOptions()->delete();
            foreach ($script->thumbnails as $thumb) {
                if ($thumb->storage_path && $thumb->disk) {
                    Storage::disk($thumb->disk)->delete($thumb->storage_path);
                }
                $thumb->delete();
            }
            $script->versions()->delete();
            $script->collaborators()->delete();
            $script->accessDenied()->delete();
            $script->coAuthors()->delete();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function isOwner(?User $user): bool
    {
        return $user && (int) $this->created_by === (int) $user->id;
    }

    /**
     * User is org owner, admin, or editor for this script's tenant — can view, edit, manage access, and delete any script.
     */
    public function hasOrgEditorOrAdminAccess(?User $user): bool
    {
        if (! $user) {
            return false;
        }
        $pivot = $user->tenants()->where('tenants.id', $this->tenant_id)->first()?->pivot;

        return $pivot && in_array($pivot->role, ['owner', 'admin', 'editor'], true);
    }

    /**
     * Resolve effective role: owner → script collaborator → denied → org default.
     * Returns 'owner', 'admin', 'edit', 'view', or null.
     */
    public function effectiveUserRole(?User $user): ?string
    {
        if (! $user) {
            return null;
        }
        if ($this->isOwner($user)) {
            return 'owner';
        }
        $collab = $this->collaborators()->where('user_id', $user->id)->first();
        if ($collab) {
            return $collab->role;
        }
        if ($this->accessDenied()->where('user_id', $user->id)->exists()) {
            return null;
        }
        $orgRole = TenantScriptRole::where('tenant_id', $this->tenant_id)
            ->where('user_id', $user->id)
            ->value('role');

        return $orgRole ?: null;
    }

    /**
     * Get the current user's role: 'owner', 'admin', 'edit', 'view', or null if no access.
     */
    public function userRole(?User $user): ?string
    {
        return $this->effectiveUserRole($user);
    }

    public function canView(?User $user): bool
    {
        if ($this->hasOrgEditorOrAdminAccess($user)) {
            return true;
        }

        return $this->effectiveUserRole($user) !== null;
    }

    public function canEdit(?User $user): bool
    {
        if ($this->hasOrgEditorOrAdminAccess($user)) {
            return true;
        }
        $role = $this->effectiveUserRole($user);
        if (! $role) {
            return false;
        }
        if ($role === 'owner') {
            return true;
        }

        return in_array($role, [ScriptCollaborator::ROLE_EDIT, ScriptCollaborator::ROLE_ADMIN], true);
    }

    public function canDelete(?User $user): bool
    {
        if ($this->hasOrgEditorOrAdminAccess($user)) {
            return true;
        }
        $role = $this->effectiveUserRole($user);
        if (! $role) {
            return false;
        }
        if ($role === 'owner') {
            return true;
        }

        return $role === ScriptCollaborator::ROLE_ADMIN;
    }

    public function canManageAccess(?User $user): bool
    {
        if ($this->hasOrgEditorOrAdminAccess($user)) {
            return true;
        }
        $role = $this->effectiveUserRole($user);
        if (! $role) {
            return false;
        }
        if ($role === 'owner') {
            return true;
        }

        return $role === ScriptCollaborator::ROLE_ADMIN;
    }

    public function getPrimaryTitleOption(): ?ScriptTitleOption
    {
        return $this->titleOptions()->where('is_primary', true)->first();
    }

    public function syncTitleOptionsFromArray(array $options): void
    {
        $ids = [];
        $hasPrimary = false;
        foreach ($options as $index => $item) {
            $title = $item['title'] ?? '';
            $thumbnailText = $item['thumbnail_text'] ?? null;
            $wantsPrimary = (bool) ($item['is_primary'] ?? false);
            if ($wantsPrimary) {
                $hasPrimary = true;
            }
            $id = $item['id'] ?? null;

            if ($id && is_numeric($id)) {
                $option = $this->titleOptions()->find($id);
                if ($option) {
                    $option->update([
                        'title' => $title,
                        'thumbnail_text' => $thumbnailText,
                        'is_primary' => $wantsPrimary,
                        'sort_order' => $index,
                    ]);
                    $ids[] = $option->id;
                    continue;
                }
            }
            $option = $this->titleOptions()->create([
                'title' => $title,
                'thumbnail_text' => $thumbnailText,
                'is_primary' => $wantsPrimary,
                'sort_order' => $index,
            ]);
            $ids[] = $option->id;
        }
        $this->titleOptions()->whereNotIn('id', $ids)->delete();

        $primaries = $this->titleOptions()->where('is_primary', true)->orderBy('sort_order')->get();
        if ($primaries->count() > 1) {
            foreach ($primaries->skip(1) as $p) {
                $p->update(['is_primary' => false]);
            }
        }
        $primary = $this->titleOptions()->where('is_primary', true)->first();
        if ($primary) {
            $this->update([
                'title' => $primary->title,
                'thumbnail_text' => $primary->thumbnail_text,
            ]);
        } elseif ($this->titleOptions()->exists()) {
            $first = $this->titleOptions()->orderBy('sort_order')->first();
            $first->update(['is_primary' => true]);
            $this->update([
                'title' => $first->title,
                'thumbnail_text' => $first->thumbnail_text,
            ]);
        }
    }
}
