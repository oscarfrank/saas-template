<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'flutterwave' => [
        'base_url' => env('FLW_BASE_URL', 'https://api.flutterwave.com/v3'),
        'public_key' => env('FLW_PUBLIC_KEY'),
        'secret_key' => env('FLW_SECRET_KEY'),
        'secret_hash' => env('FLW_SECRET_HASH'), // Optional for webhook validation
    ],

    'paystack' => [
        'base_url' => env('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),
        'currency' => 'NGN', // Default currency
    ],

    // Authentications.

    // Github
    'github' => [
        'client_id' => env('AUTH_GITHUB_CLIENT_ID'),
        'client_secret' => env('AUTH_GITHUB_CLIENT_SECRET'),
        'redirect' => env('AUTH_GITHUB_REDIRECT', env('APP_URL') . ':8000/auth/github/callback'),
    ],

    // Google
    'google' => [
        'client_id' => env('AUTH_GOOGLE_CLIENT_ID'),
        'client_secret' => env('AUTH_GOOGLE_CLIENT_SECRET'),
        'redirect' => env('AUTH_GOOGLE_REDIRECT', env('APP_URL') . ':8000/auth/google/callback'),
    ],

    // Facebook
    'facebook' => [
        'client_id' => env('AUTH_FACEBOOK_CLIENT_ID'),
        'client_secret' => env('AUTH_FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('AUTH_FACEBOOK_REDIRECT', env('APP_URL') . ':8000/auth/facebook/callback'),
    ],
];
