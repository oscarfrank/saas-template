<?php

namespace App\Listeners\Loan;

use App\Events\Loan\LoanApproved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;

class HandleLoanApproved implements ShouldQueue
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
    public function handle(LoanApproved $event): void
    {
        $loan = $event->loan;
        $user = $loan->user;

        $data = [
            '{{user_name}}' => $user->first_name . ' ' . $user->last_name,
            '{{loan_reference}}' => $loan->reference_number,
            '{{loan_amount}}' => $loan->amount,
            '{{loan_term}}' => $loan->duration_days . ' days',
            '{{interest_rate}}' => $loan->interest_rate . '%',
            '{{monthly_payment}}' => $loan->next_payment_amount ?? 'N/A',
            '{{loan_acceptance_link}}' => route('user-loans.show', $loan),
            '{{company_name}}' => config('app.name'),
        ];

        // Send email to the user
        Mail::to($user->email)->send(new MailSend('loan_approval', $data));

        // Log the email sending
        activity()
            ->performedOn($loan)
            ->causedBy($user)
            ->withProperties([
                'email' => $user->email,
                'loan_id' => $loan->id,
                'loan_reference' => $loan->reference_number,
            ])
            ->log('Loan approval email sent');
    }
} 