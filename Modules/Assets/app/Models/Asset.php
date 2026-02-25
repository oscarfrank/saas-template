<?php

namespace Modules\Assets\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Modules\User\Models\User;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Asset extends Model
{
    use BelongsToTenant;

    public const STATUS_AVAILABLE = 'available';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_IN_USE = 'in_use';
    public const STATUS_IN_MAINTENANCE = 'in_maintenance';
    public const STATUS_AVAILABLE_FOR_SALE = 'available_for_sale';
    public const STATUS_SOLD = 'sold';
    public const STATUS_GIFTED = 'gifted';
    public const STATUS_LOST = 'lost';
    public const STATUS_DAMAGED = 'damaged';
    public const STATUS_RETIRED = 'retired';
    public const STATUS_DISPOSED = 'disposed';

    public const CONDITION_EXCELLENT = 'excellent';
    public const CONDITION_GOOD = 'good';
    public const CONDITION_FAIR = 'fair';
    public const CONDITION_POOR = 'poor';

    protected $table = 'assets';

    protected $fillable = [
        'tenant_id',
        'asset_category_id',
        'name',
        'asset_tag',
        'serial_number',
        'description',
        'status',
        'assigned_to_user_id',
        'purchase_date',
        'purchase_price',
        'currency',
        'location',
        'notes',
        'condition',
        'depreciation_useful_life_years',
        'depreciation_salvage_value',
        'depreciation_method',
        'disposed_at',
        'disposed_reason',
        'sold_at',
        'sold_price',
        'sold_currency',
        'receipt_path',
        'photo_path',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'purchase_price' => 'decimal:2',
        'depreciation_salvage_value' => 'decimal:2',
        'disposed_at' => 'datetime',
        'sold_at' => 'date',
        'sold_price' => 'decimal:2',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    public function assignedToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Statuses that mean the asset is no longer available (disposed).
     * Used for counts and totals: "available" = not in this list.
     */
    public static function disposedStatuses(): array
    {
        return [
            self::STATUS_SOLD,
            self::STATUS_GIFTED,
            self::STATUS_LOST,
            self::STATUS_DAMAGED,
            self::STATUS_RETIRED,
            self::STATUS_DISPOSED,
        ];
    }

    /**
     * Statuses that count as "available" (active, not disposed).
     * Used for summary counts and currency totals.
     */
    public static function activeStatuses(): array
    {
        return [
            self::STATUS_AVAILABLE,
            self::STATUS_ASSIGNED,
            self::STATUS_IN_USE,
            self::STATUS_IN_MAINTENANCE,
            self::STATUS_AVAILABLE_FOR_SALE,
        ];
    }

    public static function statusOptions(): array
    {
        return [
            self::STATUS_AVAILABLE => 'Available',
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_IN_USE => 'In use',
            self::STATUS_IN_MAINTENANCE => 'In maintenance',
            self::STATUS_AVAILABLE_FOR_SALE => 'Available for sale',
            self::STATUS_SOLD => 'Sold',
            self::STATUS_GIFTED => 'Gifted',
            self::STATUS_LOST => 'Lost',
            self::STATUS_DAMAGED => 'Damaged',
            self::STATUS_RETIRED => 'Retired',
            self::STATUS_DISPOSED => 'Disposed',
        ];
    }

    public static function conditionOptions(): array
    {
        return [
            self::CONDITION_EXCELLENT => 'Excellent',
            self::CONDITION_GOOD => 'Good',
            self::CONDITION_FAIR => 'Fair',
            self::CONDITION_POOR => 'Poor',
        ];
    }

    public static function currencyOptions(): array
    {
        return [
            'USD' => 'US Dollar (USD)',
            'GBP' => 'British Pound (GBP)',
            'EUR' => 'Euro (EUR)',
            'NGN' => 'Nigerian Naira (NGN)',
        ];
    }

    /**
     * Generate a unique asset tag for the tenant using the configured prefix (e.g. AST-0001, LAP-0001).
     */
    public static function generateAssetTag(string $tenantId): string
    {
        $prefix = AssetSettings::getForTenant($tenantId)->getPrefix();
        $tags = static::query()
            ->where('tenant_id', $tenantId)
            ->where('asset_tag', 'like', $prefix . '%')
            ->pluck('asset_tag');
        $max = 0;
        foreach ($tags as $tag) {
            if (preg_match('/^' . preg_quote($prefix, '/') . '(\d+)$/', $tag, $m)) {
                $n = (int) $m[1];
                if ($n > $max) {
                    $max = $n;
                }
            }
        }
        return $prefix . str_pad((string) ($max + 1), 4, '0', STR_PAD_LEFT);
    }

    public function isDisposed(): bool
    {
        return in_array($this->status, self::disposedStatuses(), true);
    }

    /**
     * Effective depreciation settings: asset override or category defaults. Uncategorized assets use only asset overrides.
     *
     * @return array{useful_life_years: int|null, salvage_value: float, method: string}|null Null if no depreciation configured.
     */
    public function getEffectiveDepreciationSettings(): ?array
    {
        $usefulLife = $this->depreciation_useful_life_years;
        $salvage = $this->depreciation_salvage_value;
        $method = $this->depreciation_method;

        if ($this->relationLoaded('category') && $this->category) {
            $usefulLife = $usefulLife ?? $this->category->depreciation_useful_life_years;
            $salvage = $salvage !== null ? (float) $salvage : ($this->category->depreciation_salvage_value !== null ? (float) $this->category->depreciation_salvage_value : 0.0);
            $method = $method ?? $this->category->depreciation_method ?? 'straight_line';
        } else {
            $salvage = $salvage !== null ? (float) $salvage : 0.0;
            $method = $method ?? 'straight_line';
        }

        if ($usefulLife === null || $usefulLife <= 0) {
            return null;
        }

        return [
            'useful_life_years' => (int) $usefulLife,
            'salvage_value' => (float) $salvage,
            'method' => $method,
        ];
    }

    /**
     * Accumulated depreciation as of a given date (default: today). Straight-line from purchase_date; stops at disposal/sale date.
     */
    public function accumulatedDepreciation(?\DateTimeInterface $asOf = null): float
    {
        $settings = $this->getEffectiveDepreciationSettings();
        if ($settings === null) {
            return 0.0;
        }

        $cost = $this->purchase_price !== null ? (float) $this->purchase_price : 0.0;
        $salvage = $settings['salvage_value'];
        $usefulLifeYears = $settings['useful_life_years'];
        $start = $this->purchase_date?->startOfDay();
        if (! $start) {
            return 0.0;
        }

        $end = $asOf ? Carbon::parse($asOf)->endOfDay() : now();
        if ($this->isDisposed()) {
            $disposedAt = $this->disposed_at ?? $this->sold_at;
            if ($disposedAt) {
                $endDate = $disposedAt instanceof \DateTimeInterface ? Carbon::parse($disposedAt) : Carbon::parse($disposedAt);
                if ($endDate->lt($end)) {
                    $end = $endDate->endOfDay();
                }
            }
        }
        if ($end->lt($start)) {
            return 0.0;
        }

        $depreciable = max(0, $cost - $salvage);
        if ($depreciable <= 0 || $usefulLifeYears <= 0) {
            return 0.0;
        }

        $monthsTotal = $usefulLifeYears * 12;
        $monthsElapsed = (int) $start->diffInMonths($end);
        $monthsElapsed = min($monthsElapsed, $monthsTotal);
        $accumulated = $depreciable * ($monthsElapsed / $monthsTotal);

        return round($accumulated, 2);
    }

    /**
     * Book value = purchase price − accumulated depreciation, not below salvage. Null if no purchase price.
     */
    public function bookValue(?\DateTimeInterface $asOf = null): ?float
    {
        if ($this->purchase_price === null) {
            return null;
        }
        $cost = (float) $this->purchase_price;
        $settings = $this->getEffectiveDepreciationSettings();
        $salvage = $settings['salvage_value'] ?? 0.0;
        $acc = $this->accumulatedDepreciation($asOf);
        $book = $cost - $acc;
        $min = $salvage;
        return round(max($min, $book), 2);
    }

    protected static function booted(): void
    {
        static::creating(function (Asset $asset) {
            if (empty($asset->uuid)) {
                $asset->uuid = (string) Str::uuid();
            }
        });
    }
}
