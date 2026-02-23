<?php

$providers = [
    App\Providers\AppServiceProvider::class,
    App\Providers\FortifyServiceProvider::class,
];

if (env('APP_ENV') === 'local') {
    $providers[] = App\Providers\TelescopeServiceProvider::class;
}

return $providers;
