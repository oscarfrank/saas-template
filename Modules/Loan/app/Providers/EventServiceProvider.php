<?php

namespace Modules\Loan\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

use Modules\Loan\Events\LoanActivated;
use Modules\Loan\Listeners\HandleLoanActivated;
use Modules\Loan\Events\LoanApproved;
use Modules\Loan\Listeners\HandleLoanApproved;
use Modules\Loan\Events\LoanCreated;
use Modules\Loan\Listeners\HandleLoanCreated;
use Modules\Loan\Events\LoanPaid;
use Modules\Loan\Listeners\HandleLoanPaid;
use Modules\Loan\Events\LoanPaymentCompleted;
use Modules\Loan\Listeners\HandleLoanPaymentCompleted;
use Modules\Loan\Events\LoanPaymentSubmitted;
use Modules\Loan\Listeners\HandleLoanPaymentSubmitted;



class EventServiceProvider extends ServiceProvider
{
    /**
     * The event handler mappings for the application.
     *
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        LoanActivated::class => [
            HandleLoanActivated::class,
        ],
        LoanApproved::class => [
            HandleLoanApproved::class,
        ],
        LoanCreated::class => [
            HandleLoanCreated::class,
        ],
        LoanPaid::class => [
            HandleLoanPaid::class,
        ],
        LoanPaymentCompleted::class => [
            HandleLoanPaymentCompleted::class,
        ],
        LoanPaymentSubmitted::class => [
            HandleLoanPaymentSubmitted::class,
        ],        
        
    ];

    /**
     * Indicates if events should be discovered.
     *
     * @var bool
     */
    protected static $shouldDiscoverEvents = true;

    /**
     * Configure the proper event listeners for email verification.
     */
    protected function configureEmailVerification(): void {}
}
