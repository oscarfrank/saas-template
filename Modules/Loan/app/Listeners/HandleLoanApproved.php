<?php

namespace Modules\Loan\Listeners;

use Modules\Loan\Events\LoanApproved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;
use Illuminate\Support\Facades\Log;

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
        Log::info('HandleLoanApproved listener called', [
            'loan_id' => $event->loan->id,
            'user_id' => $event->loan->user_id
        ]);

        try {
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

            Log::info('Sending loan approval email', [
                'to' => $user->email,
                'data' => $data
            ]);

            // Send email to the user
            Mail::to($user->email)->send(new MailSend('loan_approval', $data));

            Log::info('Loan approval email sent successfully');

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
        } catch (\Exception $e) {
            Log::error('Error in HandleLoanApproved listener', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
} 