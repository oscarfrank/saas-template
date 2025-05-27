<?php

namespace Modules\Loan\Listeners;

use Modules\Loan\Events\LoanCreated;

use App\Models\Transaction;
use App\Mail\MailSend;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class HandleLoanCreated
{
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
    public function handle(LoanCreated $event): void
    {
        $loan = $event->loan;
        $user = $loan->user;

        // // Create transaction record
        // $transaction = Transaction::create([
        //     'reference_number' => 'TRX-' . strtoupper(uniqid()),
        //     'user_id' => $user->id,
        //     'transaction_type' => 'loan_application',
        //     'amount' => $loan->amount,
        //     'currency_id' => $loan->currency_id,
        //     'status' => 'pending',
        //     'loan_id' => $loan->id,
        // ]);

        // Log activity
        // activity()
        //     ->performedOn($loan)
        //     ->causedBy($user)
        //     ->withProperties([
        //         'loan_id' => $loan->id,
        //         'amount' => $loan->amount,
        //         'currency' => $loan->currency->code,
        //         'transaction_id' => $transaction->id
        //     ])
        //     ->log('Loan application submitted');

        // Prepare data for email templates
        $emailData = [
            'user_name' => $user->name,
            'loan_reference' => $loan->reference_number,
            'loan_amount' => number_format($loan->amount, 2),
            'loan_term' => $loan->duration_days . ' days',
            'loan_purpose' => $loan->purpose ?? 'Not specified',
            'processing_time' => '2-3 business days',
            'company_name' => config('app.name'),
            'user_email' => $user->email,
        ];

        // Send email to user
        Mail::to($user->email)
            ->send(new MailSend('loan_application_received', $emailData, 'Loan Application Received'));

        // Send email to admin
        // Mail::to(config('mail.admin_email'))
        Mail::to('oscarminiblog@gmail.com')
            ->send(new MailSend('admin_loan_application_received', $emailData, 'New Loan Application Received'));
    }
} 