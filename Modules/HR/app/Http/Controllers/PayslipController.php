<?php

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Http\Controllers\PaymentRunController as PaymentRunControllerRef;
use Modules\HR\Models\Payslip;
use Modules\HR\Models\Staff;

class PayslipController extends Controller
{
    /**
     * Generate one or more standalone payslips for a staff member.
     * If split_by_period is true (default): one payslip per pay period (month/week/bi-week) in the range, with matching narration (e.g. "Salary January 2022").
     * If false: one payslip for the exact date range, narration as provided.
     * Cannot generate for a period that already has a payslip (delete it first).
     */
    public function store(Request $request, Staff $staff): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }

        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'narration' => 'nullable|string|max:255',
            'prorate' => 'nullable|boolean',
            'split_by_period' => 'nullable|boolean',
        ]);

        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);
        $prorate = (bool) ($validated['prorate'] ?? false);
        $splitByPeriod = (bool) ($validated['split_by_period'] ?? true);
        $userNarration = isset($validated['narration']) ? trim($validated['narration']) : null;

        $periods = $this->getPeriodsInRange($periodStart, $periodEnd, $staff->pay_frequency ?? 'monthly', $splitByPeriod);

        $existing = [];
        foreach ($periods as [$start, $end]) {
            $exists = Payslip::where('staff_id', $staff->id)
                ->where('period_start', $start->format('Y-m-d'))
                ->where('period_end', $end->format('Y-m-d'))
                ->exists();
            if ($exists) {
                $existing[] = $start->format('M j, Y') . ' – ' . $end->format('M j, Y');
            }
        }
        if ($existing !== []) {
            return redirect()->back()->withErrors([
                'period' => 'Payslips already exist for: ' . implode('; ', array_unique($existing)) . '. Delete them first or choose a different range.',
            ]);
        }

        $paymentRunController = new PaymentRunControllerRef;
        $currency = $staff->salary_currency ?? 'USD';
        $created = 0;

        foreach ($periods as [$start, $end]) {
            $breakdown = $paymentRunController->getItemBreakdown($staff, $start, $end, $prorate);
            $gross = $breakdown['gross'];
            $deductionsTotal = $breakdown['deductions_total'];
            $net = round($gross - $deductionsTotal, 2);

            if ($splitByPeriod && ($staff->pay_frequency ?? 'monthly') === 'monthly') {
                $narration = 'Salary ' . $start->format('F') . ' ' . $start->format('Y');
            } elseif ($splitByPeriod) {
                $narration = $userNarration ?: ('Salary ' . $start->format('M j') . ' – ' . $end->format('M j, Y'));
            } else {
                $narration = $userNarration;
            }

            Payslip::create([
                'tenant_id' => tenant('id'),
                'staff_id' => $staff->id,
                'period_start' => $start,
                'period_end' => $end,
                'currency' => $currency,
                'gross' => $gross,
                'net_amount' => round($net, 2),
                'deductions_total' => $deductionsTotal,
                'allowances_detail' => $breakdown['allowances_detail'],
                'deductions_detail' => $breakdown['deductions_detail'],
                'tax_id' => $staff->tax_id,
                'bank_name' => $staff->bank_name,
                'bank_account_number' => $staff->bank_account_number,
                'bank_account_name' => $staff->bank_account_name,
                'pay_frequency' => $staff->pay_frequency,
                'narration' => $narration,
                'prorate' => $prorate,
            ]);
            $created++;
        }

        $message = $created === 1
            ? 'Payslip generated. You can edit it from the staff profile.'
            : "{$created} payslips generated. You can edit each from the staff profile.";

        return redirect()->back()->with('success', $message);
    }

    /**
     * Return array of [start, end] Carbon pairs for the given range.
     * If split_by_period false: single period. Otherwise split by pay_frequency (monthly = one per month, etc.).
     */
    private function getPeriodsInRange(Carbon $rangeStart, Carbon $rangeEnd, string $payFrequency, bool $splitByPeriod): array
    {
        if (! $splitByPeriod) {
            return [[$rangeStart->copy(), $rangeEnd->copy()]];
        }

        $periods = [];
        if ($payFrequency === 'weekly') {
            $current = $rangeStart->copy()->startOfWeek();
            while ($current->lte($rangeEnd)) {
                $end = $current->copy()->endOfWeek();
                $periodEnd = $end->gt($rangeEnd) ? $rangeEnd->copy() : $end;
                if ($periodEnd->gte($rangeStart)) {
                    $periods[] = [$current->copy(), $periodEnd];
                }
                $current->addWeek()->startOfWeek();
            }
            return $periods;
        }

        if ($payFrequency === 'bi_weekly') {
            $current = $rangeStart->copy();
            while ($current->lte($rangeEnd)) {
                $end = $current->copy()->addDays(13);
                $periods[] = [$current->copy(), $end->gt($rangeEnd) ? $rangeEnd->copy() : $end];
                $current->addDays(14);
            }
            return $periods;
        }

        // monthly (default)
        $current = $rangeStart->copy()->startOfMonth();
        while ($current->lte($rangeEnd)) {
            $end = $current->copy()->endOfMonth();
            $periodStart = $current->copy();
            $periodEnd = $end->gt($rangeEnd) ? $rangeEnd->copy() : $end;
            if ($periodStart->lte($rangeEnd)) {
                $periods[] = [$periodStart, $periodEnd];
            }
            $current->addMonth()->startOfMonth();
        }
        return $periods;
    }

    /**
     * View a standalone payslip (same slip UI as run-based slips).
     */
    public function show(Request $request, Payslip $payslip): Response|RedirectResponse
    {
        if ($payslip->tenant_id !== tenant('id')) {
            abort(404);
        }

        $payslip->load('staff.user:id,first_name,last_name,email');

        $staff = $payslip->staff;
        $run = [
            'id' => 0,
            'period_start' => $payslip->period_start?->format('Y-m-d'),
            'period_end' => $payslip->period_end?->format('Y-m-d'),
            'status' => 'processed',
            'total_amount' => (string) $payslip->net_amount,
            'currency' => $payslip->currency,
            'payment_method' => $payslip->payment_method,
            'narration' => $payslip->narration,
        ];

        $item = [
            'id' => $payslip->id,
            'amount' => (string) $payslip->net_amount,
            'currency' => $payslip->currency,
            'status' => 'paid',
            'paid_at' => $payslip->date_paid?->format('Y-m-d\TH:i:s.u\Z'),
            'payment_method' => $payslip->payment_method,
            'tax_id' => $payslip->tax_id,
            'bank_name' => $payslip->bank_name,
            'bank_account_number' => $payslip->bank_account_number,
            'bank_account_name' => $payslip->bank_account_name,
            'pay_frequency' => $payslip->pay_frequency,
            'gross' => (string) $payslip->gross,
            'deductions_total' => (string) $payslip->deductions_total,
            'allowances_detail' => $payslip->allowances_detail ?? [],
            'deductions_detail' => $payslip->deductions_detail ?? [],
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
        ];

        return Inertia::render('hr/payments/slip', [
            'run' => $run,
            'item' => $item,
            'tenantName' => tenant('name') ?? config('app.name'),
            'paymentMethodLabels' => PaymentRunControllerRef::PAYMENT_METHODS,
            'standalone' => true,
            'payslipId' => $payslip->id,
            'staffUuid' => $staff?->uuid,
        ]);
    }

    /**
     * Edit form for a standalone payslip.
     */
    public function edit(Request $request, Payslip $payslip): Response
    {
        if ($payslip->tenant_id !== tenant('id')) {
            abort(404);
        }

        $payslip->load('staff.user:id,first_name,last_name,email');

        return Inertia::render('hr/payslips/edit', [
            'payslip' => [
                'id' => $payslip->id,
                'staff_id' => $payslip->staff_id,
                'staff' => $payslip->staff,
                'period_start' => $payslip->period_start?->format('Y-m-d'),
                'period_end' => $payslip->period_end?->format('Y-m-d'),
                'currency' => $payslip->currency,
                'gross' => (string) $payslip->gross,
                'net_amount' => (string) $payslip->net_amount,
                'deductions_total' => (string) $payslip->deductions_total,
                'allowances_detail' => $payslip->allowances_detail ?? [],
                'deductions_detail' => $payslip->deductions_detail ?? [],
                'narration' => $payslip->narration,
                'date_paid' => $payslip->date_paid?->format('Y-m-d'),
                'payment_method' => $payslip->payment_method,
                'tax_id' => $payslip->tax_id,
                'bank_name' => $payslip->bank_name,
                'bank_account_number' => $payslip->bank_account_number,
                'bank_account_name' => $payslip->bank_account_name,
                'pay_frequency' => $payslip->pay_frequency,
            ],
            'paymentMethodLabels' => PaymentRunControllerRef::PAYMENT_METHODS,
        ]);
    }

    /**
     * Update a standalone payslip (adjust amounts, bonuses, deductions, etc.).
     */
    public function update(Request $request, Payslip $payslip): RedirectResponse
    {
        if ($payslip->tenant_id !== tenant('id')) {
            abort(404);
        }

        $validated = $request->validate([
            'gross' => 'required|numeric|min:0',
            'net_amount' => 'required|numeric|min:0',
            'deductions_total' => 'required|numeric|min:0',
            'allowances_detail' => 'nullable|array',
            'allowances_detail.*.name' => 'required_with:allowances_detail|string|max:128',
            'allowances_detail.*.amount' => 'required_with:allowances_detail|numeric|min:0',
            'deductions_detail' => 'nullable|array',
            'deductions_detail.*.name' => 'required_with:deductions_detail|string|max:128',
            'deductions_detail.*.amount' => 'required_with:deductions_detail|numeric|min:0',
            'narration' => 'nullable|string|max:255',
            'date_paid' => 'nullable|date',
            'payment_method' => 'nullable|string|in:paystack,kuda,flutterwave,manual',
            'tax_id' => 'nullable|string|max:64',
            'bank_name' => 'nullable|string|max:128',
            'bank_account_number' => 'nullable|string|max:64',
            'bank_account_name' => 'nullable|string|max:128',
            'pay_frequency' => 'nullable|string|in:monthly,weekly,bi_weekly',
        ]);

        $allowances = $validated['allowances_detail'] ?? [];
        $deductions = $validated['deductions_detail'] ?? [];

        $payslip->update([
            'gross' => round((float) $validated['gross'], 2),
            'net_amount' => round((float) $validated['net_amount'], 2),
            'deductions_total' => round((float) $validated['deductions_total'], 2),
            'allowances_detail' => array_map(fn ($a) => [
                'name' => $a['name'],
                'amount' => (float) $a['amount'],
            ], $allowances),
            'deductions_detail' => array_map(fn ($d) => [
                'name' => $d['name'],
                'amount' => (float) $d['amount'],
            ], $deductions),
            'narration' => isset($validated['narration']) ? trim($validated['narration']) : null,
            'date_paid' => ! empty($validated['date_paid']) ? $validated['date_paid'] : null,
            'payment_method' => ! empty($validated['payment_method']) ? $validated['payment_method'] : null,
            'tax_id' => ! empty($validated['tax_id']) ? trim($validated['tax_id']) : null,
            'bank_name' => ! empty($validated['bank_name']) ? trim($validated['bank_name']) : null,
            'bank_account_number' => ! empty($validated['bank_account_number']) ? trim($validated['bank_account_number']) : null,
            'bank_account_name' => ! empty($validated['bank_account_name']) ? trim($validated['bank_account_name']) : null,
            'pay_frequency' => ! empty($validated['pay_frequency']) ? $validated['pay_frequency'] : null,
        ]);

        $staffUuid = $payslip->staff?->uuid;
        return redirect()->to($staffUuid
            ? route('hr.staff.show', ['tenant' => tenant('slug'), 'staff' => $staffUuid])
            : route('hr.staff.index', ['tenant' => tenant('slug')])
        )->with('success', 'Payslip updated.');
    }

    /**
     * Delete a standalone payslip.
     */
    public function destroy(Request $request, Payslip $payslip): RedirectResponse
    {
        if ($payslip->tenant_id !== tenant('id')) {
            abort(404);
        }

        $staffUuid = $payslip->staff?->uuid;
        $payslip->delete();

        if ($staffUuid) {
            return redirect()->route('hr.staff.show', ['tenant' => tenant('slug'), 'staff' => $staffUuid])
                ->with('success', 'Payslip deleted.');
        }

        return redirect()->route('hr.staff.index', ['tenant' => tenant('slug')])
            ->with('success', 'Payslip deleted.');
    }
}
