<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class StaffPositionHistory extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_staff_position_history';

    /** @var list<string> Legacy string column may remain on SQLite. */
    protected $hidden = [
        'department',
    ];

    protected $fillable = [
        'tenant_id',
        'staff_id',
        'job_title',
        'department_id',
        'started_at',
        'ended_at',
        'salary',
        'salary_currency',
        'pay_frequency',
    ];

    protected $casts = [
        'started_at' => 'date',
        'ended_at' => 'date',
        'salary' => 'decimal:2',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
