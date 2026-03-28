<?php

return [

    /*
    |--------------------------------------------------------------------------
    | URI prefixes excluded from the catalog (internal, tooling, API)
    |--------------------------------------------------------------------------
    */
    'exclude_uri_prefixes' => [
        'api/',
        '_debugbar/',
        'livewire/',
        'sanctum/',
        'broadcasting/',
    ],

    /*
    |--------------------------------------------------------------------------
    | Route name prefixes excluded (optional)
    |--------------------------------------------------------------------------
    */
    'exclude_name_prefixes' => [
        'debugbar.',
        'livewire.',
    ],

];
