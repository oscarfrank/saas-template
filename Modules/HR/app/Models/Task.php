<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Modules\Script\Models\Script;

class Task extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_tasks';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'project_id',
        'assigned_to',
        'script_id',
        'title',
        'description',
        'status',
        'priority',
        'due_at',
        'completed_at',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'assigned_to');
    }

    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class, 'script_id');
    }

    protected static function booted(): void
    {
        static::creating(function (Task $task) {
            if (empty($task->uuid)) {
                $task->uuid = \Illuminate\Support\Str::uuid()->toString();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}
