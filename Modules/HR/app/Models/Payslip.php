<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Payslip extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_payslips';

    protected $fillable = [
        'tenant_id',
        'staff_id',
        'period_start',
        'period_end',
        'currency',
        'gross',
        'net_amount',
        'deductions_total',
        'allowances_detail',
        'deductions_detail',
        'tax_id',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'pay_frequency',
        'narration',
        'date_paid',
        'payment_method',
        'prorate',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'gross' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'deductions_total' => 'decimal:2',
        'allowances_detail' => 'array',
        'deductions_detail' => 'array',
        'date_paid' => 'date',
        'prorate' => 'boolean',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
