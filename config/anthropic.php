<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Anthropic API key
    |--------------------------------------------------------------------------
    |
    | Used when a Cortex agent is set to use Anthropic (Claude) in agent settings.
    |
    */

    'api_key' => env('ANTHROPIC_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Default chat model
    |--------------------------------------------------------------------------
    |
    | Override per agent in Cortex → agent LLM settings (optional chat_model).
    |
    */

    'chat_model' => env('ANTHROPIC_CHAT_MODEL', 'claude-sonnet-4-20250514'),

    /*
    |--------------------------------------------------------------------------
    | Request timeout (seconds)
    |--------------------------------------------------------------------------
    */

    'request_timeout' => env('ANTHROPIC_REQUEST_TIMEOUT', 120),
];
