<?php

namespace Modules\Loan\Database\Seeders;

use Modules\Loan\Models\Loan;
use Modules\User\Models\User;
use Modules\Payment\Models\Currency;
use Modules\Loan\Models\LoanPackage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LoanSeeder extends Seeder
{
    public function run(): void
    {
        // Get or create some test users
        $users = User::take(5)->get();
        if ($users->isEmpty()) {
            $users = User::factory(5)->create();
        }

        // Get or create currencies
        $currencies = Currency::take(4)->get();
        if ($currencies->isEmpty()) {
            $currencies = collect([
                ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
                ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
                ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£'],
                ['code' => 'NGN', 'name' => 'Nigerian Naira', 'symbol' => '₦'],
            ])->map(function ($currency) {
                return Currency::create($currency);
            });
        }

        // Get or create loan packages
        $packages = LoanPackage::take(3)->get();
        if ($packages->isEmpty()) {
            $packages = collect([
                [
                    'name' => 'Basic Loan',
                    'interest_rate' => 5.5,
                    'min_amount' => 1000,
                    'max_amount' => 5000,
                ],
                [
                    'name' => 'Standard Loan',
                    'interest_rate' => 7.5,
                    'min_amount' => 5000,
                    'max_amount' => 20000,
                ],
                [
                    'name' => 'Premium Loan',
                    'interest_rate' => 9.5,
                    'min_amount' => 20000,
                    'max_amount' => 100000,
                ],
            ])->map(function ($package) {
                return LoanPackage::create($package);
            });
        }

        // Loan statuses with their probabilities
        $statuses = [
            'draft' => 5,
            'pending' => 10,
            'approved' => 15,
            'rejected' => 5,
            'disbursed' => 15,
            'active' => 20,
            'in_arrears' => 5,
            'defaulted' => 5,
            'paid' => 15,
            'closed' => 3,
            'cancelled' => 2,
        ];

        // Generate 50 loans
        for ($i = 0; $i < 50; $i++) {
            $user = $users->random();
            // Ensure some active loans use NGN
            $currency = $i < 15 ? $currencies->where('code', 'NGN')->first() : $currencies->random();
            $package = $packages->random();
            
            // Generate random amount between package min and max
            $amount = rand($package->min_amount, $package->max_amount);
            
            // Generate random duration between 30 and 365 days
            $duration = rand(30, 365);
            
            // Calculate start and end dates
            $startDate = now()->subDays(rand(0, 365));
            $endDate = $startDate->copy()->addDays($duration);
            
            // Select status based on probabilities
            $status = $this->getRandomStatus($statuses);
            
            // Calculate status-specific dates
            $statusDates = $this->calculateStatusDates($status, $startDate, $endDate);
            
            // Calculate payment amounts
            $monthlyPayment = $this->calculateMonthlyPayment($amount, $package->interest_rate, $duration);
            $totalPayments = ceil($duration / 30); // Assuming monthly payments
            
            Loan::create([
                'user_id' => $user->id,
                'package_id' => $package->id,
                'reference_number' => 'LOAN-' . strtoupper(Str::random(8)),
                'purpose' => $this->getRandomPurpose(),
                'amount' => $amount,
                'currency_id' => $currency->id,
                'interest_rate' => $package->interest_rate,
                'interest_type' => 'simple',
                'interest_calculation' => 'monthly',
                'interest_payment_frequency' => 'monthly',
                'duration_days' => $duration,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
                'submitted_at' => $statusDates['submitted_at'],
                'approved_at' => $statusDates['approved_at'],
                'rejected_at' => $statusDates['rejected_at'],
                'disbursed_at' => $statusDates['disbursed_at'],
                'defaulted_at' => $statusDates['defaulted_at'],
                'paid_at' => $statusDates['paid_at'],
                'closed_at' => $statusDates['closed_at'],
                'monthly_payment_amount' => $monthlyPayment,
                'total_payments' => $totalPayments,
                'completed_payments' => $this->calculateCompletedPayments($status, $totalPayments),
                'principal_paid' => $this->calculatePrincipalPaid($status, $amount),
                'interest_paid' => $this->calculateInterestPaid($status, $amount, $package->interest_rate),
                'fees_paid' => $this->calculateFeesPaid($status, $amount),
                'principal_remaining' => $this->calculatePrincipalRemaining($status, $amount),
                'total_amount_due' => $this->calculateTotalAmountDue($status, $amount, $package->interest_rate),
                'current_balance' => $this->calculateCurrentBalance($status, $amount, $package->interest_rate),
                'days_past_due' => $this->calculateDaysPastDue($status),
                'next_payment_due_date' => $this->calculateNextPaymentDueDate($status, $startDate),
                'next_payment_amount' => $this->calculateNextPaymentAmount($status, $monthlyPayment),
                'last_payment_date' => $this->calculateLastPaymentDate($status, $startDate),
                'last_payment_amount' => $this->calculateLastPaymentAmount($status, $monthlyPayment),
                'created_at' => $startDate->subDays(rand(1, 10)), // Created before start date
                'updated_at' => now(),
            ]);
        }
    }

    private function getRandomStatus(array $statuses): string
    {
        $total = array_sum($statuses);
        $rand = rand(1, $total);
        $current = 0;
        
        foreach ($statuses as $status => $weight) {
            $current += $weight;
            if ($rand <= $current) {
                return $status;
            }
        }
        
        return 'draft'; // Fallback
    }

    private function calculateStatusDates(string $status, $startDate, $endDate): array
    {
        $dates = [
            'submitted_at' => null,
            'approved_at' => null,
            'rejected_at' => null,
            'disbursed_at' => null,
            'defaulted_at' => null,
            'paid_at' => null,
            'closed_at' => null,
        ];

        switch ($status) {
            case 'draft':
                break;
            case 'pending':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(1, 5));
                break;
            case 'approved':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['approved_at'] = $startDate->copy()->subDays(rand(1, 5));
                break;
            case 'rejected':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['rejected_at'] = $startDate->copy()->subDays(rand(1, 5));
                break;
            case 'disbursed':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(11, 15));
                $dates['approved_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['disbursed_at'] = $startDate;
                break;
            case 'active':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(11, 15));
                $dates['approved_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['disbursed_at'] = $startDate;
                break;
            case 'in_arrears':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(11, 15));
                $dates['approved_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['disbursed_at'] = $startDate;
                break;
            case 'defaulted':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(11, 15));
                $dates['approved_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['disbursed_at'] = $startDate;
                $dates['defaulted_at'] = $startDate->copy()->addDays(rand(30, 60));
                break;
            case 'paid':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(11, 15));
                $dates['approved_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['disbursed_at'] = $startDate;
                $dates['paid_at'] = $endDate;
                break;
            case 'closed':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(11, 15));
                $dates['approved_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['disbursed_at'] = $startDate;
                $dates['closed_at'] = $endDate;
                break;
            case 'cancelled':
                $dates['submitted_at'] = $startDate->copy()->subDays(rand(6, 10));
                $dates['closed_at'] = $startDate->copy()->subDays(rand(1, 5));
                break;
        }

        return $dates;
    }

    private function getRandomPurpose(): string
    {
        $purposes = [
            'Home Renovation',
            'Business Expansion',
            'Debt Consolidation',
            'Education',
            'Medical Expenses',
            'Wedding',
            'Vacation',
            'Car Purchase',
            'Emergency Fund',
            'Investment',
        ];

        return $purposes[array_rand($purposes)];
    }

    private function calculateMonthlyPayment(float $amount, float $interestRate, int $duration): float
    {
        $monthlyRate = $interestRate / 100 / 12;
        $numberOfPayments = ceil($duration / 30);
        
        if ($monthlyRate === 0) {
            return $amount / $numberOfPayments;
        }
        
        return ($amount * $monthlyRate * pow(1 + $monthlyRate, $numberOfPayments)) / 
               (pow(1 + $monthlyRate, $numberOfPayments) - 1);
    }

    private function calculateCompletedPayments(string $status, int $totalPayments): int
    {
        $statusProgress = [
            'draft' => 0,
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
            'disbursed' => 0,
            'active' => rand(1, $totalPayments - 1),
            'in_arrears' => rand(1, $totalPayments - 1),
            'defaulted' => rand(1, $totalPayments - 1),
            'paid' => $totalPayments,
            'closed' => $totalPayments,
            'cancelled' => 0,
        ];

        return $statusProgress[$status] ?? 0;
    }

    private function calculatePrincipalPaid(string $status, float $amount): float
    {
        $statusProgress = [
            'draft' => 0,
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
            'disbursed' => 0,
            'active' => $amount * rand(10, 50) / 100,
            'in_arrears' => $amount * rand(10, 50) / 100,
            'defaulted' => $amount * rand(10, 50) / 100,
            'paid' => $amount,
            'closed' => $amount,
            'cancelled' => 0,
        ];

        return $statusProgress[$status] ?? 0;
    }

    private function calculateInterestPaid(string $status, float $amount, float $interestRate): float
    {
        $principalPaid = $this->calculatePrincipalPaid($status, $amount);
        return $principalPaid * ($interestRate / 100);
    }

    private function calculateFeesPaid(string $status, float $amount): float
    {
        $statusProgress = [
            'draft' => 0,
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
            'disbursed' => 0,
            'active' => $amount * 0.01,
            'in_arrears' => $amount * 0.02,
            'defaulted' => $amount * 0.03,
            'paid' => $amount * 0.01,
            'closed' => $amount * 0.01,
            'cancelled' => 0,
        ];

        return $statusProgress[$status] ?? 0;
    }

    private function calculatePrincipalRemaining(string $status, float $amount): float
    {
        $principalPaid = $this->calculatePrincipalPaid($status, $amount);
        return $amount - $principalPaid;
    }

    private function calculateTotalAmountDue(string $status, float $amount, float $interestRate): float
    {
        if (in_array($status, ['paid', 'closed'])) {
            return 0;
        }

        $principalRemaining = $this->calculatePrincipalRemaining($status, $amount);
        $interestDue = $principalRemaining * ($interestRate / 100);
        $feesDue = $amount * 0.01;

        return $principalRemaining + $interestDue + $feesDue;
    }

    private function calculateCurrentBalance(string $status, float $amount, float $interestRate): float
    {
        return $this->calculateTotalAmountDue($status, $amount, $interestRate);
    }

    private function calculateDaysPastDue(string $status): int
    {
        $statusDays = [
            'draft' => 0,
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
            'disbursed' => 0,
            'active' => 0,
            'in_arrears' => rand(1, 30),
            'defaulted' => rand(31, 90),
            'paid' => 0,
            'closed' => 0,
            'cancelled' => 0,
        ];

        return $statusDays[$status] ?? 0;
    }

    private function calculateNextPaymentDueDate(string $status, $startDate)
    {
        if (!in_array($status, ['active', 'in_arrears'])) {
            return null;
        }

        return $startDate->copy()->addDays(rand(1, 30));
    }

    private function calculateNextPaymentAmount(string $status, float $monthlyPayment)
    {
        if (!in_array($status, ['active', 'in_arrears'])) {
            return null;
        }

        return $monthlyPayment;
    }

    private function calculateLastPaymentDate(string $status, $startDate)
    {
        if (!in_array($status, ['active', 'in_arrears', 'paid', 'closed'])) {
            return null;
        }

        return $startDate->copy()->addDays(rand(1, 30));
    }

    private function calculateLastPaymentAmount(string $status, float $monthlyPayment)
    {
        if (!in_array($status, ['active', 'in_arrears', 'paid', 'closed'])) {
            return null;
        }

        return $monthlyPayment;
    }
} 