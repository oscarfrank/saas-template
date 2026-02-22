<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class StaffEvent extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_staff_events';

    protected $fillable = [
        'tenant_id',
        'staff_id',
        'event_type',
        'title',
        'description',
        'old_values',
        'new_values',
        'changed_by_user_id',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public const TYPE_POLICY_VIOLATION = 'policy_violation';
    public const TYPE_WARNING = 'warning';
    public const TYPE_COMMENDATION = 'commendation';
    public const TYPE_NOTE = 'note';
    public const TYPE_SALARY_CHANGE = 'salary_change';
    public const TYPE_POSITION_CHANGE = 'position_change';
    public const TYPE_GENERAL = 'general';

    public static function eventTypeLabels(): array
    {
        return [
            self::TYPE_POLICY_VIOLATION => 'Policy violation',
            self::TYPE_WARNING => 'Warning',
            self::TYPE_COMMENDATION => 'Commendation',
            self::TYPE_NOTE => 'Note',
            self::TYPE_SALARY_CHANGE => 'Salary change',
            self::TYPE_POSITION_CHANGE => 'Position change',
            self::TYPE_GENERAL => 'General',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
