<?php

namespace App\Listeners\Loan;

use App\Events\Loan\LoanPaymentCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;

class HandleLoanPaymentCompleted implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(LoanPaymentCompleted $event): void
    {
        $payment = $event->payment;
        $loan = $payment->loan;
        $user = $loan->user;

        $data = [
            '{{user_name}}' => $user->first_name . ' ' . $user->last_name,
            '{{loan_reference}}' => $loan->reference_number,
            '{{payment_amount}}' => $payment->amount,
            '{{payment_date}}' => $payment->payment_date->format('Y-m-d'),
            '{{transaction_id}}' => $payment->transaction_id,
            '{{remaining_balance}}' => $loan->current_balance,
            '{{next_payment_date}}' => $loan->next_payment_due_date?->format('Y-m-d') ?? 'N/A',
            '{{company_name}}' => config('app.name'),
        ];

        // Send email to the user
        Mail::to($user->email)->send(new MailSend('payment_confirmation', $data));

        // Log the email sending
        activity()
            ->performedOn($loan)
            ->causedBy($user)
            ->withProperties([
                'email' => $user->email,
                'loan_id' => $loan->id,
                'loan_reference' => $loan->reference_number,
                'payment_id' => $payment->id,
            ])
            ->log('Payment confirmation email sent');
    }
} 