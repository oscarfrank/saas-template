<?php

namespace App\Listeners\Loan;

use App\Events\Loan\LoanActivated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;

class HandleLoanActivated implements ShouldQueue
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
    public function handle(LoanActivated $event): void
    {
        $loan = $event->loan;
        $user = $loan->user;

        $data = [
            '{{user_name}}' => $user->first_name . ' ' . $user->last_name,
            '{{loan_reference}}' => $loan->reference_number,
            '{{loan_amount}}' => $loan->amount,
            '{{currency}}' => $loan->currency->code,
            '{{start_date}}' => $loan->start_date->format('Y-m-d'),
            '{{end_date}}' => $loan->end_date->format('Y-m-d'),
            '{{company_name}}' => config('app.name'),
        ];

        // Send email to the user
        Mail::to($user->email)->send(new MailSend('loan_activated', $data));

        // Log the email sending
        activity()
            ->performedOn($loan)
            ->causedBy($user)
            ->withProperties([
                'email' => $user->email,
                'loan_id' => $loan->id,
                'loan_reference' => $loan->reference_number,
            ])
            ->log('Loan activation email sent');
    }
} 