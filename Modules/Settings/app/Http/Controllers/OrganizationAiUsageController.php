<?php

declare(strict_types=1);

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AiCallLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class OrganizationAiUsageController extends Controller
{
    public function index(Request $request): Response
    {
        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }

        $logs = AiCallLog::query()
            ->where('tenant_id', $tenant->id)
            ->with(['user:id,first_name,last_name,email'])
            ->latest()
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('settings/organization/ai-usage', [
            'logs' => $logs,
        ]);
    }
}
