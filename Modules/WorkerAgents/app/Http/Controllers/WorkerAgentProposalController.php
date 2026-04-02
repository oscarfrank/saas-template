<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\WorkerAgents\Models\WorkerAgentProposal;
use Modules\WorkerAgents\Services\WorkerAgentProposalApplier;
use Modules\WorkerAgents\Support\WorkerAgentProposalStatus;
use Modules\WorkerAgents\Support\WorkerAgentProposalType;

class WorkerAgentProposalController extends Controller
{
    public function __construct(
        private readonly WorkerAgentProposalApplier $applier,
    ) {}

    public function index(): Response
    {
        $proposals = WorkerAgentProposal::query()
            ->where('status', WorkerAgentProposalStatus::Pending)
            ->with(['workerAgent:id,uuid,name'])
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (WorkerAgentProposal $p) => [
                'uuid' => $p->uuid,
                'type' => $p->type instanceof WorkerAgentProposalType ? $p->type->value : (string) $p->type,
                'payload' => $p->payload ?? [],
                'worker' => $p->workerAgent !== null
                    ? ['uuid' => $p->workerAgent->uuid, 'name' => $p->workerAgent->name]
                    : null,
                'created_at' => $p->created_at?->toIso8601String(),
            ]);

        return Inertia::render('worker-agents/proposals/index', [
            'proposals' => $proposals,
        ]);
    }

    public function approve(WorkerAgentProposal $proposal): RedirectResponse
    {
        $this->assertTenant($proposal);

        if ($proposal->status !== WorkerAgentProposalStatus::Pending) {
            return redirect()->back()->with('error', 'This proposal is no longer pending.');
        }

        DB::transaction(function () use ($proposal): void {
            $worker = $proposal->workerAgent;
            if ($worker === null) {
                throw new \RuntimeException('Missing worker agent.');
            }

            if ($proposal->type === WorkerAgentProposalType::TaskCreate) {
                $this->applier->applyTaskCreate($worker, $proposal->payload ?? []);
            }

            $proposal->update([
                'status' => WorkerAgentProposalStatus::Applied,
                'reviewed_by_user_id' => auth()->id(),
                'reviewed_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Proposal applied.');
    }

    public function reject(Request $request, WorkerAgentProposal $proposal): RedirectResponse
    {
        $this->assertTenant($proposal);

        if ($proposal->status !== WorkerAgentProposalStatus::Pending) {
            return redirect()->back()->with('error', 'This proposal is no longer pending.');
        }

        $validated = $request->validate([
            'review_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $proposal->update([
            'status' => WorkerAgentProposalStatus::Rejected,
            'reviewed_by_user_id' => auth()->id(),
            'reviewed_at' => now(),
            'review_note' => $validated['review_note'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Proposal rejected.');
    }

    private function assertTenant(WorkerAgentProposal $proposal): void
    {
        if ((string) $proposal->tenant_id !== (string) tenant('id')) {
            abort(404);
        }
    }
}
