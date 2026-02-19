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
        $staff = Staff::where('tenant_id', $tenantId)->active()->with('user:id,first_name,last_name')->get();
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
        ]);
        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);

        $run = PaymentRun::create([
            'tenant_id' => $tenantId,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'status' => 'draft',
            'total_amount' => 0,
            'currency' => 'USD',
        ]);

        $activeStaff = Staff::where('tenant_id', $tenantId)->active()->get();
        $total = 0;
        foreach ($activeStaff as $s) {
            if ($s->salary === null || $s->salary <= 0) {
                continue;
            }
            $amount = $this->prorateSalary($s->salary, $s->pay_frequency ?? 'monthly', $periodStart, $periodEnd);
            if ($amount > 0) {
                PaymentRunItem::create([
                    'payment_run_id' => $run->id,
                    'staff_id' => $s->id,
                    'amount' => $amount,
                    'currency' => $s->salary_currency ?? 'USD',
                    'status' => 'pending',
                ]);
                $total += $amount;
            }
        }
        $run->update(['total_amount' => $total]);

        return redirect()->route('hr.payments.show', ['tenant' => tenant('slug'), 'paymentRun' => $run->id])
            ->with('success', 'Draft payment run created.');
    }

    public function show(Request $request, PaymentRun $paymentRun): Response|RedirectResponse
    {
        if ($paymentRun->tenant_id !== tenant('id')) {
            abort(404);
        }
        $paymentRun->load('items.staff.user:id,first_name,last_name,email');
        return Inertia::render('hr/payments/show', ['run' => $paymentRun]);
    }

    public function process(Request $request, PaymentRun $paymentRun): RedirectResponse
    {
        if ($paymentRun->tenant_id !== tenant('id')) {
            abort(404);
        }
        if ($paymentRun->status !== 'draft') {
            return back()->withErrors(['status' => 'Only draft runs can be processed.']);
        }
        $paymentRun->update(['status' => 'processed']);
        $paymentRun->items()->update(['status' => 'paid', 'paid_at' => now()]);
        return back()->with('success', 'Payment run marked as processed.');
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
