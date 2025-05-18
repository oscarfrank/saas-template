<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

use App\Events\Loan\LoanActivated;
use App\Events\Loan\LoanPaymentSubmitted;
use App\Events\Loan\LoanPaymentCompleted;
use App\Events\Loan\LoanPaid;
use App\Events\Loan\LoanApproved;
use App\Events\Loan\LoanCreated;

use App\Listeners\Loan\HandleLoanActivated;
use App\Listeners\Loan\HandleLoanPaymentSubmitted;
use App\Listeners\Loan\HandleLoanPaymentCompleted;
use App\Listeners\Loan\HandleLoanPaid;
use App\Listeners\Loan\HandleLoanApproved;
use App\Listeners\Loan\HandleLoanCreated;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        LoanActivated::class => [
            HandleLoanActivated::class,
        ],
        LoanPaymentSubmitted::class => [
            HandleLoanPaymentSubmitted::class,
        ],
        LoanPaymentCompleted::class => [
            HandleLoanPaymentCompleted::class,
        ],
        LoanPaid::class => [
            HandleLoanPaid::class,
        ],
        LoanApproved::class => [
            HandleLoanApproved::class,
        ],
        LoanCreated::class => [
            HandleLoanCreated::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
} 