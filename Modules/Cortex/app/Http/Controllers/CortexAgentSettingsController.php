<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Cortex\Http\Controllers\Concerns\InteractsWithCortexLlm;
use Modules\Cortex\Models\CortexAgentLlmSetting;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\CortexAgents;

final class CortexAgentSettingsController extends Controller
{
    use InteractsWithCortexLlm;

    public function show(string $agent): InertiaResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            abort(503);
        }

        try {
            $key = CortexAgentKey::from($agent);
        } catch (\ValueError) {
            abort(404);
        }

        $definitions = CortexAgents::definitions();
        $meta = collect($definitions)->firstWhere('id', $key->value);
        if (! is_array($meta)) {
            abort(404);
        }

        $factory = $this->cortexLlmFactory();
        $llm = CortexAgentLlmSetting::inertiaPropsFor(
            $tenantId,
            $key,
            $factory->isOpenAiKeyConfigured(),
            $factory->isAnthropicKeyConfigured(),
        );

        return Inertia::render('cortex/agents/agent-settings', [
            'agentKey' => $key->value,
            'agentName' => (string) ($meta['name'] ?? $key->value),
            'agentDescription' => (string) ($meta['description'] ?? ''),
            'agentIndexRoute' => (string) ($meta['route'] ?? 'cortex.index'),
            'llm' => $llm,
            'relatedSettings' => $this->relatedSettingsLinks($key),
        ]);
    }

    /**
     * Extra settings destinations for agents that split configuration across multiple pages.
     *
     * @return list<array{label: string, route: string, description: string}>
     */
    private function relatedSettingsLinks(CortexAgentKey $key): array
    {
        return match ($key) {
            CortexAgentKey::Pulse => [
                [
                    'label' => 'Feeds & digest',
                    'route' => 'cortex.agents.pulse.settings',
                    'description' => 'RSS limits, digest schedule, tweet style prompt.',
                ],
                [
                    'label' => 'Manage feeds',
                    'route' => 'cortex.agents.pulse.feeds',
                    'description' => 'Add, refresh, and organize RSS/Atom sources.',
                ],
            ],
            CortexAgentKey::Mirage => [
                [
                    'label' => 'Image generation',
                    'route' => 'cortex.agents.mirage.settings',
                    'description' => 'DALL·E, GPT Image, or Midjourney-compatible API.',
                ],
            ],
            default => [],
        };
    }
}
