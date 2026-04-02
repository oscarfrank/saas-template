<?php

return [
    'name' => 'Cortex',
    'description' => 'AI agents powered by Neuron (OpenAI and tools).',

    /*
    |--------------------------------------------------------------------------
    | Agent HTTP request max execution time (seconds)
    |--------------------------------------------------------------------------
    |
    | PHP's default max_execution_time (often 30) kills long agent runs while
    | Guzzle is waiting on OpenAI or YouTube. This value is applied only when
    | running an agent from HTTP. Set to 0 for no limit (use with care).
    |
    */
    'agent_max_execution_time' => (int) env('CORTEX_AGENT_MAX_EXECUTION_TIME', 300),

    /*
    |--------------------------------------------------------------------------
    | LLM model pickers (Cortex agent settings)
    |--------------------------------------------------------------------------
    |
    | IDs must match the provider API. Labels are shown in the UI only.
    |
    */
    'llm_model_options' => [
        'openai' => [
            ['id' => 'gpt-5.4', 'label' => 'GPT-5.4'],
            ['id' => 'gpt-5.4-mini', 'label' => 'GPT-5.4 mini'],
            ['id' => 'gpt-5.4-nano', 'label' => 'GPT-5.4 nano'],
            ['id' => 'gpt-5.4-pro', 'label' => 'GPT-5.4 pro'],
        ],
        'anthropic' => [
            ['id' => 'claude-sonnet-4-5-20250929', 'label' => 'Claude Sonnet 4.5'],
            ['id' => 'claude-sonnet-4-6', 'label' => 'Claude Sonnet 4.6'],
            ['id' => 'claude-opus-4-5-20251101', 'label' => 'Claude Opus 4.5'],
            ['id' => 'claude-opus-4-6', 'label' => 'Claude Opus 4.6'],
        ],
    ],
];
