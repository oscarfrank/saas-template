<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default landing when org setting is still "dashboard" (hub)
    |--------------------------------------------------------------------------
    | The hub picker is not the primary UX; bare "dashboard" in tenant data
    | resolves to this path for redirects and sidebar "Dashboard".
    */
    'fallback_landing_path' => 'dashboard/workspace',

    /*
    |--------------------------------------------------------------------------
    | Organization default landing — path => label (super admin toggles which apply)
    |--------------------------------------------------------------------------
    */
    'org_default_landing_paths' => [
        'dashboard/workspace' => 'Workspace',
        'dashboard/youtuber' => 'YouTuber',
        'dashboard/borrower' => 'Borrower',
        'dashboard/lender' => 'Lender',
    ],

    /*
    |--------------------------------------------------------------------------
    | Homepage themes
    |--------------------------------------------------------------------------
    | Slug => display name. Each theme has its own folder under
    | resources/js/pages/homepage/{slug}/ with welcome, about, contact, etc.
    */
    'themes' => [
        'lending' => 'Lending',
        'youtube-studio' => 'YouTube Studio',
        'oscarmini' => 'OscarMini',
        'vault' => 'Vault',
        'nexus' => 'Nexus',
        'academy' => 'Academy',
        'redirect' => 'Redirect',
    ],

];
