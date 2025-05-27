<?php

return [
    'gateways' => [
        'paystack' => [
            'enabled' => env('PAYSTACK_ENABLED', false),
        ],
        'flutterwave' => [
            'enabled' => env('FLUTTERWAVE_ENABLED', false),
        ],
        'stripe' => [
            'enabled' => env('STRIPE_ENABLED', false),
        ],
    ],
    'ngn_priority' => env('NGN_GATEWAY', 'paystack'), // which one handles NGN if multiple
];
