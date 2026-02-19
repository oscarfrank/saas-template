<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Evaluation extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_evaluations';

    protected $fillable = [
        'tenant_id',
        'staff_id',
        'period',
        'reviewer_id',
        'ratings',
        'goals',
        'notes',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'ratings' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'reviewer_id');
    }
}
