<?php

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\PaymentRun;
use Modules\HR\Models\PaymentRunItem;
use Modules\HR\Models\Staff;
use Carbon\Carbon;

class PaymentRunController extends Controller
{
    public const PAYMENT_METHODS = [
        'paystack' => 'Paystack',
        'kuda' => 'Kuda',
        'flutterwave' => 'Flutterwave',
        'manual' => 'Manual / Other',
    ];

    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $runs = PaymentRun::query()
            ->where('tenant_id', $tenantId)
            ->withCount('items')
            ->orderBy('period_start', 'desc')
            ->paginate(15)->withQueryString();

        return Inertia::render('hr/payments/index', ['runs' => $runs]);
    }

    public function create(Request $request): Response
    {
        $tenantId = tenant('id');
        $staff = Staff::where('tenant_id', $tenantId)
            ->active()
            ->with('user:id,first_name,last_name,email')
            ->get()
            ->map(function (Staff $s) {
                return [
                    'id' => $s->id,
                    'employee_id' => $s->employee_id,
                    'department' => $s->department,
                    'job_title' => $s->job_title,
                    'salary' => $s->salary,
                    'salary_currency' => $s->salary_currency ?? 'USD',
                    'pay_frequency' => $s->pay_frequency,
                    'monthly_net' => $s->monthly_net,
                    'user' => $s->user,
                ];
            });
        return Inertia::render('hr/payments/create', [
            'staff' => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'staff_ids' => 'required|array|min:1',
            'staff_ids.*' => 'integer|exists:hr_staff,id',
            'prorate' => 'nullable|boolean',
            'narration' => 'nullable|string|max:255',
        ]);
        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);
        $prorate = (bool) ($validated['prorate'] ?? false);
        $narration = isset($validated['narration']) ? trim($validated['narration']) : null;

        $run = PaymentRun::create([
            'tenant_id' => $tenantId,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'status' => 'draft',
            'total_amount' => 0,
            'currency' => null,
            'prorate' => $prorate,
            'narration' => $narration ?: null,
        ]);

        $staffQuery = Staff::where('tenant_id', $tenantId)->active();
        if (! empty($validated['staff_ids'])) {
            $staffQuery->whereIn('id', $validated['staff_ids']);
        }
        $staffToPay = $staffQuery->get();

        $days = $periodStart->diffInDays($periodEnd) + 1;
        $amountsByCurrency = [];
        foreach ($staffToPay as $s) {
            $amount = $this->calculateItemAmount($s, $periodStart, $periodEnd, $days, $prorate);
            if ($amount > 0) {
                $currency = $s->salary_currency ?? 'USD';
                $amountsByCurrency[$currency] = ($amountsByCurrency[$currency] ?? 0) + $amount;
                PaymentRunItem::create([
                    'payment_run_id' => $run->id,
                    'staff_id' => $s->id,
                    'amount' => $amount,
                    'currency' => $currency,
                    'status' => 'pending',
                    'tax_id' => $s->tax_id,
                    'bank_name' => $s->bank_name,
                    'bank_account_number' => $s->bank_account_number,
                    'bank_account_name' => $s->bank_account_name,
                    'pay_frequency' => $s->pay_frequency,
                ]);
            }
        }
        $currencies = array_keys($amountsByCurrency);
        if (count($currencies) === 1) {
            $run->update([
                'currency' => $currencies[0],
                'total_amount' => $amountsByCurrency[$currencies[0]],
            ]);
        } else {
            $run->update([
                'currency' => null,
                'total_amount' => 0,
            ]);
        }

        return redirect()->route('hr.payments.show', ['tenant' => tenant('slug'), 'paymentRun' => $run->id])
            ->with('success', 'Draft payment run created.');
    }

    public function show(Request $request, PaymentRun $paymentRun): Response|RedirectResponse
    {
        if ($paymentRun->tenant_id !== tenant('id')) {
            abort(404);
        }
        $paymentRun->load('items.staff.user:id,first_name,last_name,email');
        $tenantId = tenant('id');
        $isTenantOwner = $request->user()
            ->tenants()
            ->where('tenants.id', $tenantId)
            ->first()?->pivot?->role === 'owner';

        return Inertia::render('hr/payments/show', [
            'run' => $paymentRun,
            'paymentMethodLabels' => self::PAYMENT_METHODS,
            'isTenantOwner' => $isTenantOwner,
        ]);
    }

    public function process(Request $request, PaymentRun $paymentRun): RedirectResponse
    {
        if ($paymentRun->tenant_id !== tenant('id')) {
            abort(404);
        }
        if ($paymentRun->status !== 'draft') {
            return back()->withErrors(['status' => 'Only draft runs can be processed.']);
        }
        $validated = $request->validate([
            'payment_method' => 'required|string|in:paystack,kuda,flutterwave,manual',
        ]);
        $method = $validated['payment_method'];
        $paymentRun->update(['status' => 'processed', 'payment_method' => $method]);
        $paymentRun->items()->where('status', 'pending')->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $method,
        ]);
        return back()->with('success', 'Payment run marked as processed. All pending items are now paid.');
    }

    /**
     * Mark a single payment run item as paid (individual payment).
     */
    public function processItem(Request $request, PaymentRun $paymentRun, PaymentRunItem $item): RedirectResponse
    {
        if ($paymentRun->tenant_id !== tenant('id') || $item->payment_run_id !== $paymentRun->id) {
            abort(404);
        }
        if ($paymentRun->status !== 'draft') {
            return back()->withErrors(['status' => 'Only draft runs allow individual payments. Process the run to mark all as paid.']);
        }
        if ($item->status === 'paid') {
            return back()->with('success', 'This payment was already marked as paid.');
        }
        $validated = $request->validate([
            'payment_method' => 'required|string|in:paystack,kuda,flutterwave,manual',
        ]);
        $item->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $validated['payment_method'],
        ]);
        return back()->with('success', 'Payment marked as paid.');
    }

    /**
     * Delete a payment run. Draft runs can be deleted by any member; completed runs only by the tenant owner.
     */
    public function destroy(Request $request, PaymentRun $paymentRun): RedirectResponse
    {
        if ($paymentRun->tenant_id !== tenant('id')) {
            abort(404);
        }
        if ($paymentRun->status === 'draft') {
            $paymentRun->delete();
            return redirect()->route('hr.payments.index', ['tenant' => tenant('slug')])
                ->with('success', 'Payment run deleted.');
        }
        // Completed run: only tenant owner may delete
        $isTenantOwner = $request->user()
            ->tenants()
            ->where('tenants.id', tenant('id'))
            ->first()?->pivot?->role === 'owner';
        if (! $isTenantOwner) {
            return back()->withErrors(['status' => 'Only the organization owner can delete a completed payment run.']);
        }
        $paymentRun->delete();
        return redirect()->route('hr.payments.index', ['tenant' => tenant('slug')])
            ->with('success', 'Payment run deleted.');
    }

    /**
     * Show a printable payment slip for one run item (one staff member).
     */
    public function slip(Request $request, PaymentRun $paymentRun, PaymentRunItem $item): Response|RedirectResponse
    {
        if ($paymentRun->tenant_id !== tenant('id') || $item->payment_run_id !== $paymentRun->id) {
            abort(404);
        }
        $item->load('staff:id,employee_id,user_id,tax_id,bank_name,bank_account_number,bank_account_name,salary,salary_currency,pay_frequency,allowances,deductions', 'staff.user:id,first_name,last_name,email');

        $run = [
            'id' => $paymentRun->id,
            'period_start' => $paymentRun->period_start?->format('Y-m-d'),
            'period_end' => $paymentRun->period_end?->format('Y-m-d'),
            'status' => $paymentRun->status,
            'total_amount' => (string) $paymentRun->total_amount,
            'currency' => $paymentRun->currency,
            'payment_method' => $paymentRun->payment_method,
            'prorate' => (bool) $paymentRun->prorate,
            'narration' => $paymentRun->narration,
        ];

        $staff = $item->staff;
        $breakdown = $staff ? $this->getItemBreakdown($staff, $paymentRun->period_start, $paymentRun->period_end, (bool) $paymentRun->prorate) : null;

        // Payment details at time of run (snapshot on item); fall back to current staff for older runs
        $itemData = [
            'id' => $item->id,
            'amount' => (string) $item->amount,
            'currency' => $item->currency,
            'status' => $item->status,
            'paid_at' => $item->paid_at?->toIso8601String(),
            'payment_method' => $item->payment_method,
            'tax_id' => $item->tax_id ?? $staff?->tax_id,
            'bank_name' => $item->bank_name ?? $staff?->bank_name,
            'bank_account_number' => $item->bank_account_number ?? $staff?->bank_account_number,
            'bank_account_name' => $item->bank_account_name ?? $staff?->bank_account_name,
            'pay_frequency' => $item->pay_frequency ?? $staff?->pay_frequency,
            'staff' => $staff ? [
                'id' => $staff->id,
                'employee_id' => $staff->employee_id,
                'user' => $staff->user ? [
                    'id' => $staff->user->id,
                    'first_name' => $staff->user->first_name,
                    'last_name' => $staff->user->last_name,
                    'email' => $staff->user->email,
                ] : null,
            ] : null,
            'gross' => $breakdown ? (string) $breakdown['gross'] : null,
            'deductions_total' => $breakdown ? (string) $breakdown['deductions_total'] : null,
            'allowances_detail' => $breakdown ? $breakdown['allowances_detail'] : [],
            'deductions_detail' => $breakdown ? $breakdown['deductions_detail'] : [],
        ];

        return Inertia::render('hr/payments/slip', [
            'run' => $run,
            'item' => $itemData,
            'tenantName' => tenant('name') ?? config('app.name'),
            'paymentMethodLabels' => self::PAYMENT_METHODS,
        ]);
    }

    /**
     * Get gross, deductions total, and line-item details for the slip (same period/prorate logic as calculateItemAmount).
     * Public so PayslipController can use it when generating standalone payslips.
     */
    public function getItemBreakdown(Staff $s, $periodStart, $periodEnd, bool $prorate): array
    {
        $periodStart = $periodStart instanceof \Carbon\Carbon ? $periodStart : Carbon::parse($periodStart);
        $periodEnd = $periodEnd instanceof \Carbon\Carbon ? $periodEnd : Carbon::parse($periodEnd);
        $days = $periodStart->diffInDays($periodEnd) + 1;
        $salary = (float) ($s->salary ?? 0);
        $frequency = $s->pay_frequency ?? 'monthly';
        $allowances = is_array($s->allowances) ? $s->allowances : [];
        $deductions = is_array($s->deductions) ? $s->deductions : [];

        if (! $prorate && $frequency === 'monthly') {
            $gross = round($salary + array_sum(array_column($allowances, 'amount')), 2);
            $deductionsTotal = (float) array_sum(array_column($deductions, 'amount'));
            return [
                'gross' => $gross,
                'deductions_total' => round($deductionsTotal, 2),
                'allowances_detail' => array_map(fn ($a) => ['name' => $a['name'] ?? '', 'amount' => (float) ($a['amount'] ?? 0)], $allowances),
                'deductions_detail' => array_map(fn ($d) => ['name' => $d['name'] ?? '', 'amount' => (float) ($d['amount'] ?? 0)], $deductions),
            ];
        }

        $baseProrated = $this->prorateSalary($salary, $frequency, $periodStart, $periodEnd);
        $ratio = $days / 30;
        $allowanceTotal = (float) array_sum(array_column($allowances, 'amount'));
        $deductionTotal = (float) array_sum(array_column($deductions, 'amount'));
        $allowanceProrated = round($allowanceTotal * $ratio, 2);
        $deductionProrated = round($deductionTotal * $ratio, 2);
        $gross = round($baseProrated + $allowanceProrated, 2);
        $allowancesDetail = array_map(fn ($a) => [
            'name' => $a['name'] ?? '',
            'amount' => round((float) ($a['amount'] ?? 0) * $ratio, 2),
        ], $allowances);
        $deductionsDetail = array_map(fn ($d) => [
            'name' => $d['name'] ?? '',
            'amount' => round((float) ($d['amount'] ?? 0) * $ratio, 2),
        ], $deductions);

        return [
            'gross' => $gross,
            'deductions_total' => $deductionProrated,
            'allowances_detail' => $allowancesDetail,
            'deductions_detail' => $deductionsDetail,
        ];
    }

    /**
     * Calculate payment amount for one staff. When prorate is false and pay_frequency is monthly,
     * use full base salary + full allowances - full deductions (no day ratio). Otherwise prorate by days.
     */
    private function calculateItemAmount(Staff $s, Carbon $periodStart, Carbon $periodEnd, int $days, bool $prorate): float
    {
        $salary = (float) ($s->salary ?? 0);
        $frequency = $s->pay_frequency ?? 'monthly';
        $allowances = is_array($s->allowances) ? $s->allowances : [];
        $deductions = is_array($s->deductions) ? $s->deductions : [];
        $allowanceTotal = (float) array_sum(array_column($allowances, 'amount'));
        $deductionTotal = (float) array_sum(array_column($deductions, 'amount'));

        if (! $prorate && $frequency === 'monthly') {
            // Full month: base + allowances - deductions (no proration)
            return round($salary + $allowanceTotal - $deductionTotal, 2);
        }

        // Prorated: base by frequency, allowances/deductions by days/30
        $baseProrated = $this->prorateSalary($salary, $frequency, $periodStart, $periodEnd);
        $allowanceProrated = round($allowanceTotal * ($days / 30), 2);
        $deductionProrated = round($deductionTotal * ($days / 30), 2);

        return round($baseProrated + $allowanceProrated - $deductionProrated, 2);
    }

    private function prorateSalary($salary, string $frequency, Carbon $start, Carbon $end): float
    {
        $days = $start->diffInDays($end) + 1;
        switch ($frequency) {
            case 'weekly':
                return round($salary * ($days / 7), 2);
            case 'bi_weekly':
                return round($salary * ($days / 14), 2);
            case 'monthly':
            default:
                return round($salary * ($days / 30), 2);
        }
    }
}
