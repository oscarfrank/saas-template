<?php

declare(strict_types=1);

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TenantAiPrompt;
use App\Services\TenantAiPromptResolver;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class OrganizationAiPromptController extends Controller
{
    public function __construct(
        private readonly TenantAiPromptResolver $resolver,
    ) {}

    public function index(Request $request): Response
    {
        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }

        $user = $request->user();
        $canManage = $this->userCanManageAiPrompts($user, $tenant);

        $definitions = config('ai_prompts.definitions', []);
        $overrides = TenantAiPrompt::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_custom', false)
            ->get()
            ->keyBy('key');

        $builtIns = [];
        foreach ($definitions as $key => $meta) {
            $o = $overrides->get($key);
            $builtIns[] = [
                'key' => $key,
                'label' => $meta['label'] ?? $key,
                'description' => $meta['description'] ?? '',
                'group' => $meta['group'] ?? 'Other',
                'variables' => $meta['variables'] ?? [],
                'default' => $meta['default'] ?? '',
                'effective' => $o?->system_prompt ?? ($meta['default'] ?? ''),
                'uses_override' => $o !== null,
            ];
        }
        usort($builtIns, function (array $a, array $b) {
            $g = strcmp($a['group'], $b['group']);
            if ($g !== 0) {
                return $g;
            }

            return strcmp($a['label'], $b['label']);
        });

        $custom = TenantAiPrompt::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_custom', true)
            ->orderBy('label')
            ->get(['key', 'label', 'system_prompt'])
            ->map(fn (TenantAiPrompt $p) => [
                'key' => $p->key,
                'label' => $p->label ?? $p->key,
                'system_prompt' => $p->system_prompt,
            ])
            ->values()
            ->all();

        return Inertia::render('settings/organization/ai-prompts', [
            'built_in_prompts' => $builtIns,
            'custom_prompts' => $custom,
            'can_manage_ai_prompts' => $canManage,
            'custom_key_prefix' => (string) config('ai_prompts.custom_key_prefix', 'custom.'),
        ]);
    }

    public function updateBuiltin(Request $request): RedirectResponse
    {
        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageAiPrompts($user, $tenant)) {
            abort(403);
        }

        $validated = $request->validate([
            'key' => ['required', 'string', 'max:160'],
            'system_prompt' => ['required', 'string', 'max:100000'],
        ]);

        $key = $validated['key'];
        if (! $this->resolver->isBuiltinKey($key)) {
            return back()->withErrors(['key' => 'Unknown built-in prompt key.']);
        }

        TenantAiPrompt::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'key' => $key,
            ],
            [
                'is_custom' => false,
                'label' => null,
                'system_prompt' => $validated['system_prompt'],
            ]
        );
        $this->resolver->forgetCache($tenant->id, $key);

        return back()->with('success', 'Prompt saved.');
    }

    public function resetBuiltin(Request $request): RedirectResponse
    {
        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageAiPrompts($user, $tenant)) {
            abort(403);
        }

        $validated = $request->validate([
            'key' => ['required', 'string', 'max:160'],
        ]);

        $key = $validated['key'];
        if (! $this->resolver->isBuiltinKey($key)) {
            return back()->withErrors(['key' => 'Unknown built-in prompt key.']);
        }

        TenantAiPrompt::query()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->where('is_custom', false)
            ->delete();
        $this->resolver->forgetCache($tenant->id, $key);

        return back()->with('success', 'Prompt reset to default.');
    }

    public function storeCustom(Request $request): RedirectResponse
    {
        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageAiPrompts($user, $tenant)) {
            abort(403);
        }

        $prefix = (string) config('ai_prompts.custom_key_prefix', 'custom.');
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9_-]+$/'],
            'label' => ['required', 'string', 'max:255'],
            'system_prompt' => ['required', 'string', 'max:100000'],
        ]);

        $key = $prefix.$validated['slug'];
        if ($this->resolver->isBuiltinKey($key)) {
            return back()->withErrors(['slug' => 'This slug conflicts with a reserved key.']);
        }
        if (TenantAiPrompt::query()->where('tenant_id', $tenant->id)->where('key', $key)->exists()) {
            return back()->withErrors(['slug' => 'A prompt with this key already exists.']);
        }

        TenantAiPrompt::query()->create([
            'tenant_id' => $tenant->id,
            'key' => $key,
            'is_custom' => true,
            'label' => $validated['label'],
            'system_prompt' => $validated['system_prompt'],
        ]);
        $this->resolver->forgetCache($tenant->id, $key);

        return back()->with('success', 'Custom prompt created.');
    }

    public function updateCustom(Request $request): RedirectResponse
    {
        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageAiPrompts($user, $tenant)) {
            abort(403);
        }

        $validated = $request->validate([
            'key' => ['required', 'string', 'max:160'],
            'label' => ['required', 'string', 'max:255'],
            'system_prompt' => ['required', 'string', 'max:100000'],
        ]);

        $key = $validated['key'];
        if (! $this->resolver->isValidCustomKey($key)) {
            return back()->withErrors(['key' => 'Invalid custom prompt key.']);
        }

        $prompt = TenantAiPrompt::query()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->where('is_custom', true)
            ->first();
        if (! $prompt) {
            return back()->withErrors(['key' => 'Custom prompt not found.']);
        }

        $prompt->update([
            'label' => $validated['label'],
            'system_prompt' => $validated['system_prompt'],
        ]);
        $this->resolver->forgetCache($tenant->id, $key);

        return back()->with('success', 'Custom prompt updated.');
    }

    public function destroyCustom(Request $request): RedirectResponse
    {
        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageAiPrompts($user, $tenant)) {
            abort(403);
        }

        $validated = $request->validate([
            'key' => ['required', 'string', 'max:160'],
        ]);

        $key = $validated['key'];
        if (! $this->resolver->isValidCustomKey($key)) {
            return back()->withErrors(['key' => 'Invalid custom prompt key.']);
        }

        TenantAiPrompt::query()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->where('is_custom', true)
            ->delete();
        $this->resolver->forgetCache($tenant->id, $key);

        return back()->with('success', 'Custom prompt deleted.');
    }

    private function userCanManageAiPrompts(?Authenticatable $user, \App\Models\Tenant $tenant): bool
    {
        if (! $user) {
            return false;
        }
        $pivot = $user->tenants()->where('tenants.id', $tenant->id)->first()?->pivot;

        return $pivot && in_array($pivot->role, ['owner', 'admin'], true);
    }
}
