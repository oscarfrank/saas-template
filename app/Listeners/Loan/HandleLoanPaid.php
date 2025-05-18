<?php

namespace App\Listeners\Loan;

use App\Events\Loan\LoanPaid;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;

class HandleLoanPaid implements ShouldQueue
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
    public function handle(LoanPaid $event): void
    {
        $loan = $event->loan;
        $user = $loan->user;

        $data = [
            '{{user_name}}' => $user->first_name . ' ' . $user->last_name,
            '{{loan_reference}}' => $loan->reference_number,
            '{{company_name}}' => config('app.name'),
        ];

        // Send email to the user
        Mail::to($user->email)->send(new MailSend('loan_completion', $data));

        // Log the email sending
        activity()
            ->performedOn($loan)
            ->causedBy($user)
            ->withProperties([
                'email' => $user->email,
                'loan_id' => $loan->id,
                'loan_reference' => $loan->reference_number,
            ])
            ->log('Loan completion email sent');
    }
} 