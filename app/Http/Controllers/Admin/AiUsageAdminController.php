<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Attributes\RouteCatalogEntry;
use App\Http\Controllers\Controller;
use App\Models\AiCallLog;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AiUsageAdminController extends Controller
{
    #[RouteCatalogEntry(
        title: 'AI API usage',
        description: 'Super-admin view of AI call logs, tokens, and filters across tenants.'
    )]
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user || (! $user->hasRole('superadmin') && ! $user->hasRole('super-admin'))) {
            abort(403, 'Only super administrators can view all AI API usage.');
        }

        $validated = $request->validate([
            'tenant_id' => ['nullable', 'string', 'max:64'],
            'provider' => ['nullable', 'string', 'max:64'],
            'model' => ['nullable', 'string', 'max:191'],
            'source' => ['nullable', 'string', 'max:512'],
            'invocation_kind' => ['nullable', 'string', 'in:http,cli'],
            'success' => ['nullable', 'string', 'in:0,1,yes,no,true,false'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = AiCallLog::query()
            ->with(['user:id,first_name,last_name,email']);

        if (! empty($validated['tenant_id'])) {
            $query->where('tenant_id', $validated['tenant_id']);
        }

        if (! empty($validated['provider'])) {
            $query->where('provider', $validated['provider']);
        }

        if (! empty($validated['model'])) {
            $query->where('model', 'like', '%'.$validated['model'].'%');
        }

        if (! empty($validated['source'])) {
            $needle = $validated['source'];
            $query->where(function ($q) use ($needle) {
                $q->where('source', 'like', '%'.$needle.'%')
                    ->orWhere('route_name', 'like', '%'.$needle.'%');
            });
        }

        if (! empty($validated['invocation_kind'])) {
            $query->where('invocation_kind', $validated['invocation_kind']);
        }

        if (isset($validated['success']) && $validated['success'] !== '') {
            $success = filter_var($validated['success'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($success !== null) {
                $query->where('success', $success);
            }
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $logs = $query->latest()->paginate(50)->withQueryString();

        $tenantIds = $logs->getCollection()->pluck('tenant_id')->filter()->unique()->values();
        $tenantsById = $tenantIds->isEmpty()
            ? collect()
            : Tenant::query()->whereIn('id', $tenantIds)->get(['id', 'name', 'slug'])->keyBy('id');

        $logs->getCollection()->transform(function (AiCallLog $log) use ($tenantsById) {
            $tid = $log->tenant_id;
            $t = $tid !== null ? $tenantsById->get($tid) : null;
            $log->setAttribute('tenant_name', $t?->name);
            $log->setAttribute('tenant_slug', $t?->slug);

            return $log;
        });

        $providers = AiCallLog::query()
            ->select('provider')
            ->distinct()
            ->whereNotNull('provider')
            ->orderBy('provider')
            ->pluck('provider')
            ->values()
            ->all();

        return Inertia::render('admin/ai-usage/index', [
            'logs' => $logs,
            'filters' => [
                'tenant_id' => $validated['tenant_id'] ?? '',
                'provider' => $validated['provider'] ?? '',
                'model' => $validated['model'] ?? '',
                'source' => $validated['source'] ?? '',
                'invocation_kind' => $validated['invocation_kind'] ?? '',
                'success' => $validated['success'] ?? '',
                'date_from' => $validated['date_from'] ?? '',
                'date_to' => $validated['date_to'] ?? '',
            ],
            'tenantOptions' => Tenant::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Tenant $t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'slug' => $t->slug,
                ]),
            'providerOptions' => $providers,
        ]);
    }
}
