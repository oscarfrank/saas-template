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
];
