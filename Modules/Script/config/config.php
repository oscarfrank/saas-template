<?php

return [
    'name' => 'Script',

    /*
     * Slug of the tenant whose scripts are shown on the public production calendar (/production-calendar).
     * If null or empty, the first tenant (by ID) is used. Set in production if you have multiple orgs.
     */
    'public_calendar_tenant_slug' => env('SCRIPT_PUBLIC_CALENDAR_TENANT_SLUG'),
];
