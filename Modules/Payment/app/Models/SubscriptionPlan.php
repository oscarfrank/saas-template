<?php

namespace Modules\Payment\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'currency_id',
        'billing_period',
        'features',
        'is_active',
        'is_featured',
        'sort_order',
        'provider_plans',
    ];

    protected $casts = [
        'features' => 'array',
        'provider_plans' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }


    public function getFormattedPriceAttribute(): string
    {
        return $this->currency->formatAmount($this->price);
    }

    public function getPeriodLabelAttribute(): string
    {
        return match($this->billing_period) {
            'monthly' => 'month',
            'yearly' => 'year',
            'quarterly' => 'quarter',
            'weekly' => 'week',
            default => $this->billing_period,
        };
    }

    public function getFullPriceAttribute(): string
    {
        return "{$this->formatted_price}/{$this->period_label}";
    }
} 