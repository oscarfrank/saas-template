<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'blocked_by_task_id',
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

    /** Task that must be completed before this one (this task is blocked by that one). */
    public function blockedByTask(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'blocked_by_task_id');
    }

    /** Tasks that are blocked by this task (they wait on this one). */
    public function blockingTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'blocked_by_task_id');
    }

    /**
     * Check if setting blocked_by_task_id would create a cycle (e.g. A→B→A).
     */
    public static function wouldCreateCycle(int $taskId, ?int $newBlockerId): bool
    {
        if ($newBlockerId === null || $taskId === $newBlockerId) {
            return false;
        }
        $seen = [$taskId => true];
        $current = $newBlockerId;
        while ($current !== null) {
            if (isset($seen[$current])) {
                return true;
            }
            $seen[$current] = true;
            $t = self::where('id', $current)->value('blocked_by_task_id');
            $current = $t;
        }
        return false;
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
