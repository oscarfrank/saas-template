<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;

use App\Events\Loan\LoanPaymentSubmitted;
use App\Events\Loan\LoanPaymentCompleted;
use App\Events\Loan\LoanPaid;


class LoanPaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a new payment submission.
     */
    public function store(Request $request, Loan $loan)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'reference_number' => 'nullable|string|max:255',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
            'proof_file' => 'required_if:is_online,false|file|max:10240', // 10MB max
        ]);

        // Get the payment method to check if it's online
        $paymentMethod = PaymentMethod::findOrFail($request->payment_method_id);

        // Calculate the next payment number
        $lastPayment = $loan->payments()->orderBy('payment_number', 'desc')->first();
        $paymentNumber = $lastPayment ? $lastPayment->payment_number + 1 : 1;

        try {
            DB::beginTransaction();

            // Generate a unique reference number if not provided
            $referenceNumber = $request->reference_number ?? 'PAY-' . time() . '-' . rand(1000, 9999);

            // Create the payment record
            $payment = LoanPayment::create([
                'amount' => $request->amount,
                'payment_method_id' => $request->payment_method_id,
                'reference_number' => $referenceNumber,
                'payment_number' => $paymentNumber,
                'payment_at' => $request->payment_date,
                'due_at' => $request->payment_date,
                'notes' => $request->notes,
                'status' => 'pending',
                'currency_id' => $loan->currency_id,
                'loan_id' => $loan->id,
            ]);

            // Handle proof file upload for manual payments
            if (!$paymentMethod->is_online && $request->hasFile('proof_file')) {
                $path = $request->file('proof_file')->store('payment-proofs');
                $payment->update(['proof_file' => $path]);
            }

            DB::commit();

            // Dispatch payment submitted event
            event(new LoanPaymentSubmitted($payment));

            // If it's an online payment, redirect to payment gateway
            if ($paymentMethod->is_online) {
                // TODO: Implement payment gateway integration
                return redirect()->away($paymentMethod->callback_url);
            }

            // For manual payments, return to the appropriate loan page with success message
            if (request()->route()->getName() === 'user-loans.payments.submit') {
                return redirect()->route('user-loans.show', $loan)
                    ->with('success', 'Payment submitted successfully');
            }

            return redirect()->route('user-loans.show', $loan)
                ->with('success', 'Payment submitted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment creation failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'Failed to submit payment: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(LoanPayment $loanPayment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LoanPayment $loanPayment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LoanPayment $loanPayment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LoanPayment $loanPayment)
    {
        //
    }

    /**
     * Approve a pending payment.
     */
    public function approve(Request $request, LoanPayment $payment)
    {
        $request->validate([
            'notes' => 'nullable|string',
        ]);

        if ($payment->status !== 'pending') {
            throw ValidationException::withMessages([
                'payment' => 'Only pending payments can be approved.'
            ]);
        }

        try {
            DB::beginTransaction();

            // Get the loan from the payment relationship
            $loan = $payment->loan;
            
            // Calculate days since loan start
            $startDate = new \DateTime($loan->start_date);
            $currentDate = new \DateTime();
            $daysSinceStart = $currentDate->diff($startDate)->days;
            
            // Calculate if we're in grace period
            $isInGracePeriod = $daysSinceStart <= $loan->grace_period_days;
            
            // Calculate if this is an early repayment
            $isEarlyRepayment = $daysSinceStart < $loan->early_repayment_period_days;
            
            // Calculate fixed fees that need to be paid
            $fixedFees = $loan->fees_amount;  // This should only include fixed fees that are part of the loan

            // Calculate dynamic fees based on current conditions
            $latePaymentFee = 0;
            if (!$isInGracePeriod && $daysSinceStart > $loan->duration_days) {
                if ($loan->late_payment_fee_fixed > 0) {
                    $latePaymentFee = $loan->late_payment_fee_fixed;
                } elseif ($loan->late_payment_fee_percentage > 0) {
                    $latePaymentFee = $loan->current_balance * ($loan->late_payment_fee_percentage / 100);
                }
            }

            $earlyRepaymentFee = 0;
            if ($isEarlyRepayment && $loan->allows_early_repayment) {
                if ($loan->early_repayment_fixed_fee > 0) {
                    $earlyRepaymentFee = $loan->early_repayment_fixed_fee;
                } elseif ($loan->early_repayment_fee_percentage > 0) {
                    $earlyRepaymentFee = $loan->current_balance * ($loan->early_repayment_fee_percentage / 100);
                }
            }

            // Log the fee calculations for transparency
            Log::info('Fee calculations:', [
                'loan_id' => $loan->id,
                'fixed_fees' => $fixedFees,
                'late_payment_fee' => $latePaymentFee,
                'early_repayment_fee' => $earlyRepaymentFee,
                'fees_paid' => $loan->fees_paid
            ]);

            // Calculate interest due from last payment date to current date
            $lastPaymentDate = $loan->last_payment_date ?? $loan->start_date;
            $currentInterestDue = $loan->currentInterestDue();
            
            // Start with the full payment amount
            $remainingPayment = $payment->amount;
            
            // Initialize split amounts
            $feesAmount = 0;
            $interestAmount = 0;
            $principalAmount = 0;
            $lateFeesAmount = 0;
            $earlyRepaymentFeesAmount = 0;

            // Log the initial state
            Log::info('Payment allocation starting:', [
                'payment_id' => $payment->id,
                'payment_amount' => $payment->amount,
                'current_interest_due' => $currentInterestDue,
                'fixed_fees' => $fixedFees,
                'late_payment_fee' => $latePaymentFee,
                'early_repayment_fee' => $earlyRepaymentFee,
                'principal_remaining' => $loan->principal_remaining,
                'days_since_start' => $daysSinceStart,
                'is_in_grace_period' => $isInGracePeriod,
                'is_early_repayment' => $isEarlyRepayment
            ]);

            // 1. First, pay any late payment fees
            if ($latePaymentFee > 0) {
                $lateFeesAmount = min($remainingPayment, $latePaymentFee);
                $remainingPayment -= $lateFeesAmount;
            }

            // 2. Then, pay any early repayment fees
            if ($earlyRepaymentFee > 0) {
                $earlyRepaymentFeesAmount = min($remainingPayment, $earlyRepaymentFee);
                $remainingPayment -= $earlyRepaymentFeesAmount;
            }

            // 3. Then, pay any fixed fees
            if ($fixedFees > 0) {
                $feesAmount = min($remainingPayment, $fixedFees);
                $remainingPayment -= $feesAmount;
            }

            // 4. Then, pay any interest due
            if ($remainingPayment > 0 && $currentInterestDue > 0) {
                $interestAmount = min($remainingPayment, $currentInterestDue);
                $remainingPayment -= $interestAmount;
            }

            // 5. Finally, apply remaining amount to principal
            if ($remainingPayment > 0) {
                $principalAmount = $remainingPayment;
            }

            // Log the final allocation
            Log::info('Payment allocation completed:', [
                'payment_id' => $payment->id,
                'total_payment' => $payment->amount,
                'late_fees_amount' => $lateFeesAmount,
                'early_repayment_fees_amount' => $earlyRepaymentFeesAmount,
                'fees_amount' => $feesAmount,
                'interest_amount' => $interestAmount,
                'principal_amount' => $principalAmount,
                'remaining_payment' => $remainingPayment
            ]);

            // Update the payment record with the split amounts
            $payment->update([
                'status' => 'completed',
                'interest_amount' => $interestAmount,
                'principal_amount' => $principalAmount,
                'fees_amount' => $feesAmount + $lateFeesAmount + $earlyRepaymentFeesAmount,
                'late_fee_amount' => $lateFeesAmount,
                'early_payment_fee_amount' => $earlyRepaymentFeesAmount,
                'notes' => $request->notes,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            // Calculate new loan balances
            $newPrincipalPaid = $loan->principal_paid + $principalAmount;
            $newInterestPaid = $loan->interest_paid + $interestAmount;
            $newFeesPaid = $loan->fees_paid + $feesAmount + $lateFeesAmount + $earlyRepaymentFeesAmount;
            $newPrincipalRemaining = $loan->amount - $newPrincipalPaid;

            // Calculate next payment due date
            $nextPaymentDate = $this->calculateNextPaymentDate($loan, now());
            
            // Calculate next payment amount
            $nextPaymentAmount = $this->calculateNextPaymentAmount($loan, $nextPaymentDate);

            // Update loan record
            $loan->update([
                'principal_paid' => $newPrincipalPaid,
                'interest_paid' => $newInterestPaid,
                'fees_paid' => $newFeesPaid,
                'principal_remaining' => $newPrincipalRemaining,
                'current_balance' => $newPrincipalRemaining,
                'completed_payments' => $loan->completed_payments + 1,
                'last_payment_date' => now(),
                'last_payment_amount' => $payment->amount,
                'next_payment_due_date' => $nextPaymentDate,
                'next_payment_amount' => $nextPaymentAmount
            ]);

            // Create transaction record for loan repayment
            $transaction = Transaction::create([
                'reference_number' => 'TRX-' . strtoupper(uniqid()),
                'user_id' => $loan->user_id,
                'transaction_type' => 'loan_repayment',
                'amount' => $payment->amount,
                'currency_id' => $loan->currency_id,
                'status' => 'completed',
                'payment_method_id' => $payment->payment_method_id,
                'loan_id' => $loan->id,
                'loan_payment_id' => $payment->id,
            ]);

            // Check if loan is fully paid
            if ($this->isLoanFullyPaid($loan)) {
                $loan->update([
                    'status' => 'paid',
                    'paid_at' => now()
                ]);
                // Dispatch loan paid event
                event(new LoanPaid($loan));
            }

            DB::commit();

            // Dispatch payment completed event
            event(new LoanPaymentCompleted($payment));

            return redirect()->back()->with('success', 'Payment approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment approval failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Calculate the next payment amount based on loan terms.
     */
    private function calculateNextPaymentAmount(Loan $loan, \DateTime $nextPaymentDate): float
    {
        // If loan is fully paid, next payment amount is 0
        if ($this->isLoanFullyPaid($loan)) {
            return 0;
        }

        // Calculate interest due for the next period
        $interestDue = $loan->currentInterestDue();
        
        // Calculate remaining principal
        $remainingPrincipal = $loan->amount - $loan->principal_paid;
        
        // If this is the last payment, return remaining principal plus interest
        if ($loan->completed_payments + 1 >= $loan->total_payments) {
            return $remainingPrincipal + $interestDue;
        }

        // Otherwise, return the regular payment amount
        return $loan->monthly_payment_amount;
    }

    /**
     * Calculate the next payment date based on loan terms.
     */
    private function calculateNextPaymentDate(Loan $loan, \DateTime $lastPaymentDate): \DateTime
    {
        $startDate = new \DateTime($loan->start_date);
        $now = new \DateTime();
        
        // If we haven't started yet, return the start date
        if ($now < $startDate) {
            return $startDate;
        }

        // Calculate how many periods have passed since start
        $daysSinceStart = $now->diff($startDate)->days;
        $periodsPassed = ceil($daysSinceStart / $loan->duration_days);
        
        // Calculate the next due date
        $nextDueDate = clone $startDate;
        $nextDueDate->modify("+" . ($periodsPassed * $loan->duration_days) . " days");
        
        // If the next due date is in the past, add one more period
        if ($nextDueDate <= $now) {
            $nextDueDate->modify("+{$loan->duration_days} days");
        }
        
        return $nextDueDate;
    }

    /**
     * Check if a loan is fully paid.
     */
    private function isLoanFullyPaid(Loan $loan): bool
    {
        $totalPaid = $loan->principal_paid + $loan->interest_paid + $loan->fees_paid;
        $totalDue = $loan->amount + $loan->interest_amount + $loan->fees_amount;
        return $totalPaid >= $totalDue;
    }

    /**
     * Handle payment gateway callback.
     */
    public function handleCallback(Request $request, LoanPayment $payment)
    {
        $request->validate([
            'status' => 'required|in:success,failed',
            'transaction_id' => 'required|string',
            'amount' => 'required|numeric',
        ]);

        if ($request->status === 'success') {
            DB::transaction(function () use ($payment, $request) {
                // Calculate payment split
                $split = $payment->calculatePaymentSplit();
                
                // Update payment record
                $payment->update([
                    'status' => 'approved',
                    'interest_amount' => $split['interest_amount'],
                    'principal_amount' => $split['principal_amount'],
                    'fees_amount' => $split['fees_amount'],
                    'approved_by' => auth()->id(),
                    'approved_at' => now(),
                    'reference_number' => $request->transaction_id
                ]);

                // Update loan record
                $loan = $payment->loan;
                $loan->update([
                    'interest_paid' => $loan->interest_paid + $split['interest_amount'],
                    'principal_paid' => $loan->principal_paid + $split['principal_amount'],
                    'fees_paid' => $loan->fees_paid + $split['fees_amount'],
                    'last_payment_date' => $payment->payment_date,
                    'next_payment_date' => $this->calculateNextPaymentDate($loan, $payment->payment_date)
                ]);

                // Check if loan is fully paid
                if ($this->isLoanFullyPaid($loan)) {
                    $loan->update(['status' => 'paid']);
                }
            });

            return response()->json(['message' => 'Payment processed successfully']);
        } else {
            $payment->update([
                'status' => 'failed',
                'rejection_reason' => 'Payment gateway reported failure'
            ]);

            return response()->json(['message' => 'Payment failed'], 400);
        }
    }

    /**
     * Reject a pending payment.
     */
    public function reject(Request $request, LoanPayment $payment)
    {
        $request->validate([
            'rejection_reason' => 'required|string'
        ]);

        if ($payment->status !== 'pending') {
            throw ValidationException::withMessages([
                'payment' => 'Only pending payments can be rejected.'
            ]);
        }

        $payment->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason
        ]);

        return response()->json([
            'message' => 'Payment rejected successfully.',
            'payment' => $payment->fresh()
        ]);
    }
}
