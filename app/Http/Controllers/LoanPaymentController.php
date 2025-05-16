<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

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
        $paymentMethod = PaymentMethod::findOrFail($request->payment_method_id);

        if ($paymentMethod->is_online) {
            $request->validate([
                'amount' => 'required|numeric|min:0',
                'payment_method_id' => 'required|exists:payment_methods,id',
                'payment_date' => 'required|date',
            ]);
        } else {
            $request->validate([
                'amount' => 'required|numeric|min:0',
                'payment_method_id' => 'required|exists:payment_methods,id',
                'reference_number' => 'required|string|max:255',
                'payment_date' => 'required|date',
                'notes' => 'nullable|string',
                'proof_file' => 'required|file|max:10240' // 10MB max
            ]);
        }

        // Check if loan is active
        if ($loan->status !== 'active') {
            throw ValidationException::withMessages([
                'loan' => 'Cannot submit payment for a non-active loan.'
            ]);
        }

        // For online payments, create a pending payment record
        if ($paymentMethod->is_online) {
            $payment = $loan->payments()->create([
                'amount' => $request->amount,
                'payment_method_id' => $request->payment_method_id,
                'payment_date' => $request->payment_date,
                'status' => 'pending',
                'reference_number' => 'ONLINE-' . uniqid() // Generate a unique reference for online payments
            ]);

            return response()->json([
                'message' => 'Payment initiated successfully.',
                'payment' => $payment
            ]);
        }

        // For manual payments, store proof file and create payment record
        $proofPath = $request->file('proof_file')->store('payment-proofs', 'public');

        $payment = $loan->payments()->create([
            'amount' => $request->amount,
            'payment_method_id' => $request->payment_method_id,
            'reference_number' => $request->reference_number,
            'payment_date' => $request->payment_date,
            'notes' => $request->notes,
            'proof_file' => $proofPath,
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Payment submitted successfully and pending approval.',
            'payment' => $payment
        ]);
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
            'notes' => 'nullable|string'
        ]);

        if ($payment->status !== 'pending') {
            throw ValidationException::withMessages([
                'payment' => 'Only pending payments can be approved.'
            ]);
        }

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
                'notes' => $request->notes
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

        return response()->json([
            'message' => 'Payment approved successfully.',
            'payment' => $payment->fresh()
        ]);
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

    /**
     * Calculate the next payment date based on loan terms.
     */
    private function calculateNextPaymentDate(Loan $loan, \DateTime $lastPaymentDate): \DateTime
    {
        $nextDate = clone $lastPaymentDate;
        $nextDate->modify("+{$loan->payment_frequency} days");
        return $nextDate;
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
}
