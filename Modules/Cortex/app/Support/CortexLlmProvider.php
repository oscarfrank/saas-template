<?php

declare(strict_types=1);

namespace Modules\Cortex\Support;

enum CortexLlmProvider: string
{
    case OpenAI = 'openai';
    case Anthropic = 'anthropic';
}
