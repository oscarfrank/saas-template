<?php

namespace App\Http\Controllers;

use Modules\Loan\Models\Loan;
use Modules\User\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class CronController extends Controller
{
    /**
     * Check for loans that need monthly interest payment reminders
     *
     * @return Response
     */
    public function checkCompletedLoans()
    {
        try {
            // Get all active loans
            $activeLoans = Loan::where('status', 'active')->get();
            $processedLoans = 0;

            foreach ($activeLoans as $loan) {
                $startDate = Carbon::parse($loan->start_date);
                $now = Carbon::now();
                
                // Calculate the number of months since the loan started
                $monthsSinceStart = $startDate->diffInMonths($now);
                
                // If we're on the same day of the month as the start date
                if ($startDate->day === $now->day) {
                    // Calculate the interest amount for this month
                    $monthlyInterest = $this->calculateMonthlyInterest($loan);
                    
                    // Get the borrower
                    $borrower = $loan->user;

                    // Send email to borrower
                    if ($borrower) {
                        Mail::send('emails.loan-interest-reminder', [
                            'loan' => $loan,
                            'user' => $borrower,
                            'interest_amount' => $monthlyInterest,
                            'payment_number' => $monthsSinceStart + 1
                        ], function ($message) use ($borrower) {
                            $message->to($borrower->email)
                                ->subject('Monthly Interest Payment Reminder');
                        });
                    }

                    $processedLoans++;
                }
            }

            return response()->json([
                'message' => 'Monthly interest reminders processed successfully',
                'processed_loans' => $processedLoans
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to process monthly interest reminders',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate the monthly interest amount for a loan
     *
     * @param Loan $loan
     * @return float
     */
    private function calculateMonthlyInterest(Loan $loan)
    {
        // Assuming the loan has an interest_rate field
        $annualInterestRate = $loan->interest_rate;
        $monthlyInterestRate = $annualInterestRate / 12;
        
        return ($loan->amount * $monthlyInterestRate) / 100;
    }
} 