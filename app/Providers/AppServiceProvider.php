<?php

namespace App\Providers;

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
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

        // Guest middleware: when logged-in user visits /login etc., redirect to /dashboard
        // so the dashboard route can resolve tenant and send to correct landing URL (route('dashboard') requires tenant).
        RedirectIfAuthenticated::redirectUsing(function () {
            return '/dashboard';
        });
    }
}
