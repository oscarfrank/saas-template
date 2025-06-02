<?php

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

use Modules\Payment\Models\Currency;

class LoanPackage extends Model
{
    use SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'name',
        'tenant_id',
        'code',
        'description',
        'created_by',
        'user_type',
        'min_amount',
        'max_amount',
        'currency_id',
        'min_duration_days',
        'max_duration_days',
        'has_fixed_duration',
        'fixed_duration_days',
        'interest_rate',
        'interest_type',
        'interest_calculation',
        'interest_payment_frequency',
        'has_origination_fee',
        'origination_fee_type',
        'origination_fee_fixed',
        'origination_fee_percentage',
        'late_payment_fee_type',
        'late_payment_fee_fixed',
        'late_payment_fee_percentage',
        'grace_period_days',
        'allows_early_repayment',
        'early_repayment_type',
        'early_repayment_fee_fixed',
        'early_repayment_fee_percentage',
        'early_repayment_period_days',
        'requires_collateral',
        'collateral_percentage',
        'collateral_requirements',
        'min_credit_score',
        'min_income',
        'min_kyc_level',
        'eligible_countries',
        'risk_level',
        'is_active',
        'available_from',
        'available_until',
        'available_quantity',
        'remaining_quantity',
        'icon',
        'color_code',
        'display_order',
        'is_featured',
        'terms_document',
        'contract_template'
    ];

    protected $casts = [
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'has_fixed_duration' => 'boolean',
        'interest_rate' => 'decimal:4',
        'origination_fee_fixed' => 'decimal:2',
        'origination_fee_percentage' => 'decimal:4',
        'late_payment_fee_fixed' => 'decimal:2',
        'late_payment_fee_percentage' => 'decimal:4',
        'allows_early_repayment' => 'boolean',
        'early_repayment_fee_percentage' => 'decimal:4',
        'requires_collateral' => 'boolean',
        'collateral_percentage' => 'decimal:4',
        'min_income' => 'decimal:2',
        'eligible_countries' => 'array',
        'is_active' => 'boolean',
        'available_from' => 'datetime',
        'available_until' => 'datetime',
        'is_featured' => 'boolean',
    ];

    /**
     * Get the currency that owns the loan package.
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Get the user that created the loan package.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the loans that use this package.
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * Scope a query to only include active packages.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include featured packages.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope a query to only include packages for a specific user type.
     */
    public function scopeForUserType($query, $userType)
    {
        return $query->where('user_type', $userType);
    }

    /**
     * Scope a query to only include packages within a specific amount range.
     */
    public function scopeWithinAmountRange($query, $amount)
    {
        return $query->where('min_amount', '<=', $amount)
                    ->where('max_amount', '>=', $amount);
    }

    /**
     * Scope a query to only include packages within a specific duration range.
     */
    public function scopeWithinDurationRange($query, $days)
    {
        return $query->where('min_duration_days', '<=', $days)
                    ->where('max_duration_days', '>=', $days);
    }

    /**
     * Scope a query to only include packages that are currently available.
     */
    public function scopeCurrentlyAvailable($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('available_from')
              ->orWhere('available_from', '<=', now());
        })->where(function ($q) {
            $q->whereNull('available_until')
              ->orWhere('available_until', '>=', now());
        });
    }

    /**
     * Scope a query to only include packages that have remaining quantity.
     */
    public function scopeHasRemainingQuantity($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('available_quantity')
              ->orWhere('remaining_quantity', '>', 0);
        });
    }
}
