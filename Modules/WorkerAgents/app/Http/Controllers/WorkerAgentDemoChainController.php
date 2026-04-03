<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\WorkerAgents\Jobs\RunWorkerAgentJob;
use Modules\WorkerAgents\Services\WorkerAgentDemoChainService;

final class WorkerAgentDemoChainController extends Controller
{
    public function __construct(
        private readonly WorkerAgentDemoChainService $demoChain,
    ) {}

    public function show(Request $request): Response
    {
        $initialResult = $request->session()->pull('demo_chain_result');

        return Inertia::render('worker-agents/demo-chain', [
            'initial_result' => $initialResult,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'run_after' => ['sometimes', 'boolean'],
        ]);

        $tenantId = (string) tenant('id');
        $result = $this->demoChain->prepare($tenantId);

        $runAfter = $request->boolean('run_after');
        $message = 'Demo chain scenario is ready.';
        if ($runAfter) {
            RunWorkerAgentJob::dispatch($tenantId, $result->lead->id, 'demo_chain');
            $message .= ' Lead run queued.';
        }

        return redirect()
            ->route('worker-agents.demo-chain', ['tenant' => tenant('slug')])
            ->with('success', $message)
            ->with('demo_chain_result', $result->toSessionPayload($runAfter));
    }
}
