<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class PaymentRun extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_payment_runs';

    protected $fillable = [
        'tenant_id',
        'period_start',
        'period_end',
        'status',
        'total_amount',
        'currency',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PaymentRunItem::class, 'payment_run_id');
    }
}
