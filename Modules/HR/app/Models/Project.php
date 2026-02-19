<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Project extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_projects';

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
        'owner_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'owner_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'project_id');
    }
}
