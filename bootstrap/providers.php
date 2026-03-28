<?php

$providers = [
    App\Providers\AppServiceProvider::class,
    App\Providers\FortifyServiceProvider::class,
    App\Providers\AiUsageServiceProvider::class,
];

if (env('APP_ENV') === 'local') {
    $providers[] = App\Providers\TelescopeServiceProvider::class;
}

return $providers;
