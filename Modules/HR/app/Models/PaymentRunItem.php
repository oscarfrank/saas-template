<?php

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRunItem extends Model
{
    protected $table = 'hr_payment_run_items';

    protected $fillable = [
        'payment_run_id',
        'staff_id',
        'amount',
        'currency',
        'status',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function paymentRun(): BelongsTo
    {
        return $this->belongsTo(PaymentRun::class, 'payment_run_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
