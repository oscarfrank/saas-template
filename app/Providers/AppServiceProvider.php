<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use Laravel\Cashier\Cashier;
use Modules\Payment\Models\Customer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Tell Cashier to use Customer model instead of User
        Cashier::useCustomerModel(Customer::class);
    }
}
