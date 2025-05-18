<?php

namespace App\Listeners\Loan;

use App\Events\Loan\LoanPaymentSubmitted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;

class HandleLoanPaymentSubmitted implements ShouldQueue
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
    public function handle(LoanPaymentSubmitted $event): void
    {
        $payment = $event->payment;
        $loan = $payment->loan;
        $user = $loan->user;

        $data = [
            '{{user_name}}' => $user->first_name . ' ' . $user->last_name,
            '{{loan_reference}}' => $loan->reference_number,
            '{{payment_amount}}' => $payment->amount,
            '{{payment_date}}' => $payment->created_at->format('Y-m-d'),
            '{{payment_reference}}' => $payment->reference_number,
            '{{company_name}}' => config('app.name'),
        ];

        // Send email to the user
        Mail::to($user->email)->send(new MailSend('payment_submitted', $data));

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
            ->log('Payment submission email sent');
    }
} 