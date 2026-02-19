<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Modules\User\Models\User;

class Staff extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_staff';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'employee_id',
        'department',
        'job_title',
        'salary',
        'salary_currency',
        'pay_frequency',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'started_at' => 'date',
        'ended_at' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    public function paymentRunItems(): HasMany
    {
        return $this->hasMany(PaymentRunItem::class, 'staff_id');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'staff_id');
    }

    public function reviewsGiven(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'reviewer_id');
    }

    public function scopeActive($query)
    {
        return $query->whereNull('ended_at');
    }
}
