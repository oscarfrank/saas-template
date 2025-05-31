<?php

namespace Modules\User\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\User\Events\TwoFactorAuthenticationCodeSent;
use Modules\User\Events\TwoFactorAuthenticationDisabled;
use Modules\User\Events\TwoFactorAuthenticationEnabled;
use Modules\User\Events\UserLoggedIn;
use Modules\User\Listeners\SendTwoFactorAuthenticationCode;
use Modules\User\Listeners\SendTwoFactorAuthenticationDisabled;
use Modules\User\Listeners\SendTwoFactorAuthenticationEnabled;
use Modules\User\Listeners\SendLoginNotification;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event handler mappings for the application.
     *
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        TwoFactorAuthenticationCodeSent::class => [
            SendTwoFactorAuthenticationCode::class,
        ],
        TwoFactorAuthenticationDisabled::class => [
            SendTwoFactorAuthenticationDisabled::class,
        ],
        TwoFactorAuthenticationEnabled::class => [
            SendTwoFactorAuthenticationEnabled::class,
        ],
        UserLoggedIn::class => [
            SendLoginNotification::class,
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
