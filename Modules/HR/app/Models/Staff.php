<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Modules\User\Models\User;

class Staff extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_staff';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'uuid',
        'employee_id',
        'department',
        'job_title',
        'salary',
        'salary_currency',
        'pay_frequency',
        'salary_pay_day',
        'allowances',
        'deductions',
        'passport_photo_path',
        'tax_id',
        'national_id',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'allowances' => 'array',
        'deductions' => 'array',
        'started_at' => 'date',
        'ended_at' => 'date',
    ];

    /**
     * Net monthly take-home: base (prorated to monthly) + sum(allowances) - sum(deductions).
     * For display only; payment runs may prorate by period.
     */
    public function getMonthlyNetAttribute(): ?float
    {
        $base = $this->salary ? (float) $this->salary : 0;
        if ($this->pay_frequency === 'weekly') {
            $base *= 52 / 12;
        } elseif ($this->pay_frequency === 'bi_weekly') {
            $base *= 26 / 12;
        }
        $allowances = is_array($this->allowances) ? $this->allowances : [];
        $deductions = is_array($this->deductions) ? $this->deductions : [];
        $allowanceTotal = array_sum(array_column($allowances, 'amount'));
        $deductionTotal = array_sum(array_column($deductions, 'amount'));
        return round($base + $allowanceTotal - $deductionTotal, 2);
    }

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

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class, 'staff_id');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'staff_id');
    }

    public function reviewsGiven(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'reviewer_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StaffDocument::class, 'staff_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(StaffEvent::class, 'staff_id');
    }

    public function positionHistory(): HasMany
    {
        return $this->hasMany(StaffPositionHistory::class, 'staff_id');
    }

    public function scopeActive($query)
    {
        return $query->whereNull('ended_at');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (Staff $staff) {
            if (empty($staff->uuid)) {
                $staff->uuid = (string) Str::uuid();
            }
        });
    }
}
